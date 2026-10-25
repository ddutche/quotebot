// POST /api/upload-url
// Body:    { clientId, conversationId, bytes }
// Returns: 200 { path, token, uploadUrl }   one-time link for exactly one photo
//          503 { error }                    storage not set up (the widget then sends the photo inline)
//
// The browser shrinks the photo first, then uploads straight to Supabase Storage with this
// link. The file never passes through our server (golden rule 9).

import { loadClient } from "../../../lib/rules.js";
import { ensureClient, isUuid } from "../../../lib/store.js";
import { createUploadLink, photoPath, storageEnabled } from "../../../lib/storage.js";
import { insertRow, selectRows } from "../../../lib/db.js";
import { MAX_PHOTOS } from "../../../lib/chat.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 5_000_000;

function json(status, body) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request) {
  if (!storageEnabled()) return json(503, { error: "Photo storage is not set up." });

  let body;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: "Request body must be JSON." });
  }

  const client = await loadClient(body?.clientId);
  if (!client) return json(404, { error: "Unknown client." });
  if (!isUuid(body?.conversationId)) return json(400, { error: "A conversation id is required." });
  if (!Number.isInteger(body?.bytes) || body.bytes <= 0 || body.bytes > MAX_BYTES) {
    return json(400, { error: "That photo is too large. Photos are shrunk before upload." });
  }

  try {
    const clientRowId = await ensureClient(body.clientId, client.brand);
    // The conversation must belong to this client, so one client can't write into another's folder.
    const owned = await selectRows(
      "conversations",
      `id=eq.${body.conversationId}&client_id=eq.${clientRowId}&select=id&limit=1`
    );
    if (!owned[0]) return json(404, { error: "Unknown conversation." });

    const already = await selectRows(
      "photos",
      `conversation_id=eq.${body.conversationId}&select=id&limit=${MAX_PHOTOS + 1}`
    );
    if (already.length >= MAX_PHOTOS) {
      return json(429, { error: `You can add up to ${MAX_PHOTOS} photos.` });
    }

    const path = photoPath(body.clientId, body.conversationId);
    const link = await createUploadLink(path);
    await insertRow("photos", {
      conversation_id: body.conversationId,
      storage_path: path,
      bytes: body.bytes,
    });
    return json(200, link);
  } catch (err) {
    console.error("upload link failed:", err.message);
    return json(503, { error: "Photo upload is unavailable right now." });
  }
}
