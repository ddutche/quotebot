// POST /api/chat
// Body:    { clientId: string,
//            messages: [{ role: "user" | "assistant", content: string, photo_count?: number }],
//            job?: object,
//            photos?: string[],      up to 3 JPEG data URLs for the newest message, shrunk in the browser
//            conversationId?: string } the id from the previous reply, so the chat saves as one thread
// Returns: { reply, mode, job, outcome, quick_replies, guard, conversation_id, limit_reached? }
// No streaming: the guard reads the whole reply first.

import { loadClient } from "../../../lib/rules.js";
import { loadTemplate } from "../../../lib/prompt.js";
import { getModel } from "../../../lib/model.js";
import { runChat, sanitizeMessages, sanitizePhotos } from "../../../lib/chat.js";
import { recordChat, rulesForClient, visitorHash } from "../../../lib/store.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Three shrunk photos plus the chat. Vercel's request limit is 4.5 MB.
const MAX_BODY_BYTES = 4_300_000;

function json(status, body) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/** The website the chat came from, for the allowed-websites check in Wave 2. */
function hostOf(value) {
  try {
    return value ? new URL(value).host : null;
  } catch {
    return null;
  }
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

  const photos = sanitizePhotos(body.photos);
  if (!photos) return json(400, { error: "photos must be up to 3 JPEG images, each under about 1 MB." });

  const model = getModel();
  if (!model) {
    return json(503, { error: "Chat is not configured.", phone: client.rules.business.phone });
  }

  try {
    const { rules, rulesVersionId } = await rulesForClient(body.clientId, client.brand, client.rules);

    const chat = await runChat({
      rules,
      brand: client.brand,
      template: await loadTemplate(),
      model,
      messages,
      job: body.job,
      photos,
    });

    // The engine result is for our records only; the browser gets `outcome`.
    const { result, ...reply } = chat;
    const conversationId = await recordChat({
      slug: body.clientId,
      brand: client.brand,
      rulesVersionId,
      conversationId: body.conversationId,
      sourceDomain: hostOf(request.headers.get("origin") || request.headers.get("referer")),
      visitor: visitorHash(request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(), request.headers.get("user-agent") ?? ""),
      userMessage: messages[messages.length - 1].content,
      photoCount: photos.length,
      reply: chat.reply,
      guard: chat.guard,
      result: result ? { ...result, engine_input: chat.job ?? {} } : null,
    });

    reply.conversation_id = conversationId;
    if (process.env.NODE_ENV === "production") delete reply.guard.problems;
    return json(200, reply);
  } catch (err) {
    console.error("chat error:", err.message);
    return json(502, { error: "The chat is having trouble right now.", phone: client.rules.business.phone });
  }
}
