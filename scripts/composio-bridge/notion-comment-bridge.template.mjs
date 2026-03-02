import express from "express";
import fs from "node:fs";
import path from "node:path";

const app = express();
app.use(express.json({ limit: "2mb" }));

const OPENCLAW_URL = "http://127.0.0.1:18789/hooks/agent";
const OPENCLAW_HOOK_TOKEN = process.env.OPENCLAW_HOOK_TOKEN;
const NOTION_COMMENT_TRIGGER = process.env.NOTION_COMMENT_TRIGGER ?? "!claw";
const NOTION_COMMENT_BOT_USER_ID =
  process.env.NOTION_COMMENT_BOT_USER_ID ?? "REPLACE_WITH_NOTION_BOT_USER_ID";

const SEEN_COMMENT_IDS_PATH = "/opt/composio-bridge/state/notion-comment-seen.json";

if (!OPENCLAW_HOOK_TOKEN) throw new Error("OPENCLAW_HOOK_TOKEN missing");

app.get("/health", (_req, res) => res.json({ ok: true }));

function ensureSeenStore() {
  fs.mkdirSync(path.dirname(SEEN_COMMENT_IDS_PATH), { recursive: true });
}

function loadSeenCommentIds() {
  ensureSeenStore();
  try {
    const raw = fs.readFileSync(SEEN_COMMENT_IDS_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function saveSeenCommentIds(ids) {
  ensureSeenStore();
  const next = Array.from(ids).slice(-2000);
  fs.writeFileSync(SEEN_COMMENT_IDS_PATH, JSON.stringify(next, null, 2));
}

function richTextToPlain(richText) {
  if (!Array.isArray(richText)) return "";
  return richText
    .map((part) => part?.plain_text ?? part?.text?.content ?? "")
    .join("")
    .trim();
}

function normalizeBody(body) {
  return body?.body ?? body ?? {};
}

function extractCommentEvent(body) {
  const payload = normalizeBody(body);

  const comment =
    payload?.comment ??
    payload?.data?.comment ??
    payload?.payload?.comment ??
    payload?.event_data?.comment ??
    null;

  if (!comment) {
    return null;
  }

  const commentId = comment?.id ?? payload?.comment_id ?? payload?.data?.comment_id ?? null;
  const authorId =
    comment?.created_by?.id ??
    comment?.author?.id ??
    payload?.actor?.id ??
    payload?.user?.id ??
    null;

  const text =
    (typeof comment?.plain_text === "string" && comment.plain_text.trim()) ||
    richTextToPlain(comment?.rich_text) ||
    "";

  const pageId =
    comment?.parent?.page_id ??
    payload?.page_id ??
    payload?.page?.id ??
    payload?.data?.page_id ??
    null;

  return {
    commentId,
    authorId,
    text: String(text).trim(),
    pageId,
    raw: payload,
  };
}

function shouldHandleComment(evt, seenCommentIds) {
  if (!evt) return { ok: false, reason: "no comment payload" };
  if (!evt.commentId) return { ok: false, reason: "missing comment id" };
  if (seenCommentIds.has(evt.commentId)) return { ok: false, reason: "duplicate comment id" };
  if (evt.authorId && evt.authorId === NOTION_COMMENT_BOT_USER_ID) {
    return { ok: false, reason: "comment authored by bot" };
  }
  if (!evt.text.includes(NOTION_COMMENT_TRIGGER)) {
    return { ok: false, reason: "mention gate not matched" };
  }
  return { ok: true };
}

function stripMention(text) {
  return text.replaceAll(NOTION_COMMENT_TRIGGER, "").trim();
}

function buildOpenClawMessage(evt) {
  const cleanedComment = stripMention(evt.text);

  return [
    "Use notion-operator.",
    "",
    "A Notion comment explicitly addressed to the assistant was received.",
    "",
    "Routing rules:",
    "1. If the comment is asking a question, answer by posting a Notion comment reply, not by editing the page body.",
    "2. If the comment explicitly asks for a safe page change, make the page change and then post a short Notion comment confirming exactly what changed.",
    "3. Safe page changes include summarizing content, appending next steps, adding checklist items, and drafting short sections.",
    "4. Never delete, archive, move, rename top-level structures, or make destructive edits from comment commands.",
    "5. If the request is ambiguous, ask one short clarifying question as a Notion comment reply.",
    "6. Keep all comment replies concise and useful.",
    "",
    "Reply mode policy:",
    "- Question or request for explanation -> Notion comment reply only.",
    "- Explicit safe edit request -> Edit page, then comment with a short confirmation.",
    "- Unsafe or destructive request -> Refuse in a short Notion comment reply.",
    "",
    `Comment id: ${evt.commentId}`,
    `Parent page id: ${evt.pageId ?? ""}`,
    `Author id: ${evt.authorId ?? ""}`,
    `Comment text: ${cleanedComment}`,
    "",
    "Raw payload follows for tool argument discovery if needed:",
    JSON.stringify(evt.raw).slice(0, 12000),
  ].join("\n");
}

async function forwardCommentToOpenClaw(evt) {
  const message = buildOpenClawMessage(evt);

  const r = await fetch(OPENCLAW_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENCLAW_HOOK_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "Composio",
      message,
      wakeMode: "now",
      deliver: false,
    }),
  });

  return r;
}

app.post("/composio/webhook", async (req, res) => {
  const evt = extractCommentEvent(req.body);
  const seenCommentIds = loadSeenCommentIds();
  const decision = shouldHandleComment(evt, seenCommentIds);

  if (!decision.ok) {
    console.log("[notion-comment] skipped:", decision.reason);
    return res.status(200).json({ ok: true, skipped: decision.reason });
  }

  try {
    const r = await forwardCommentToOpenClaw(evt);
    if (!r.ok) {
      console.error("[notion-comment] openclaw hook failed:", r.status);
      return res.status(502).json({ ok: false });
    }

    seenCommentIds.add(evt.commentId);
    saveSeenCommentIds(seenCommentIds);

    console.log("[notion-comment] forwarded:", {
      commentId: evt.commentId,
      pageId: evt.pageId,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[notion-comment] error:", err);
    return res.status(500).json({ ok: false });
  }
});

app.listen(3001, "127.0.0.1", () => console.log("Bridge on 127.0.0.1:3001"));
