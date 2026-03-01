---
name: todoist-operator
description: Manage Todoist directly with search-first task capture, updates, and clear summaries.
metadata:
  {
    "openclaw":
      {
        "emoji": "✅",
        "requires": { "env": ["TODOIST_API_TOKEN"] },
      },
  }
---

# todoist-operator

Use this skill when the user asks to create, review, or complete Todoist tasks.

## Integration path

1. Use the direct Todoist helper through `openclaw todoist ...`.
2. Resolve auth from `TODOIST_API_TOKEN`.
3. Preferred command flow:
   - `openclaw todoist projects list --skill todoist-operator`
   - `openclaw todoist tasks list --skill todoist-operator`
   - `openclaw todoist tasks create --skill todoist-operator --content "..." --project-id "..." --due-string "..."`
   - `openclaw todoist tasks close <TASK_ID> --skill todoist-operator`

## Workflow

1. List projects or tasks first when the target is ambiguous.
2. Create tasks with short, actionable names.
3. Preserve user-provided due dates, project names, and priorities.
4. Close tasks only when the user clearly asks.

## Core behavior

1. Prefer updating or closing an existing task over creating a duplicate.
2. Ask one short clarifying question when project or due date is unclear and matters.
3. Do not delete tasks unless explicitly requested.
4. Keep task descriptions concise and useful.

## Quality checklist

1. Task names should start with an action verb when possible.
2. Return the task id and URL when available.
3. Mention the chosen project or due date when one was applied.

## Response format

Return:
1. What changed.
2. Which task or project was affected.
3. What was skipped and why.
4. One suggested next step when useful.

## Failure handling

1. If auth is missing, ask for `TODOIST_API_TOKEN`.
2. If the target task or project is not found, say that directly.
3. If the Todoist API fails, report the error in plain language and the next retry step.
