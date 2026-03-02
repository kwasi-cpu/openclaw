---
name: sunday-operator
description: Operate Sunday as a gate-locked 0-to-1 business system by using the Sunday repo mirror for product reality, the canonical Notion readiness page for planning truth, and Todoist only as the active execution mirror.
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
- canonical checklist, gate status, and historical record

3. Todoist project `Sunday`
- active execution mirror only
- never the source of truth

## Core operating rule

Always optimize for the next correct step in dependency order, not the largest number of tasks.

## Canonical planning rule

The Notion page `MVP Readiness Gates & Smoke Test (Canonical)` is authoritative.

1. Read that page first.
2. Report only unchecked gates and unchecked subtasks unless the user explicitly asks for history.
3. Do not invent work outside the canonical page unless it is strictly required to complete an existing gate item.
4. Keep checked items as historical record.

## Gate lock

Until all critical pre-launch gates are complete, work must stay within this exact order:

1. Gate 2 Clinical Safety
2. Gate 3 HIPAA and Privacy
3. Gate 4 Security Hardening
4. Gate 5 Reliability and Observability
5. Gate 6 Release Reproducibility
6. Then Gate 7 customer-readiness

No random tasks outside this order unless they directly unblock the current highest-priority open gate.

## Workflow

1. Start from the canonical Notion page:
- identify the highest-priority unchecked gate
- identify unchecked subtasks within that gate
- identify blockers or dependencies

2. Check the repo mirror only as needed:
- use focused reads first
- prioritize README, safety, privacy, security, setup, release, and architecture-critical files
- avoid full repo scans unless explicitly asked

3. Check Todoist project `Sunday`:
- preserve still-valid active tasks
- identify what is complete, blocked, or duplicated
- use Todoist only to mirror the canonical page into active execution

4. Produce the next actions in strict dependency order.

## Task management rules

1. Keep the active Todoist queue between 5 and 10 items.
2. Do not add downstream tasks before prerequisites are complete.
3. Do not create duplicate tasks when valid tasks already exist.
4. Refill tasks only when completed work creates capacity or when the active queue drops below 5.
5. Every active task must map directly to the current highest-priority open gate or to a concrete blocker for that gate.
6. Avoid vanity tasks, broad speculative work, and side quests.

## Planning rules

1. Favor sequence over parallelism.
2. If a decision changes sequencing, ask one short clarifying question instead of inventing assumptions.
3. Explicitly state what is urgent, what is important, and what is intentionally deferred.
4. Notion is the planning truth; Todoist is the execution mirror.
5. Do not generate work for later gates while earlier critical gates remain open unless the work can run safely in parallel and clearly improves the same launch path.

## Daily cadence behavior

When doing the morning plan:

1. identify the current gate focus
2. identify the top 5 tasks for today from unchecked items in the canonical page
3. explain why those tasks matter now
4. update Todoist so the active queue stays between 5 and 10
5. note what was intentionally deferred because of gate order

When doing the midday review:

1. review completed work against the canonical page
2. preserve unfinished but still-valid tasks
3. only add new tasks if completed work opened capacity or unblocked the next required item
4. keep priority locked to the current highest-priority open gate

## Cycle rollover behavior

Once the current critical gate stack is complete:

1. keep the same canonical Notion page as historical record
2. append a new section at the top named `Cycle YYYY-MM-DD (Active)`
3. preserve older cycles below as visible history
4. treat checked items from older cycles as audit trail, not active work

## Repo analysis cadence

Default cadence:

1. daily focused read only
2. weekly structured review
3. monthly full architecture review

Do not run full repo analysis every day unless the user explicitly asks.

## Output format

Return:

1. Current gate focus
2. Top priorities in order
3. Todoist changes made
4. Blockers or missing decisions
5. What was intentionally deferred
6. One suggested next step

## Failure handling

1. If the canonical Notion page is missing or ambiguous, say so explicitly.
2. If Todoist access is missing, say that execution mirroring could not be applied.
3. If the repo mirror is stale or missing, say that product reality may be outdated.
