# Sunday Architecture Runbook

This document defines the recommended MVP operating system for Sunday as an AI-assisted company-building workflow inside OpenClaw.

Sunday is treated as:

- one business
- one primary Telegram operating topic
- one repo mirror on the VPS
- one Notion HQ for strategy and memory
- one Todoist project for execution

The goal is to help OpenClaw behave like a practical cofounder:

- sequence work correctly
- focus on urgent and high-leverage tasks first
- keep daily execution constrained
- avoid generating tasks that are not yet actionable

## MVP Architecture

Use the following split:

1. Telegram Sunday topic
- operational control surface
- where OpenClaw posts the morning plan and midday review
- where you make decisions and ask for work

2. Repo mirror on VPS
- product and implementation truth
- recommended path:
  `/root/openclaw-workspace/external/sunday`

3. Notion Sunday HQ
- strategic memory and planning system
- source of truth for mission, roadmap, decisions, and weekly review

4. Todoist Sunday project
- short-horizon execution queue
- source of truth for active daily tasks

5. Main OpenClaw agent
- do not start with permanent subagents
- use one main operating topic first

## System Of Record

Each system should have one job.

1. Repo
- current product/code reality
- architecture, security posture, compliance-relevant docs, README, setup docs

2. Notion
- business context and strategic sequencing
- what matters, why it matters, what is blocked, what phase comes next

3. Todoist
- currently active tasks only
- 5 to 10 tasks total

4. Telegram Sunday topic
- operating room
- summaries, escalation, execution feedback, and decisions

Do not let all three tools hold overlapping task state. The clean split is:

- Notion = roadmap and planning
- Todoist = current execution queue
- Telegram = discussion and delivery

## Recommended Notion Structure

Inside Sunday HQ, create these pages:

1. Mission
- what Sunday is
- who it serves
- current business hypothesis
- what success looks like in the next 30 days

2. Roadmap
- phases and dependencies
- recommended top-level phases:
  - Foundation
  - Validation
  - MVP usability
  - Early growth loop

3. Decision Log
- major product, security, compliance, or go-to-market decisions
- each entry should say:
  - date
  - decision
  - reason
  - downstream impact

4. Weekly Review
- wins
- misses
- blockers
- next bets

5. Execution Rules
- what OpenClaw should optimize for
- constraints on scope, speed, spend, and risk

## Recommended Todoist Structure

Start simple.

1. Project: `Sunday`

Optional later:

2. Sections
- `Today`
- `Waiting`
- `This Week`

For MVP, avoid over-modeling Todoist. The main value is that OpenClaw maintains a clean active queue and keeps it dependency-aware.

## Repo Analysis Cadence

Do not run full repo analysis every day.

Recommended cadence:

1. Daily focused read
- read only what is needed for current prioritization
- prioritize:
  - changed files
  - README
  - key product docs
  - HIPAA/security/privacy/compliance docs
  - app setup docs

2. Weekly structured review
- read:
  - README
  - security docs
  - licenses
  - compliance docs
  - setup docs
  - architecture-critical files
- goal: keep strategic understanding current without paying for a full scan daily

3. Monthly full architecture review
- deeper repo-wide review
- only needed when:
  - product scope changed
  - compliance posture changed
  - major engineering shift happened
  - the team needs a fresh operating reset

4. On-demand deep reads
- manual prompt when you want focused analysis on one subsystem

Recommended rule:

- daily = focused
- weekly = structured
- monthly = full

## Operating Rules For Sunday

OpenClaw should:

1. prefer sequence over volume
2. never create downstream tasks before prerequisites are satisfied
3. keep active tasks between 5 and 10
4. only refill the queue when completed work creates capacity
5. bias toward business leverage:
   - foundation
   - compliance/safety
   - product readiness
   - customer value
   - distribution
6. avoid vanity work
7. escalate ambiguity instead of guessing when the decision changes sequencing

## Telegram Topic Setup

Sunday should run from one dedicated Telegram forum topic first.

### Step 1: Discover the Sunday topic id

Send one message in the Sunday topic, then run:

```bash
jq -r 'keys[]' /root/.openclaw/agents/main/sessions/sessions.json | grep 'telegram:group:-1003500619927:topic:'
```

The output will look like:

```text
agent:main:telegram:group:-1003500619927:topic:123
```

The topic id is the number after `:topic:`.

### Step 2: Set the Sunday topic config

Replace:

- `SUNDAY_TOPIC_ID`
- `YOUR_TIMEZONE`
- repo path if your mirror path differs

```bash
openclaw config set channels.telegram.groups '{
  "-1003500619927": {
    "enabled": true,
    "groupPolicy": "open",
    "requireMention": false,
    "topics": {
      "SUNDAY_TOPIC_ID": {
        "enabled": true,
        "groupPolicy": "open",
        "requireMention": false,
        "skills": ["notion-operator", "todoist-operator"],
        "systemPrompt": "This topic is the Sunday operating room. Sunday is an AI scribe business. Use /root/openclaw-workspace/external/sunday as the primary repo mirror unless told otherwise. Use Sunday HQ in Notion as strategic memory and Todoist project Sunday as the execution queue. Optimize for sequential 0-to-1 progress. Keep only 5 to 10 active tasks total. Do not create tasks that depend on unfinished prerequisites. Prefer high-leverage foundational work first, including security, compliance, product readiness, and distribution-critical setup. When uncertain, ask one short decision question instead of inventing work."
      }
    }
  }
}'

openclaw gateway restart
```

## Daily Cron Design

Use two cron jobs first:

1. `9:00 AM`
- morning plan
- review current state
- create and prioritize the day

2. `2:00 PM`
- midday review
- check what is incomplete
- refill only if capacity opened up

### Morning cron job

Replace:

- `YOUR_TIMEZONE`
- `SUNDAY_TOPIC_ID`

```bash
openclaw cron add \
  --name "Sunday morning plan" \
  --cron "0 9 * * *" \
  --tz "YOUR_TIMEZONE" \
  --session isolated \
  --message "You are the Sunday operating cofounder. Work from these systems in this order: Sunday HQ in Notion for roadmap and priorities, the Sunday repo mirror at /root/openclaw-workspace/external/sunday for product reality, and the Todoist project Sunday for current execution. Build today's plan in dependency order. Output the top 5 things that should be done today. Then create or update Todoist tasks so total active tasks stays between 5 and 10, only adding tasks that are actionable now. Favor urgent and high-leverage 0-to-1 work first: foundational setup, security/compliance, product readiness, and immediate business progress. Avoid vanity work and avoid adding downstream tasks early. End with: what was prioritized, what was added to Todoist, and what was intentionally deferred." \
  --announce \
  --channel telegram \
  --to "-1003500619927:topic:SUNDAY_TOPIC_ID"
```

### Midday cron job

Replace:

- `YOUR_TIMEZONE`
- `SUNDAY_TOPIC_ID`

```bash
openclaw cron add \
  --name "Sunday midday review" \
  --cron "0 14 * * *" \
  --tz "YOUR_TIMEZONE" \
  --session isolated \
  --message "You are the Sunday operating cofounder. Review the Todoist project Sunday and determine what was completed, what remains blocked, and what now becomes actionable. Keep the task list dependency-aware. If completed work created capacity, add the next sequential tasks so the total active queue stays between 5 and 10. Do not refill blindly. Use Sunday HQ in Notion and the repo mirror at /root/openclaw-workspace/external/sunday when deciding what should come next. Post a concise update: completed, still active, blocked, and newly added tasks if any." \
  --announce \
  --channel telegram \
  --to "-1003500619927:topic:SUNDAY_TOPIC_ID"
```

## Optional Repo Sync Cron

Do not analyze the whole repo here. Just keep the mirror fresh.

Replace:

- `YOUR_TIMEZONE`

```bash
openclaw cron add \
  --name "Sunday repo sync" \
  --cron "55 8 * * *" \
  --tz "YOUR_TIMEZONE" \
  --session isolated \
  --message "Run a focused repo refresh for /root/openclaw-workspace/external/sunday. Pull latest changes if the clone exists. Report only if sync fails or if the repo is missing." \
  --announce \
  --channel telegram \
  --to "-1003500619927:topic:SUNDAY_TOPIC_ID"
```

If you do not want OpenClaw itself performing git pulls in the cron prompt, replace this with a separate host-level script or manual sync.

## Standardized Project Spin-Up Protocol

This should be the default protocol for each future project.

1. Repo mirror
- `/root/openclaw-workspace/external/<slug>`

2. Notion HQ
- Mission
- Roadmap
- Decision Log
- Weekly Review
- Execution Rules

3. Todoist project
- same business/project name

4. Telegram topic
- one operating topic first

5. Topic config
- system prompt
- skills filter
- mention policy

6. Two cron jobs
- morning plan
- midday review

7. Operator skill later
- `skills/<slug>-operator/SKILL.md`

This keeps new project setup consistent and low-config.

## Subagent Policy

Do not start with permanent subagents for Sunday.

Reason:

- subagents have reduced injected context
- they share the same gateway resources
- they add orchestration overhead before the operating system is stable

Recommended policy:

1. Phase 1
- no permanent subagents
- one main Sunday topic

2. Phase 2
- add one or two focused subagents only when there is a recurring need

Good later candidates:

1. `sunday-research`
2. `sunday-engineering-review`
3. `sunday-growth-ops`

## First Week Success Criteria

The MVP is working if:

1. Sunday topic gets a reliable 9 AM plan
2. Sunday topic gets a reliable 2 PM review
3. Todoist stays between 5 and 10 active tasks
4. new tasks appear only when prerequisites are complete
5. Notion captures strategic changes and decisions
6. OpenClaw consistently prioritizes what matters first

## Practical Next Step

After this MVP is stable for several days:

1. add a dedicated `sunday-operator` skill
2. add weekly review automation
3. add one focused subagent if a real repeated need appears
