---
name: sunday-operator
description: Operate Sunday as a cycle-driven 0-to-1 business system by using the Sunday repo mirror for product reality and the canonical Notion readiness page as the single source of truth for planning and execution.
metadata:
  {
    "openclaw":
      {
        "emoji": "Sunday",
      },
  }
---

# sunday-operator

Use this skill for Sunday planning, prioritization, execution review, and operating decisions.

Treat Sunday as one operating system with these roles:

1. `/root/openclaw-workspace/external/sunday`
- product and implementation truth

2. `MVP Readiness Gates & Smoke Test (Canonical)` in Notion
- single source of truth for launch work
- canonical checklist, active cycle, next cycle, and historical record

## Core operating rule

Always optimize for the next correct step in dependency order, not the largest number of tasks.

## Canonical planning rule

The Notion page `MVP Readiness Gates & Smoke Test (Canonical)` is authoritative.

1. Read that page first.
2. Report only unchecked gates and unchecked subtasks unless the user explicitly asks for history.
3. Do not invent work outside the canonical page unless it is strictly required to complete an existing gate item.
4. Keep checked items as historical record.

## Cycle lock

Work must stay within the currently active cycle defined on the canonical Notion page.

1. Treat the top-most section named `Cycle YYYY-MM-DD (Active)` as the active cycle unless the page explicitly marks a different active cycle.
2. Work in the dependency order defined inside that active cycle.
3. Do not invent work outside the active cycle unless it directly unblocks the current highest-priority unchecked item.
4. Treat any `Next Cycle` section as planning inventory only, not active work, until the current active cycle is complete.

## Workflow

1. Start from the canonical Notion page:
- identify the active cycle
- identify the highest-priority unchecked item within that cycle
- identify unchecked subtasks within that item
- identify blockers or dependencies

2. Check the repo mirror only as needed:
- use focused reads first
- prioritize README, safety, privacy, security, setup, release, and architecture-critical files
- avoid full repo scans unless explicitly asked

3. Produce the next actions in strict dependency order from the canonical page itself.

## Task management rules

1. Treat unchecked items in the active cycle section of the canonical Notion page as the active queue.
2. Keep the active queue between 5 and 10 actionable unchecked items when possible.
3. Do not add downstream tasks before prerequisites are complete.
4. Do not create duplicate items when valid unchecked items already exist.
5. Refill work only when completed items create capacity or when the active queue drops below 5.
6. Every active item must map directly to the current highest-priority open item in the active cycle or to a concrete blocker for that item.
7. Avoid vanity tasks, broad speculative work, and side quests.

## Planning rules

1. Favor sequence over parallelism.
2. If a decision changes sequencing, ask one short clarifying question instead of inventing assumptions.
3. Explicitly state what is urgent, what is important, and what is intentionally deferred.
4. Notion is the planning and execution truth for Sunday.
5. Do not generate work for later cycle items while earlier active-cycle prerequisites remain open unless the work can run safely in parallel and clearly improves the same launch path.

## Daily cadence behavior

When doing the morning plan:

1. identify the current active cycle and leading item
2. identify the top 5 tasks for today from unchecked items in the canonical page
3. explain why those tasks matter now
4. update the active cycle section in the canonical page so the active queue stays between 5 and 10 unchecked items
5. note what was intentionally deferred because of cycle order

When doing the midday review:

1. review completed work against the canonical page
2. preserve unfinished but still-valid unchecked items
3. only add new items if completed work opened capacity or unblocked the next required item
4. keep priority locked to the current active cycle

## Cycle rollover behavior

Once the current active cycle is complete:

1. keep the same canonical Notion page as historical record
2. preserve the completed cycle below as visible history
3. promote the next planned cycle by appending or renaming the top section to `Cycle YYYY-MM-DD (Active)`
4. preserve older cycles below as visible history
5. treat checked items from older cycles as audit trail, not active work

## Repo analysis cadence

Default cadence:

1. daily focused read only
2. weekly structured review
3. monthly full architecture review

Do not run full repo analysis every day unless the user explicitly asks.

## Output format

Return:

1. Current active cycle
2. Top priorities in order
3. Canonical page changes made
4. Blockers or missing decisions
5. What was intentionally deferred
6. One suggested next step

## Failure handling

1. If the canonical Notion page is missing or ambiguous, say so explicitly.
2. If the canonical page cannot be updated, say that explicitly and avoid inventing external execution state.
3. If the repo mirror is stale or missing, say that product reality may be outdated.
