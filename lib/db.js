// Tiny Supabase REST client. Server only, no dependencies.
//
// Uses the secret key, which bypasses Row Level Security, so this file must never be
// imported by browser code (no "use client" file may import it).
// Everything here is optional: with no Supabase settings, dbEnabled() is false and the
// app runs exactly as it did before. A database problem must never break a chat.

const URL_ENV = "NEXT_PUBLIC_SUPABASE_URL";
const KEY_ENV = "SUPABASE_SECRET_KEY";

const baseUrl = () => (process.env[URL_ENV] || "").replace(/\/$/, "");
const secret = () => process.env[KEY_ENV] || "";

export function dbEnabled() {
  return Boolean(baseUrl() && secret());
}

/** True when half the settings are filled in, which is almost always a mistake worth logging. */
export function dbMisconfigured() {
  return Boolean(baseUrl()) !== Boolean(secret());
}

async function request(path, { method = "GET", body, prefer } = {}) {
  const headers = {
    apikey: secret(),
    Authorization: `Bearer ${secret()}`,
    "Content-Type": "application/json",
  };
  if (prefer) headers.Prefer = prefer;

  const res = await fetch(`${baseUrl()}/rest/v1/${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    // Never include the key or the full URL in an error we might log.
    throw new Error(`Supabase ${method} ${path.split("?")[0]} failed: ${res.status} ${detail.slice(0, 200)}`);
  }
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export async function insertRow(table, row) {
  const rows = await request(table, { method: "POST", body: row, prefer: "return=representation" });
  return Array.isArray(rows) ? rows[0] : rows;
}

export async function insertRows(table, rows) {
  if (rows.length === 0) return [];
  return (await request(table, { method: "POST", body: rows, prefer: "return=representation" })) ?? [];
}

/** upsert on a unique column, e.g. upsertRow("clients", { slug: "x", ... }, "slug") */
export async function upsertRow(table, row, onConflict) {
  const rows = await request(`${table}?on_conflict=${encodeURIComponent(onConflict)}`, {
    method: "POST",
    body: row,
    prefer: "return=representation,resolution=merge-duplicates",
  });
  return Array.isArray(rows) ? rows[0] : rows;
}

/** selectRows("conversations", "id=eq.123&select=id,client_id&limit=1") */
export async function selectRows(table, query = "") {
  return (await request(query ? `${table}?${query}` : table)) ?? [];
}

export async function updateRows(table, query, patch) {
  return (await request(`${table}?${query}`, { method: "PATCH", body: patch, prefer: "return=representation" })) ?? [];
}
