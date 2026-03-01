---
name: notion-operator
description: Manage Notion via Composio with search-first, low-duplication workflows, and explicit change summaries.
metadata:
  {
    "openclaw":
      {
        "emoji": "🧠",
        "requires":
          {
            "env":
              [
                "COMPOSIO_API_KEY",
                "COMPOSIO_CONNECTED_ACCOUNT_ID_NOTION",
                "COMPOSIO_USER_ID_NOTION",
              ],
          },
      },
  }
---

# notion-operator

Use this skill when the user asks to read, create, or update Notion content.

## Integration path

1. Use the shared Composio helper at `src/infra/composio/client.ts` through the CLI surface `openclaw composio ...` rather than ad hoc curl when code changes are needed.
2. Use `COMPOSIO_CONNECTED_ACCOUNT_ID_NOTION` for Notion tool execution.
3. Use `COMPOSIO_USER_ID_NOTION` when the connected account requires a Composio user id for execution.
4. Preferred command flow:
   - `openclaw composio tools list --toolkit notion --skill notion-operator`
   - `openclaw composio tools get <TOOL_SLUG> --skill notion-operator`
   - `openclaw composio tools exec <TOOL_SLUG> --skill notion-operator --account-env COMPOSIO_CONNECTED_ACCOUNT_ID_NOTION --args '{"...":"..."}'`

## Workflow

1. Find the correct Notion tool for the requested action.
2. Inspect required input shape before executing.
3. Execute against the connected Notion account.
4. Return a short summary with the resulting page ID or URL when available.

## Core behavior

1. Search before creating anything new.
2. Reuse or update existing pages when possible.
3. Do not delete, archive, or bulk-edit unless the user explicitly asks.
4. If the request is unclear, ask one short clarifying question.
5. Keep edits minimal and reversible.

## Scope guardrails

1. Work only in approved pages and databases for this workspace.
2. If a page or database is not shared with the integration, stop and report missing access.
3. Do not move or rename top-level structures unless explicitly requested.

## Quality checklist

1. Normalize titles and avoid near-duplicate pages.
2. Keep key properties consistent when present (status, owner, date).
3. Keep formatting clean with short sections and low noise.

## Response format

Return:

1. What changed.
2. Where it changed (page title and link when available).
3. What was skipped and why.
4. One suggested next step.

## Failure handling

1. If auth is expired, report re-auth is required.
2. If permissions fail, report the exact missing access.
3. If the API or tool call fails, report the error in plain language and the next retry step.
