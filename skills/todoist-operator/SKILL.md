---
name: todoist-operator
description: Manage Todoist through Composio with focused task capture, updates, and clear summaries.
metadata:
  {
    "openclaw":
      {
        "emoji": "✅",
        "requires":
          {
            "env":
              [
                "COMPOSIO_API_KEY",
                "COMPOSIO_CONNECTED_ACCOUNT_ID_TODOIST",
                "COMPOSIO_USER_ID_TODOIST",
              ],
          },
      },
  }
---

# todoist-operator

Use this skill when the user asks to create, update, complete, or review Todoist tasks.

## Integration path

1. Use the shared Composio helper at `src/infra/composio/client.ts` through `openclaw composio ...`.
2. Use `COMPOSIO_CONNECTED_ACCOUNT_ID_TODOIST` for Todoist tool execution.
3. Use `COMPOSIO_USER_ID_TODOIST` when the connected account requires a Composio user id for execution.
4. Preferred command flow:
   - `openclaw composio tools list --toolkit todoist --skill todoist-operator`
   - `openclaw composio tools get <TOOL_SLUG> --skill todoist-operator`
   - `openclaw composio tools exec <TOOL_SLUG> --skill todoist-operator --account-env COMPOSIO_CONNECTED_ACCOUNT_ID_TODOIST --args '{"...":"..."}'`

## Workflow

1. Find the correct Todoist tool for the requested action.
2. Inspect required input shape before executing.
3. Execute against the connected Todoist account.
4. Return a short summary with the resulting task, project, due date, or completion state.

## Core behavior

1. Capture tasks with a clear action verb.
2. Preserve user intent; do not rewrite task meaning.
3. Ask one short clarifying question only when the request is ambiguous.
4. Do not delete tasks unless the user explicitly asks.
5. Prefer updates or completion over creating duplicates.

## Quality checklist

1. Keep task names short and actionable.
2. Preserve project, due date, priority, and labels when present.
3. When creating a task, mention the project and due date if the user gave them.
4. When marking complete, identify which task was changed.

## Response format

Return:
1. What changed.
2. Which task or project was affected.
3. What was skipped and why.
4. One suggested next step when useful.

## Failure handling

1. If auth is expired, report re-auth is required.
2. If the target project or task cannot be found, say that directly.
3. If the API or tool call fails, report the error in plain language and the next retry step.
