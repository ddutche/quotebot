// Saving chats. Every function here is best effort: if Supabase isn't set up, or a write
// fails, the customer's chat still works. Nothing here can change a price.

import { createHash } from "node:crypto";
import { dbEnabled, insertRow, insertRows, selectRows, updateRows, upsertRow } from "./db.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (v) => typeof v === "string" && UUID.test(v);

/** Visitors are identified by a salted hash, never a stored IP address. */
export function visitorHash(ip, userAgent = "") {
  if (!ip) return null;
  const salt = process.env.VISITOR_SALT || "quotebot";
  return createHash("sha256").update(`${salt}|${ip}|${userAgent}`).digest("hex").slice(0, 32);
}

/** Makes sure the client exists in the database and returns its row id. */
export async function ensureClient(slug, brand) {
  const row = await upsertRow(
    "clients",
    {
      slug,
      business_name: brand.business_name ?? slug,
      brand,
      is_demo: brand.is_demo === true,
    },
    "slug"
  );
  return row?.id ?? null;
}

/** The newest rules version row for a client, or null. */
export async function latestRulesVersion(clientRowId) {
  const rows = await selectRows(
    "rules_versions",
    `client_id=eq.${clientRowId}&select=id,version,rules,signed_off_by_owner&order=created_at.desc&limit=1`
  );
  return rows[0] ?? null;
}

/** Returns the conversation id, reusing the browser's if it really belongs to this client. */
export async function openConversation({ clientRowId, conversationId, sourceDomain, visitor }) {
  if (isUuid(conversationId)) {
    const rows = await selectRows(
      "conversations",
      `id=eq.${conversationId}&client_id=eq.${clientRowId}&select=id&limit=1`
    );
    if (rows[0]) return rows[0].id;
  }
  const row = await insertRow("conversations", {
    client_id: clientRowId,
    source_domain: sourceDomain ?? null,
    visitor_hash: visitor ?? null,
  });
  return row?.id ?? null;
}

/**
 * The rules to price with: the newest version in the database if there is one, otherwise the
 * file in clients/<id>/. The database wins because that's where an owner's signed version lands.
 * Falls back to the file on any problem, so pricing never depends on the database being up.
 */
export async function rulesForClient(slug, brand, fileRules) {
  if (!dbEnabled()) return { rules: fileRules, rulesVersionId: null, source: "file" };
  try {
    const clientRowId = await ensureClient(slug, brand);
    if (!clientRowId) return { rules: fileRules, rulesVersionId: null, source: "file" };
    const row = await latestRulesVersion(clientRowId);
    if (!row?.rules?.fields?.length) return { rules: fileRules, rulesVersionId: null, source: "file" };
    return { rules: row.rules, rulesVersionId: row.id, source: "database", clientRowId };
  } catch (err) {
    console.error("rules not loaded from the database, using the file:", err.message);
    return { rules: fileRules, rulesVersionId: null, source: "file" };
  }
}

/**
 * Saves one turn: the customer's message, the bot's reply (with why it was blocked, if it
 * was), and the estimate the engine produced.
 */
export async function saveTurn({
  conversationId,
  userMessage,
  photoCount = 0,
  reply,
  guard,
  result,
  rulesVersionId,
}) {
  await insertRows("messages", [
    { conversation_id: conversationId, role: "user", content: userMessage, photo_count: photoCount },
    {
      conversation_id: conversationId,
      role: "assistant",
      content: reply,
      blocked: Boolean(guard?.fell_back),
      block_reasons: guard?.problems?.length ? guard.problems : null,
    },
  ]);

  if (result) {
    await insertRow("estimates", {
      conversation_id: conversationId,
      rules_version_id: rulesVersionId ?? null,
      status: result.status,
      low: result.status === "ok" ? result.low : null,
      high: result.status === "ok" ? result.high : null,
      engine_input: result.engine_input ?? {},
      engine_output: result,
    });
  }

  await updateRows("conversations", `id=eq.${conversationId}`, {
    last_message_at: new Date().toISOString(),
    ...(result ? { outcome: result.status } : {}),
  });
}

/**
 * Wraps the whole save so a database problem can never break a chat.
 * Returns the conversation id when saving worked, otherwise null.
 */
export async function recordChat(args) {
  if (!dbEnabled()) return null;
  try {
    const clientRowId = await ensureClient(args.slug, args.brand);
    if (!clientRowId) return null;
    const rulesVersionId = args.rulesVersionId ?? (await latestRulesVersion(clientRowId))?.id ?? null;
    const conversationId = await openConversation({
      clientRowId,
      conversationId: args.conversationId,
      sourceDomain: args.sourceDomain,
      visitor: args.visitor,
    });
    if (!conversationId) return null;
    await saveTurn({ ...args, conversationId, rulesVersionId });
    return conversationId;
  } catch (err) {
    console.error("chat not saved:", err.message);
    return null;
  }
}
