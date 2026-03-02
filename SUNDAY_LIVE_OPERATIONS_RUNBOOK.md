# Sunday Live Operations Runbook

This runbook captures the current live Sunday operating setup that is working on the VPS.

## Current System

Sunday currently operates with these components:

1. Telegram Sunday topic
- primary operator surface
- receives cron updates and manual Sunday discussion

2. Sunday repo on VPS
- real checkout: `/root/sundaygcp`
- standardized path used by OpenClaw: `/root/openclaw-workspace/external/sunday`
- the standardized path is a symlink to the real checkout

3. Canonical Notion page
- `MVP Readiness Gates & Smoke Test (Canonical)`
- single source of truth for planning and execution
- active cycle lives on this page
- older completed cycles remain on the same page as history

4. Sunday operator skill
- `/Users/kwasiadusei/openclaw/skills/sunday-operator/SKILL.md`
- cycle-driven
- Notion-only for planning and execution
- repo mirror used only as product reality/context

5. Notion comment automation
- live bridge on VPS: `/opt/composio-bridge/bridge.mjs`
- repo-managed template: `/Users/kwasiadusei/openclaw/scripts/composio-bridge/notion-comment-bridge.template.mjs`
- trigger phrase: `!claw`
- supports:
  - concise question replies as Notion comments
  - safe page edits plus a short confirmation comment

6. Child-page comment trigger sync
- VPS runtime script path: `/usr/local/bin/sync-notion-comment-triggers.sh`
- repo-managed source: `/Users/kwasiadusei/openclaw/scripts/composio-bridge/sync-notion-comment-triggers.sh`
- purpose: keep `NOTION_COMMENTS_ADDED_TRIGGER` coverage on child pages under the canonical parent

## Source Of Truth Rules

Sunday should currently behave like this:

1. Notion canonical page is authoritative.
2. Active work comes from the top-most `Cycle YYYY-MM-DD (Active)` section unless the page explicitly marks a different active cycle.
3. `Next Cycle` is planning inventory only, not active work.
4. Checked items remain as history and audit trail.
5. Repo reads are focused and only used to understand current product reality.

## Current Daily Cadence

1. `7:00 AM America/Los_Angeles`
- morning plan
- read active cycle
- identify top 5 tasks
- update canonical page active cycle section

2. `2:00 PM America/Los_Angeles`
- midday review
- review completed, active, blocked, and newly actionable work
- preserve unfinished unchecked items
- add new items only when capacity opens or dependencies unblock

Both cron jobs should:

1. use `sunday-operator`
2. avoid browser relay
3. keep replies short enough to deliver cleanly to Telegram

## Notion Comment Automation Rules

The current comment workflow is intentionally narrow.

1. Only comments containing `!claw` are processed.
2. Comments authored by the Notion bot user are ignored to avoid loops.
3. Duplicate comment ids are ignored.
4. Safe behavior split:
- question -> reply as a Notion comment
- explicit safe edit request -> edit page, then leave a short Notion comment confirmation
- destructive request -> refuse in a short comment

Good examples:

```text
!claw summarize this page
!claw add 3 next steps to this page
!claw turn this into a checklist
```

Unsafe commands should remain blocked:

```text
!claw delete this section
!claw archive this page
```

## VPS Deployment Checklist

When rebuilding or moving the Sunday setup to another VPS:

1. Deploy the bridge template from:
- `/Users/kwasiadusei/openclaw/scripts/composio-bridge/notion-comment-bridge.template.mjs`

2. Set bridge env:
- `OPENCLAW_HOOK_TOKEN`
- `NOTION_COMMENT_TRIGGER`
- `NOTION_COMMENT_BOT_USER_ID`

3. Install the child-page sync script from:
- `/Users/kwasiadusei/openclaw/scripts/composio-bridge/sync-notion-comment-triggers.sh`

4. Set Sunday skill env:
- `SUNDAY_CANONICAL_NOTION_PAGE_ID`

5. Ensure the standardized repo path exists:
- `/root/openclaw-workspace/external/sunday`

6. Ensure the canonical page and relevant child pages are shared with the Notion integration.

## Version-Controlled Sunday Artifacts

These repo files are now the durable source for the Sunday operating setup:

1. `/Users/kwasiadusei/openclaw/skills/sunday-operator/SKILL.md`
2. `/Users/kwasiadusei/openclaw/SUNDAY_LIVE_OPERATIONS_RUNBOOK.md`
3. `/Users/kwasiadusei/openclaw/scripts/composio-bridge/notion-comment-bridge.template.mjs`
4. `/Users/kwasiadusei/openclaw/scripts/composio-bridge/sync-notion-comment-triggers.sh`
