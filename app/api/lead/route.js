// POST /api/lead
// Body:    { clientId, name, phone, best_time?, consent_texts?: boolean, conversationId? }
// Returns: 200 { ok: true, saved, demo?, message }
//          400 { error, fields: { name?, phone? } }
//          501 { error, phone }   real client with no database yet: nothing would reach the owner
//
// Golden rule 8: the lead is written to the database first. The owner email (Resend) comes
// last, once the domain exists; `alert_sent` stays false until then.

import { loadClient } from "../../../lib/rules.js";
import { isDemoClient } from "../../../lib/client-config.js";
import { validateLead } from "../../../lib/lead.js";
import { dbEnabled, insertRow, selectRows } from "../../../lib/db.js";
import { ensureClient, isUuid } from "../../../lib/store.js";

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

  const demo = isDemoClient(client.brand);
  let saved = false;

  if (dbEnabled()) {
    try {
      const clientRowId = await ensureClient(body.clientId, client.brand);
      let conversationId = null;
      let estimateId = null;
      if (isUuid(body.conversationId)) {
        const owned = await selectRows(
          "conversations",
          `id=eq.${body.conversationId}&client_id=eq.${clientRowId}&select=id&limit=1`
        );
        if (owned[0]) {
          conversationId = owned[0].id;
          // Attach the newest estimate from this chat, so the owner sees the price with the lead.
          const estimates = await selectRows(
            "estimates",
            `conversation_id=eq.${conversationId}&select=id&order=created_at.desc&limit=1`
          );
          estimateId = estimates[0]?.id ?? null;
        }
      }

      const lead = await insertRow("leads", {
        client_id: clientRowId,
        conversation_id: conversationId,
        estimate_id: estimateId,
        ...checked.lead,
        alert_sent: false,
      });
      saved = Boolean(lead?.id);

      if (conversationId) {
        await insertRow("events", {
          client_id: clientRowId,
          conversation_id: conversationId,
          type: "lead_submitted",
          payload: { demo },
        });
      }
    } catch (err) {
      console.error("lead not saved:", err.message);
    }
  }

  if (demo) {
    return json(200, {
      ok: true,
      saved,
      demo: true,
      message: "Demo: in the live version, the owner gets these details right away.",
    });
  }

  if (!saved) {
    return json(501, {
      error: "Online booking isn't available yet. Please call us.",
      phone: client.rules.business.phone,
    });
  }

  return json(200, { ok: true, saved: true, message: "Thanks! We'll call you soon." });
}
