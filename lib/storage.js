// Photo storage. Server only.
//
// The browser shrinks a photo, asks us for a one-time upload link, and uploads straight to
// Supabase Storage. Our server never carries the file. To show a photo to the model we mint
// a short-lived read link; the bucket itself stays private.

import { randomUUID } from "node:crypto";
import { dbEnabled } from "./db.js";

export const BUCKET = "chat-photos";
const READ_LINK_SECONDS = 600;

const baseUrl = () => (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const secret = () => process.env.SUPABASE_SECRET_KEY || "";

export function storageEnabled() {
  return dbEnabled();
}

async function storageRequest(path, { method = "POST", body } = {}) {
  const res = await fetch(`${baseUrl()}/storage/v1/${path}`, {
    method,
    headers: {
      apikey: secret(),
      Authorization: `Bearer ${secret()}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Storage ${method} ${path.split("?")[0]} failed: ${res.status} ${detail.slice(0, 200)}`);
  }
  return res.json();
}

/** Where a photo lives: client folder, chat folder, random name. Nothing guessable. */
export function photoPath(clientSlug, conversationId) {
  return `${clientSlug}/${conversationId}/${randomUUID()}.jpg`;
}

/**
 * A one-time upload link for exactly this path.
 * The browser PUTs the file to `uploadUrl` with the token; the link is useless for anything else.
 */
export async function createUploadLink(path) {
  const data = await storageRequest(`object/upload/sign/${BUCKET}/${path}`);
  return {
    path,
    token: data.token,
    // data.url is a relative path like /object/upload/sign/<bucket>/<path>?token=...
    uploadUrl: `${baseUrl()}/storage/v1${data.url}`,
  };
}

/** Is this a path we minted for this client and this chat? Stops one chat reading another's photos. */
export function isPhotoPathFor(path, clientSlug, conversationId) {
  if (typeof path !== "string" || path.length > 200) return false;
  const expected = new RegExp(`^${clientSlug}/${conversationId}/[0-9a-f-]{36}\\.jpg$`);
  return expected.test(path);
}

/** A short-lived read link, used to show a stored photo to the model. */
export async function createReadLink(path, seconds = READ_LINK_SECONDS) {
  const data = await storageRequest(`object/sign/${BUCKET}/${path}`, {
    body: { expiresIn: seconds },
  });
  return `${baseUrl()}/storage/v1${data.signedURL || data.signedUrl}`;
}

/** Read links for several photos. Any that fail are skipped rather than breaking the chat. */
export async function readLinksFor(paths) {
  const links = [];
  for (const path of paths) {
    try {
      links.push(await createReadLink(path));
    } catch (err) {
      console.error("photo link failed:", err.message);
    }
  }
  return links;
}
