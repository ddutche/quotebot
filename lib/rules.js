// Loads one client's files from clients/<id>/. Server only.
// Phase 3 moves rules into the database; callers shouldn't need to change.

import { readFile } from "node:fs/promises";
import { join } from "node:path";

const CLIENT_ID = /^[a-z0-9][a-z0-9-]{0,62}$/;

export function isValidClientId(id) {
  // Folders starting with "_" (like _template) are never loadable: the regex requires [a-z0-9] first.
  return typeof id === "string" && CLIENT_ID.test(id);
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

/**
 * @returns {Promise<{ rules: object, brand: object } | null>} null if the client doesn't exist
 */
export async function loadClient(clientId, root = process.cwd()) {
  if (!isValidClientId(clientId)) return null;
  const dir = join(root, "clients", clientId);
  try {
    const [rules, brand] = await Promise.all([
      readJson(join(dir, "pricing-rules.json")),
      readJson(join(dir, "brand.json")),
    ]);
    return { rules, brand };
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw err;
  }
}
