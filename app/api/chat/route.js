// POST /api/chat
// Body:    { clientId: string, messages: [{ role: "user" | "assistant", content: string }], job?: object }
// Returns: { reply, mode, job, outcome, quick_replies, guard, limit_reached? }
// No streaming: the guard reads the whole reply first.

import { loadClient } from "../../../lib/rules.js";
import { loadTemplate } from "../../../lib/prompt.js";
import { getModel } from "../../../lib/model.js";
import { runChat, sanitizeMessages } from "../../../lib/chat.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 64_000;

function json(status, body) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request) {
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return json(413, { error: "Request too large." });

  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return json(400, { error: "Request body must be JSON." });
  }

  const client = await loadClient(body?.clientId);
  if (!client) return json(404, { error: "Unknown client." });

  const messages = sanitizeMessages(body.messages);
  if (!messages) return json(400, { error: "messages must be user/assistant text turns ending with a user message." });

  const model = getModel();
  if (!model) {
    return json(503, { error: "Chat is not configured.", phone: client.rules.business.phone });
  }

  try {
    const result = await runChat({
      rules: client.rules,
      brand: client.brand,
      template: await loadTemplate(),
      model,
      messages,
      job: body.job,
    });
    if (process.env.NODE_ENV === "production") delete result.guard.problems;
    return json(200, result);
  } catch (err) {
    console.error("chat error:", err.message);
    return json(502, { error: "The chat is having trouble right now.", phone: client.rules.business.phone });
  }
}
