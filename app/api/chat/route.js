// POST /api/chat
// Body:    { clientId: string,
//            messages: [{ role: "user" | "assistant", content: string, photo_count?: number }],
//            job?: object,
//            photos?: string[],      up to 3 JPEG data URLs (used when storage isn't set up)
//            photo_paths?: string[], storage paths from /api/upload-url, for the newest message
//            conversationId?: string } the id from the previous reply, so the chat saves as one thread
// Returns: { reply, mode, job, outcome, quick_replies, guard, conversation_id, limit_reached? }
// No streaming: the guard reads the whole reply first.

import { loadClient } from "../../../lib/rules.js";
import { loadTemplate } from "../../../lib/prompt.js";
import { getModel } from "../../../lib/model.js";
import { runChat, sanitizeMessages, sanitizePhotos } from "../../../lib/chat.js";
import { recordChat, rulesForClient, visitorHash } from "../../../lib/store.js";
import { isPhotoPathFor, readLinksFor, storageEnabled } from "../../../lib/storage.js";
import { visitorWithinLimit, websiteAllowed } from "../../../lib/limits.js";
import { MAX_PHOTOS } from "../../../lib/chat.js";

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

  const host = hostOf(request.headers.get("origin") || request.headers.get("referer"));
  const visitor = visitorHash(
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    request.headers.get("user-agent") ?? ""
  );

  try {
    const { rules, rulesVersionId, clientRowId } = await rulesForClient(body.clientId, client.brand, client.rules);

    // Abuse limits. Both fail open if the database can't answer.
    const site = await websiteAllowed(clientRowId, host);
    if (!site.allowed) return json(403, { error: "This chat isn't available on this website." });

    const newChat = !body.conversationId;
    if (newChat) {
      const visits = await visitorWithinLimit(clientRowId, visitor);
      if (!visits.allowed) {
        return json(429, {
          error: "You've started a lot of chats today. Please call us instead.",
          phone: client.rules.business.phone,
        });
      }
    }

    // Photos either live in Storage (preferred) or come inline when storage isn't set up.
    let photoUrls = photos;
    let photoCount = photos.length;
    const paths = Array.isArray(body.photo_paths) ? body.photo_paths.slice(0, MAX_PHOTOS) : [];
    if (paths.length) {
      // Checked whether or not storage is on, so a stray path is always refused.
      const mine = paths.every((p) => isPhotoPathFor(p, body.clientId, body.conversationId));
      if (!mine) return json(400, { error: "Those photos don't belong to this chat." });
      if (storageEnabled()) {
        photoUrls = await readLinksFor(paths);
        photoCount = paths.length;
      }
    }

    const chat = await runChat({
      rules,
      brand: client.brand,
      template: await loadTemplate(),
      model,
      messages,
      job: body.job,
      photos: photoUrls,
    });

    // The engine result is for our records only; the browser gets `outcome`.
    const { result, ...reply } = chat;
    const conversationId = await recordChat({
      slug: body.clientId,
      brand: client.brand,
      rulesVersionId,
      conversationId: body.conversationId,
      sourceDomain: host,
      visitor,
      userMessage: messages[messages.length - 1].content,
      photoCount,
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
