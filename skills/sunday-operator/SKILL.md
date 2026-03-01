---
name: sunday-operator
description: Operate Sunday as a dependency-aware 0-to-1 business system by using the Sunday repo mirror for product reality, Sunday HQ in Notion for strategy, and Todoist for the active execution queue.
metadata:
  {
    "openclaw":
      {
        "emoji": "Sunday",
      },
  }
---

# sunday-operator

Use this skill for Sunday planning, prioritization, execution review, and business operating decisions.

Sunday should be treated as one company operating system with these roles:

1. `/root/openclaw-workspace/external/sunday`
- product and implementation truth

2. Sunday HQ in Notion
- strategy, roadmap, decisions, and weekly review

3. Todoist project `Sunday`
- active execution queue only

## Core operating rule

Always optimize for the next correct step, not the largest number of tasks.

## Workflow

1. Start from Sunday HQ in Notion:
- read mission
- read roadmap or current phase
- read decision log if the request touches a strategic choice

2. Check the repo mirror only as needed:
- use focused reads first
- prioritize README, security/compliance docs, setup docs, changed files, and architecture-critical files
- avoid full repo scans unless the user explicitly asks for a deep review

3. Check Todoist project `Sunday`:
- determine what is active
- determine what is blocked
- determine whether capacity exists for more work

4. Produce the next actions in dependency order.

## Task management rules

1. Keep the active task queue between 5 and 10 items.
2. Do not add downstream tasks before prerequisites are complete.
3. Refill tasks only when completed work creates capacity.
4. Prefer tasks that move Sunday from 0 to 1:
- compliance and safety foundations
- product readiness
- customer value
- distribution-critical setup
- operational bottlenecks
5. Avoid vanity tasks and broad speculative work.

## Planning rules

1. Favor sequence over parallelism.
2. If a decision changes sequencing, ask one short clarifying question instead of inventing assumptions.
3. Explicitly call out what is urgent, what is important, and what is intentionally deferred.
4. Use Notion for strategy and Todoist for execution. Do not duplicate long strategic plans into Todoist.

## Daily cadence behavior

When doing the morning plan:

1. identify the top 5 things that matter today
2. explain why they matter now
3. create or update Todoist tasks so the total active queue remains between 5 and 10
4. mention what is intentionally not being worked on yet

When doing the midday review:

1. check what was completed
2. check what remains blocked
3. only add new tasks if completed work opened capacity
4. preserve dependency order

## Repo analysis cadence

Default cadence:

1. daily focused read
2. weekly structured review
3. monthly full architecture review

Do not run full repo analysis every day unless the user explicitly asks.

## Output format

Return:

1. Current phase or operating focus
2. Top priorities in order
3. Todoist changes made
4. Blockers or missing decisions
5. One suggested next step

## Failure handling

1. If Notion context is missing, say which page or planning artifact is missing.
2. If Todoist access is missing, say that task execution updates could not be applied.
3. If the repo mirror is stale or missing, say that product reality may be outdated.
