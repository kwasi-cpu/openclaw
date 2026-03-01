# OpenClaw VPS: Durable Telegram Topic Task Management Runbook

This is a practical reference for running one Telegram topic as a durable workstream.

It explains:
- what to do
- why it matters
- which commands to run

This starts with the simplest useful setup:
1. one Telegram group
2. one topic inside that group
3. one shared external repo
4. one durable task file on the VPS

You can expand to more topics later using the same pattern.

---

## 1) What "durable task management per topic" means

Each Telegram topic already has its own chat session and memory.

That is useful, but it is not enough by itself because:
1. chat sessions can get reset with `/new`
2. chat history can compact over time
3. important tasks and decisions should live somewhere stable

So the durable pattern is:
1. use the Telegram topic for conversation
2. use a topic-specific system prompt for role and rules
3. use a file on disk for the topic's current tasks and notes

For one topic, the file can be:

```text
/root/openclaw-workspace/ops/main-topic.md
```

Why this is better than "just remember it in chat":
1. the file survives restarts
2. the file survives `/new`
3. scheduled jobs can read and update it
4. you can inspect it directly over SSH

---

## 2) Current simple architecture

Use this mental model:

1. Telegram topic = conversation surface
2. topic system prompt = topic role
3. external repo = source code or project source of truth
4. task file = durable checklist and notes for that topic

For a one-topic setup, OpenClaw should know:
1. which repo to use
2. which task file belongs to this topic
3. what this topic is responsible for

---

## 3) Prerequisites

Before doing this, confirm:
1. OpenClaw Telegram integration already works
2. the bot replies inside the topic
3. your external repo is cloned on the VPS

Helpful checks:

```bash
openclaw channels status --probe
openclaw health --json
ls -la /root/openclaw-workspace/external
```

---

## 4) Get the Telegram group ID and topic ID

Your current group ID is:

```text
-1003500619927
```

To get the topic ID:

1. send one message inside the topic
2. run:

```bash
jq -r 'keys[]' /root/.openclaw/agents/main/sessions/sessions.json | grep 'telegram:group:-1003500619927:topic:'
```

Example output:

```text
agent:main:telegram:group:-1003500619927:topic:101
```

In that example:
1. group ID = `-1003500619927`
2. topic ID = `101`

Why this matters:
1. group config is keyed by group ID
2. per-topic config is keyed by topic ID
3. cron delivery back into the thread also needs the topic ID

---

## 5) Make sure the external repo is present

If the repo is not already cloned on the VPS:

```bash
mkdir -p /root/openclaw-workspace/external
cd /root/openclaw-workspace/external
git clone git@github-readonly-repo:OWNER/PRIVATE_REPO.git
```

If it is already there, confirm the folder name:

```bash
ls -la /root/openclaw-workspace/external
```

In this runbook, the examples will use:

```text
/root/openclaw-workspace/external/YOUR_REPO_NAME
```

Why this matters:
1. OpenClaw reads the local repo copy quickly
2. no GitHub auth is needed for every question
3. the topic prompt can point to a stable local path

---

## 6) Create the durable task file

For one topic, create one task file:

```bash
mkdir -p /root/openclaw-workspace/ops

cat > /root/openclaw-workspace/ops/main-topic.md <<'EOF'
# Main Topic Task File

## Mission
Own this Telegram topic's workstream for the shared repo.

## Current Tasks
- 

## Decisions
- 

## Blockers
- 

## Next Review
- 
EOF
```

Why this file exists:
1. tracks tasks outside chat memory
2. gives cron jobs a stable place to read from
3. lets you reset the chat without losing project state

---

## 7) Add one group prompt and one topic prompt

Replace:
1. `YOUR_REPO_NAME`
2. `TOPIC_ID`

Then run:

```bash
openclaw config set channels.telegram.groups '{
  "-1003500619927": {
    "enabled": true,
    "groupPolicy": "open",
    "requireMention": false,
    "systemPrompt": "This Telegram group works on the shared repo at /root/openclaw-workspace/external/YOUR_REPO_NAME. Use that repo as the main codebase unless told otherwise.",
    "topics": {
      "TOPIC_ID": {
        "requireMention": false,
        "systemPrompt": "This topic is the main durable workstream for /root/openclaw-workspace/external/YOUR_REPO_NAME. Read and maintain /root/openclaw-workspace/ops/main-topic.md as the task list and project scratchpad for this thread. Search before creating duplicate tasks. Keep summaries short and actionable."
      }
    }
  }
}'
```

Then verify:

```bash
openclaw config get channels.telegram.groups
```

Why there are two prompts:
1. group prompt = shared repo context for the whole group
2. topic prompt = role and durable file for this specific topic

---

## 8) Restart and verify

Run:

```bash
openclaw gateway restart
openclaw health --json
openclaw channels status --probe
```

Good result:
1. `ok: true` in health
2. Telegram shows `works`

---

## 9) First test inside the topic

Send this in the Telegram topic:

```text
Read /root/openclaw-workspace/ops/main-topic.md and summarize this topic's mission and current task list.
```

If that works, test a write:

```text
Update /root/openclaw-workspace/ops/main-topic.md by adding a current task: "Review the external repo structure and propose workstreams."
```

Then confirm on the VPS:

```bash
cat /root/openclaw-workspace/ops/main-topic.md
```

Why this test matters:
1. proves the topic prompt is active
2. proves the task file is reachable
3. proves durable state is working outside chat memory

---

## 10) Day-to-day workflow

Use this pattern inside the topic:

1. ask the bot to read the task file first
2. ask it to add/update tasks as it works
3. ask it to summarize changes back into the file

Examples:

```text
Read /root/openclaw-workspace/ops/main-topic.md, review the repo at /root/openclaw-workspace/external/YOUR_REPO_NAME, and propose the next 3 tasks for this thread.
```

```text
Mark the first task in /root/openclaw-workspace/ops/main-topic.md as completed and add one new follow-up task based on today's work.
```

```text
Summarize the current repo state for this topic and write the summary into the Decisions section of /root/openclaw-workspace/ops/main-topic.md.
```

This is the simplest durable loop:
1. read task file
2. work against repo
3. update task file

---

## 11) Add one cron job later

Once the topic is stable, you can add a scheduled report back into that topic.

Telegram topic targets use this format:

```text
-1003500619927:topic:TOPIC_ID
```

Why this matters:
1. cron output goes back into the same thread
2. each topic stays isolated
3. the task file and the thread remain aligned

Good first cron ideas:
1. daily repo summary
2. daily open task review
3. daily "next 3 actions" update

---

## 12) Keep it simple at first

Do not add Todoist yet unless you specifically need:
1. due dates
2. reminders
3. mobile-first task entry

For one topic, the file-based method is better because:
1. fewer moving parts
2. easier debugging
3. no extra OAuth setup
4. fits directly into your current VPS + repo workflow

Later, if you want, you can swap the task file for:
1. a Notion page
2. a Todoist integration
3. a different Composio-backed task system

But the one-topic durable pattern should come first.

---

## 13) Expansion path when you are ready

When you add more topics later:
1. create one file per topic
2. add one topic-specific prompt per topic
3. optionally add one cron job per topic

Pattern:

```text
/root/openclaw-workspace/ops/backend.md
/root/openclaw-workspace/ops/frontend.md
/root/openclaw-workspace/ops/releases.md
```

Each topic then becomes:
1. one thread
2. one role
3. one task file
4. one repo context

That is the scalable version of the same setup.

---

## 14) Quick recovery checklist

If the topic starts behaving strangely:

1. confirm the task file still exists

```bash
ls -l /root/openclaw-workspace/ops/main-topic.md
```

2. confirm Telegram is healthy

```bash
openclaw channels status --probe
```

3. confirm the topic config is still present

```bash
openclaw config get channels.telegram.groups
```

4. restart OpenClaw

```bash
openclaw gateway restart
```

5. ask the topic to read the task file again

```text
Read /root/openclaw-workspace/ops/main-topic.md and summarize where this thread stands.
```

---

## 15) Summary

The durable one-topic pattern is:

1. Telegram topic for discussion
2. topic prompt for role and rules
3. local task file for durable state
4. local external repo for code context

That is enough to build a reliable workstream without adding more integrations yet.
