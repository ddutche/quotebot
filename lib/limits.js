// Abuse limits. All of these fail open: if the database can't answer, the chat still works.
// The point is to stop casual abuse of a client's AI budget, not to be a security wall.

import { dbEnabled, selectRows } from "./db.js";

export const MAX_CHATS_PER_VISITOR_PER_DAY = 10;

/** Does this website host match an allowed domain (exact, or a subdomain of it)? */
export function hostMatches(host, domain) {
  if (!host || !domain) return false;
  const h = host.toLowerCase().replace(/:\d+$/, "");
  const d = domain.toLowerCase().replace(/^\*\./, "").replace(/:\d+$/, "");
  return h === d || h.endsWith(`.${d}`);
}

/**
 * A client with no domains listed is allowed anywhere (that's how we demo and develop).
 * Once domains are listed, only those websites can use that client's widget.
 */
export async function websiteAllowed(clientRowId, host) {
  if (!dbEnabled() || !clientRowId) return { allowed: true, reason: "no database" };
  try {
    const rows = await selectRows("client_domains", `client_id=eq.${clientRowId}&select=domain`);
    if (rows.length === 0) return { allowed: true, reason: "no list" };
    // A request with no origin header (curl, our own test runner) is allowed through;
    // browsers always send one, so this only affects tools, not customers.
    if (!host) return { allowed: true, reason: "no origin" };
    const allowed = rows.some((r) => hostMatches(host, r.domain));
    return { allowed, reason: allowed ? "listed" : "not listed" };
  } catch (err) {
    console.error("website check skipped:", err.message);
    return { allowed: true, reason: "check failed" };
  }
}

/** How many chats has this visitor started with this client in the last day? */
export async function visitorWithinLimit(clientRowId, visitor) {
  if (!dbEnabled() || !clientRowId || !visitor) return { allowed: true, reason: "not counted" };
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const rows = await selectRows(
      "conversations",
      `client_id=eq.${clientRowId}&visitor_hash=eq.${visitor}&started_at=gte.${since}&select=id&limit=${MAX_CHATS_PER_VISITOR_PER_DAY + 1}`
    );
    const allowed = rows.length <= MAX_CHATS_PER_VISITOR_PER_DAY;
    return { allowed, reason: allowed ? "under limit" : "too many chats today", count: rows.length };
  } catch (err) {
    console.error("visitor check skipped:", err.message);
    return { allowed: true, reason: "check failed" };
  }
}
