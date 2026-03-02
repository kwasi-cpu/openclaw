#!/usr/bin/env bash
set -euo pipefail

WORKSPACE_DIR="${WORKSPACE_DIR:-/root/openclaw-workspace}"
SOURCE_FILE="${SOURCE_FILE:-$WORKSPACE_DIR/scripts/composio-bridge/notion-comment-bridge.template.mjs}"
TARGET_DIR="${TARGET_DIR:-/opt/composio-bridge}"
TARGET_FILE="${TARGET_FILE:-$TARGET_DIR/bridge.mjs}"
BACKUP_SUFFIX="$(date +%F-%H%M%S)"

if [ ! -f "$SOURCE_FILE" ]; then
  echo "missing source bridge template: $SOURCE_FILE" >&2
  exit 1
fi

mkdir -p "$TARGET_DIR"

if [ -f "$TARGET_FILE" ]; then
  cp "$TARGET_FILE" "$TARGET_FILE.bak.$BACKUP_SUFFIX"
fi

cp "$SOURCE_FILE" "$TARGET_FILE"

node --check "$TARGET_FILE"
systemctl restart composio-bridge
systemctl status composio-bridge --no-pager

echo "installed bridge template from $SOURCE_FILE to $TARGET_FILE"
