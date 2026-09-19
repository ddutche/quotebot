// Plays a client's golden set against the running chat API and grades each conversation.
// This checks the AI half that run-golden.js can't: did the bot pull out the right fields
// and talk correctly? Code checks run always; the GPT judge runs when OPENAI_API_KEY and
// JUDGE_MODEL are set (see validator/RUBRIC.md).
//
// Start the app first (npm run dev), then:
//   npm run live
//   node --env-file-if-exists=.env.local validator/run-live.js clients/<id> [--url http://localhost:3000] [--runs 3] [--only g01,g05]

import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { estimate } from "../engine/price.js";
import { extractAmounts } from "../engine/guard.js";

const args = process.argv.slice(2);
const dir = args.find((a) => !a.startsWith("--"));
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
if (!dir) {
  console.error("Usage: node validator/run-live.js clients/<client-id> [--url http://localhost:3000] [--runs 3] [--only g01,g05]");
  process.exit(1);
}

const baseUrl = flag("url", "http://localhost:3000").replace(/\/$/, "");
const runs = Math.max(1, Number(flag("runs", "1")) || 1);
const only = flag("only", "") ? new Set(flag("only", "").split(",")) : null;
const clientId = basename(dir);

const rules = JSON.parse(readFileSync(join(dir, "pricing-rules.json"), "utf8"));
const cases = readFileSync(join(dir, "golden-set.jsonl"), "utf8")
  .split("\n")
  .filter((line) => line.trim())
  .map((line) => JSON.parse(line))
  .filter((c) => !only || only.has(c.id));

const rubric = readFileSync(new URL("./RUBRIC.md", import.meta.url), "utf8");
const judgePrompt = (/## Judge prompt[^\n]*\n+>\s*([^\n]+)/.exec(rubric) ?? [])[1];
const judgeOn = Boolean(process.env.OPENAI_API_KEY && process.env.JUDGE_MODEL && judgePrompt);

async function post(body) {
  const res = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`/api/chat returned ${res.status}: ${data.error ?? "no body"}`);
  return data;
}

async function playCase(c) {
  const messages = [];
  const turns = [];
  let job = null;
  let mode = null;
  for (const text of c.customer_messages) {
    messages.push({ role: "user", content: text });
    const data = await post({ clientId, messages, job });
    mode = data.mode;
    job = data.job ?? job;
    messages.push({ role: "assistant", content: data.reply });
    turns.push({ customer: text, bot: data.reply, job: data.job, outcome: data.outcome, guard: data.guard });
  }
  return { mode, job, turns };
}

/** The deterministic checks. Critical ones decide pass/fail without the judge. */
function codeChecks(c, played) {
  const checks = [];
  const add = (id, name, critical, pass, note = "") => checks.push({ id, name, critical, pass, note });

  const expected = Object.fromEntries(rules.fields.map((f) => [f.id, c.expected_fields[f.id] ?? null]));
  const wrong = rules.fields
    .filter((f) => (played.job?.[f.id] ?? null) !== expected[f.id])
    .map((f) => `${f.id}=${JSON.stringify(played.job?.[f.id] ?? null)} (want ${JSON.stringify(expected[f.id])})`);
  add("C1", "Fields extracted", true, wrong.length === 0, wrong.join(", "));

  const result = played.job ? estimate(rules, played.job) : null;
  const status = result?.status ?? "no_tool_call";
  add("C3", "Right outcome", true, status === c.expected_status, status === c.expected_status ? "" : `got ${status}, want ${c.expected_status}`);

  if (c.expected_range) {
    const [lo, hi] = c.expected_range;
    const shown = played.turns.some((t) => {
      const amounts = extractAmounts(t.bot);
      return amounts.includes(lo) && amounts.includes(hi);
    });
    add("R", "Range shown", true, shown, shown ? "" : `never showed $${lo} to $${hi}`);
  } else {
    const priced = played.turns.filter((t) => extractAmounts(t.bot).length > 0);
    add("C2", "No price when none allowed", true, priced.length === 0, priced.map((t) => t.bot).join(" | "));
  }

  const blocked = played.turns.filter((t) => t.guard?.retried);
  add("G", "Guard never had to block", false, blocked.length === 0, blocked.length ? `${blocked.length} blocked repl${blocked.length === 1 ? "y" : "ies"}` : "");
  return checks;
}

async function judge(c, played) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: process.env.JUDGE_MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: judgePrompt },
        { role: "user", content: JSON.stringify({ case: c, transcript: played.turns, rules }) },
      ],
    }),
  });
  if (!res.ok) return { error: `judge HTTP ${res.status}` };
  const data = await res.json();
  try {
    return JSON.parse(data.choices[0].message.content);
  } catch {
    return { error: "judge did not return JSON" };
  }
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
let cleanRuns = 0;

for (let run = 1; run <= runs; run++) {
  const outDir = join("validator", "runs", `${clientId}-${stamp}`, `run-${run}`);
  mkdirSync(outDir, { recursive: true });
  let failures = 0;
  let mode = null;

  console.log(`\nRun ${run} of ${runs}  (${baseUrl}, judge ${judgeOn ? process.env.JUDGE_MODEL : "off"})`);
  for (const c of cases) {
    let played;
    try {
      played = await playCase(c);
    } catch (err) {
      failures++;
      console.log(`ERROR ${c.id}  ${c.about}  (${err.message})`);
      continue;
    }
    mode = played.mode;
    const checks = codeChecks(c, played);
    const verdict = judgeOn ? await judge(c, played) : null;
    const criticalFail = checks.some((k) => k.critical && !k.pass) || verdict?.passed === false || Boolean(verdict?.error);
    if (criticalFail) failures++;

    writeFileSync(join(outDir, `${c.id}.json`), JSON.stringify({ case: c, mode: played.mode, ...played, checks, judge: verdict }, null, 2));

    const failed = checks.filter((k) => !k.pass).map((k) => `${k.id} ${k.note}`.trim());
    if (verdict?.error) failed.push(verdict.error);
    else if (verdict) failed.push(...verdict.checks.filter((k) => !k.pass).map((k) => `judge ${k.id}: ${k.note}`));
    console.log(`${criticalFail ? "FAIL" : "pass"}  ${c.id}  ${c.about}${failed.length ? "\n        " + failed.join("\n        ") : ""}`);
  }

  console.log(`${cases.length - failures}/${cases.length} passed. Transcripts: ${outDir}`);
  if (mode === "test") {
    console.log("NOTE: test mode. The scripted bot only understands one answer per question, so it can't read these");
    console.log("      free-text golden messages. Failures here are expected; this run only proves the harness works.");
  }
  if (failures === 0) cleanRuns++;
  else cleanRuns = 0;
}

if (runs > 1) console.log(`\n${cleanRuns === runs ? "PASSED" : "NOT PASSED"}: ${cleanRuns} clean run(s) in a row out of ${runs}.`);
process.exit(cleanRuns === runs ? 0 : 1);
