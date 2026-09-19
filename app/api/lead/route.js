// POST /api/lead
// Body:    { clientId, name, phone, best_time?, consent_texts?: boolean }
// Returns: 200 { ok: true, demo: true, message }     demo clients: checked, not saved or sent
//          400 { error, fields: { name?, phone? } }
//          501 { error, phone }                       real clients until Phase 3 saves leads

import { loadClient } from "../../../lib/rules.js";
import { isDemoClient } from "../../../lib/client-config.js";
import { validateLead } from "../../../lib/lead.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(status, body) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request) {
  const raw = await request.text();
  if (raw.length > 8_000) return json(413, { error: "Request too large." });
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return json(400, { error: "Request body must be JSON." });
  }

  const client = await loadClient(body?.clientId);
  if (!client) return json(404, { error: "Unknown client." });

  const checked = validateLead(body);
  if (checked.errors) return json(400, { error: "Please fix the highlighted fields.", fields: checked.errors });

  if (isDemoClient(client.brand)) {
    return json(200, {
      ok: true,
      demo: true,
      message: "Demo: in the live version, the owner gets these details right away.",
    });
  }

  return json(501, {
    error: "Online booking isn't available yet. Please call us.",
    phone: client.rules.business.phone,
  });
}
