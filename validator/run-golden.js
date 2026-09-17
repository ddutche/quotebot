// Runs a client's golden set through the pricing engine.
// Checks the deterministic half: given the right fields, do we get the right status and range?
// The AI half (did the bot extract those fields and talk correctly?) is scored with validator/RUBRIC.md.
//
// Usage: node validator/run-golden.js clients/<client-id>

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { estimate } from "../engine/price.js";

const dir = process.argv[2];
if (!dir) {
  console.error("Usage: node validator/run-golden.js clients/<client-id>");
  process.exit(1);
}

const rules = JSON.parse(readFileSync(join(dir, "pricing-rules.json"), "utf8"));
const cases = readFileSync(join(dir, "golden-set.jsonl"), "utf8")
  .split("\n")
  .filter((line) => line.trim())
  .map((line) => JSON.parse(line));

let failures = 0;
for (const c of cases) {
  const result = estimate(rules, c.expected_fields);
  const problems = [];
  if (result.status !== c.expected_status) problems.push(`status ${result.status}, expected ${c.expected_status}`);
  if (c.expected_range) {
    const [lo, hi] = c.expected_range;
    if (result.low !== lo || result.high !== hi) problems.push(`range ${result.low}-${result.high}, expected ${lo}-${hi}`);
  }
  if (problems.length) failures++;
  const label = problems.length ? "FAIL" : "pass";
  const range = result.status === "ok" ? ` $${result.low}-$${result.high}` : "";
  console.log(`${label}  ${c.id}  ${c.about} -> ${result.status}${range}${problems.length ? "  (" + problems.join("; ") + ")" : ""}`);
}

console.log(`\n${cases.length - failures}/${cases.length} passed`);
process.exit(failures ? 1 : 0);
