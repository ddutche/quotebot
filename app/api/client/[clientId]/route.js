// GET /api/client/<clientId>
// Public branding for the widget and demo page. Never includes pricing rules.

import { loadClient } from "../../../../lib/rules.js";
import { loadTokens } from "../../../../lib/tokens.js";
import { publicClientConfig } from "../../../../lib/client-config.js";

export const runtime = "nodejs";

export async function GET(_request, { params }) {
  const { clientId } = await params;
  const client = await loadClient(clientId);
  if (!client) return Response.json({ error: "Unknown client." }, { status: 404 });
  const config = publicClientConfig({ ...client, tokens: await loadTokens() });
  return Response.json(config, { headers: { "Cache-Control": "public, max-age=300" } });
}
