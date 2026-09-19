// Test mode: a scripted stand-in for the chatbot model, used until API keys exist.
//
// It speaks the same OpenAI-compatible message format as a real model, so /api/chat runs the
// exact same path: tool call -> engine/price.js -> reply -> engine/guard.js.
// It never computes or invents a price. Every number it says is copied from a tool result.
// It only understands one answer per question (no free-text understanding), which is why
// live golden runs in test mode check the harness, not bot quality.

import { humanize, optionLabel } from "./options.js";

const UNSURE = /\b(not sure|unsure|no idea|don'?t know|dunno|idk|no clue)\b/i;
const YES = /^\s*(yes|yeah|yep|yup|sure|ok|okay|y|please|definitely|correct|true)\b/i;
const NO = /^\s*(no|nope|nah|n|none|false|not really)\b/i;

function parseAnswer(rules, field, text) {
  const t = String(text ?? "").trim();
  if (!t) return null;
  if (field.type === "enum") {
    if (UNSURE.test(t)) return field.options.includes("unknown") ? "unknown" : null;
    const lower = t.toLowerCase();
    // Exact label first (what a quick-reply chip sends), then the option's words anywhere.
    const exact = field.options.find((o) => optionLabel(rules, field, o).toLowerCase() === lower);
    if (exact) return exact;
    const hits = field.options.filter((o) => o !== "unknown" && lower.includes(humanize(o).toLowerCase()));
    hits.sort((a, b) => b.length - a.length);
    return hits[0] ?? null;
  }
  if (UNSURE.test(t)) return null;
  if (field.type === "boolean") return YES.test(t) ? true : NO.test(t) ? false : null;
  if (field.type === "number") {
    const m = /\d+(?:\.\d+)?/.exec(t);
    return m ? Number(m[0]) : null;
  }
  return t.slice(0, 100);
}

function textOf(message) {
  if (typeof message.content === "string") return message.content;
  if (Array.isArray(message.content)) return message.content.filter((p) => p.type === "text").map((p) => p.text).join(" ");
  return "";
}

/** Which field was this bot message asking about? Longest matching question wins. */
function askedField(rules, text) {
  const matches = rules.fields.filter((f) => f.ask && text.includes(f.ask));
  matches.sort((a, b) => b.ask.length - a.ask.length);
  return matches[0] ?? null;
}

/** Rebuilds what the customer has told us from the conversation so far. */
export function rebuildJob(rules, messages) {
  const job = Object.fromEntries(rules.fields.map((f) => [f.id, null]));
  let pending = null;
  let lastUnclear = null;
  let lastResult = null;
  for (const m of messages) {
    if (m.role === "assistant" && !m.tool_calls) pending = askedField(rules, textOf(m));
    if (m.role === "tool") {
      try {
        lastResult = JSON.parse(m.content);
      } catch {
        lastResult = null;
      }
    }
    if (m.role === "user") {
      if (pending) {
        const value = parseAnswer(rules, pending, textOf(m));
        if (value === null) lastUnclear = pending.id;
        else {
          job[pending.id] = value;
          lastUnclear = null;
        }
      }
      pending = null;
    }
  }
  return { job, lastUnclear, lastResult };
}

const FINAL = new Set(["ok", "needs_review", "out_of_area", "out_of_scope"]);

function replyFor(result, rules, lastUnclear) {
  const { phone, hours } = rules.business;
  switch (result.status) {
    case "ok":
      return `Your estimate is $${result.low} to $${result.high}. ${result.disclaimer} Want to book a visit? Just send your name and phone number.`;
    case "need_info": {
      const next = result.missing.find((m) => m.ask) ?? result.missing[0];
      const field = rules.fields.find((f) => f.id === next.id);
      if (next.id === lastUnclear && field?.type === "enum") {
        const options = field.options.filter((o) => o !== "unknown").map((o) => optionLabel(rules, field, o).toLowerCase()).join(", ");
        return `No problem. ${next.ask} The options are: ${options}. A photo helps too.`;
      }
      if (next.id === lastUnclear || next.problem === "invalid") return `Sorry, I didn't catch that. ${next.ask}`;
      return next.ask ?? `Could you tell me a bit more? You can also call us at ${phone}.`;
    }
    case "needs_review":
      return `Thanks for the details. A team member will look at this and call you. ${result.reasons[0]} What's your name and phone number?`;
    case "out_of_area":
      return `Sorry, that address is outside the area we serve. You're welcome to call us at ${phone} with questions.`;
    case "out_of_scope":
      return `That's not something we can estimate online. If you share your name and phone number, the team will follow up.`;
    default:
      return `Something went wrong. Call us at ${phone} (${hours}).`;
  }
}

export function createMockModel() {
  let calls = 0;
  return {
    mode: "test",
    name: "mock",
    async complete({ messages, rules, priorResult = null }) {
      const last = messages[messages.length - 1];
      const { job, lastUnclear, lastResult } = rebuildJob(rules, messages);

      // A tool result just came back: answer from it, and only from it.
      if (last?.role === "tool") {
        return { role: "assistant", content: replyFor(lastResult ?? { status: "error" }, rules, lastUnclear) };
      }

      // The estimate was done in an earlier turn; the customer is replying to it (name, phone, thanks).
      const earlier = lastResult ?? priorResult;
      if (earlier && FINAL.has(earlier.status)) {
        const { phone, hours } = rules.business;
        return {
          role: "assistant",
          content: `Thanks! The team will reach out during business hours (${hours}). You can also call ${phone}.`,
        };
      }

      calls += 1;
      return {
        role: "assistant",
        content: null,
        tool_calls: [
          {
            id: `mock_call_${calls}`,
            type: "function",
            function: { name: "get_estimate", arguments: JSON.stringify(job) },
          },
        ],
      };
    },
  };
}
