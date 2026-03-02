#!/usr/bin/env bash
set -euo pipefail

PARENT_PAGE_ID="${PARENT_PAGE_ID:-REPLACE_WITH_PARENT_PAGE_ID}"
CONNECTED_ACCOUNT_ID="${CONNECTED_ACCOUNT_ID:-REPLACE_WITH_CONNECTED_ACCOUNT_ID}"
WORKSPACE_DIR="${WORKSPACE_DIR:-/root/openclaw-workspace}"

TMP_CHILD_JSON="$(mktemp)"
TMP_CHILD_IDS="$(mktemp)"
TMP_EXISTING_IDS="$(mktemp)"
trap 'rm -f "$TMP_CHILD_JSON" "$TMP_CHILD_IDS" "$TMP_EXISTING_IDS"' EXIT

cd "$WORKSPACE_DIR"

openclaw composio tools exec NOTION_FETCH_BLOCK_CONTENTS \
  --skill notion-operator \
  --account-env COMPOSIO_CONNECTED_ACCOUNT_ID_NOTION \
  --args "{\"block_id\":\"$PARENT_PAGE_ID\"}" \
  --json > "$TMP_CHILD_JSON"

jq -r '
  [
    .. | objects
    | select(.type? == "child_page")
    | .id?
  ]
  | unique
  | .[]
' "$TMP_CHILD_JSON" | sort -u > "$TMP_CHILD_IDS"

curl -s https://backend.composio.dev/api/v3/trigger_instances/active \
  -H "X-API-KEY: $COMPOSIO_API_KEY" \
  | jq -r '
      .items[]
      | select(.trigger_name=="NOTION_COMMENTS_ADDED_TRIGGER")
      | .trigger_config.block_id
    ' | sort -u > "$TMP_EXISTING_IDS"

while IFS= read -r block_id; do
  [ -z "$block_id" ] && continue

  if grep -qx "$block_id" "$TMP_EXISTING_IDS"; then
    echo "skip already-covered $block_id"
    continue
  fi

  echo "creating comment trigger for child page $block_id"
  curl -s -X POST "https://backend.composio.dev/api/v3/trigger_instances/NOTION_COMMENTS_ADDED_TRIGGER/upsert" \
    -H "X-API-KEY: $COMPOSIO_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"connected_account_id\": \"$CONNECTED_ACCOUNT_ID\",
      \"trigger_config\": {
        \"block_id\": \"$block_id\",
        \"interval\": 1
      }
    }" >/dev/null
done < "$TMP_CHILD_IDS"
