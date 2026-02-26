---
name: notion-operator
description: Safely handle Notion tasks with search-first, low-duplication workflows, and explicit change summaries.
metadata: { "openclaw": { "emoji": "🧠" } }
---

# notion-operator

Use this skill when the user asks to read, create, or update Notion content.

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
3. If the API/tool call fails, report the error in plain language and the next retry step.
