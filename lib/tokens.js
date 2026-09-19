import { readFile } from "node:fs/promises";
import { join } from "node:path";

let cached;
export async function loadTokens(root = process.cwd()) {
  cached ??= JSON.parse(await readFile(join(root, "design", "tokens.json"), "utf8"));
  return cached;
}
