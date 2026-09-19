// One chat turn: model -> get_estimate -> engine -> reply -> guard.
// Golden rule 1 lives here: prices only come from engine/price.js, and no reply reaches the
// customer until engine/guard.js has read all of it (which is why there's no streaming).

import { estimate } from "../engine/price.js";
import { checkReply, extractAmounts } from "../engine/guard.js";
import { buildPrompt, buildTool } from "./prompt.js";
import { optionLabel } from "./options.js";

export const MAX_MESSAGES = 30;
export const MAX_MESSAGE_CHARS = 2000;
export const MAX_PHOTOS = 3;
// A 1600px JPEG at about 80% is usually 150 to 500 KB; base64 adds a third.
export const MAX_PHOTO_CHARS = 1_400_000;
const MAX_TOOL_ROUNDS = 3;
const JPEG_DATA_URL = /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/;

/**
 * Accepts only { role: "user" | "assistant", content: string } turns. Returns null if invalid.
 * Earlier user turns may carry photo_count (photos aren't re-sent; the model gets a note instead).
 */
export function sanitizeMessages(input) {
  if (!Array.isArray(input) || input.length === 0) return null;
  const out = [];
  for (const m of input) {
    if (!m || (m.role !== "user" && m.role !== "assistant")) return null;
    if (typeof m.content !== "string") return null;
    let content = m.content.trim().slice(0, MAX_MESSAGE_CHARS);
    const count = m.role === "user" && Number.isInteger(m.photo_count) ? Math.min(Math.max(m.photo_count, 0), MAX_PHOTOS) : 0;
    if (count > 0) content = `${content}\n[Customer sent ${count} photo${count === 1 ? "" : "s"} with this message.]`.trim();
    if (!content) return null;
    out.push({ role: m.role, content });
  }
  if (out[out.length - 1].role !== "user") return null;
  return out;
}

/** Photos for the newest message: up to 3 JPEG data URLs, already shrunk in the browser. null if invalid. */
export function sanitizePhotos(input) {
  if (input === undefined || input === null) return [];
  if (!Array.isArray(input) || input.length > MAX_PHOTOS) return null;
  for (const p of input) {
    if (typeof p !== "string" || p.length > MAX_PHOTO_CHARS || !JPEG_DATA_URL.test(p)) return null;
  }
  return input;
}

/** OpenAI-compatible multi-part content: the text plus each photo. */
function withPhotos(message, photos) {
  if (photos.length === 0) return message;
  return {
    role: message.role,
    content: [{ type: "text", text: message.content }, ...photos.map((url) => ({ type: "image_url", image_url: { url } }))],
  };
}

/** Keeps only this client's field ids with plain values. Returns null if nothing usable. */
export function sanitizeJob(rules, job) {
  if (!job || typeof job !== "object" || Array.isArray(job)) return null;
  const clean = {};
  let any = false;
  for (const field of rules.fields) {
    const v = job[field.id];
    const plain = v === null || ["string", "number", "boolean"].includes(typeof v);
    clean[field.id] = plain && v !== undefined ? v : null;
    if (clean[field.id] !== null) any = true;
  }
  return any ? clean : null;
}

function quickRepliesFor(rules, result) {
  if (result?.status !== "need_info") return null;
  const next = result.missing.find((m) => m.ask);
  const field = next && rules.fields.find((f) => f.id === next.id);
  if (!field) return null;
  if (field.type === "boolean") return { field: field.id, options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }] };
  if (field.type !== "enum") return null;
  const options = field.options.map((o) => {
    const label = optionLabel(rules, field, o);
    return { label, value: label };
  });
  return { field: field.id, options };
}

/** What the widget needs to draw a card. Line items are labels only (no per-line prices). */
function outcomeFor(result) {
  if (!result) return null;
  if (result.status === "ok") {
    return {
      status: "ok",
      low: result.low,
      high: result.high,
      included: result.line_items.map((i) => i.label),
      minimum_applied: result.minimum_applied,
      disclaimer: result.disclaimer,
    };
  }
  if (result.status === "need_info") return null;
  return { status: result.status, reasons: result.reasons ?? [] };
}

/**
 * @param {object} p
 * @param {object} p.rules      clients/<id>/pricing-rules.json
 * @param {object} p.brand      clients/<id>/brand.json
 * @param {string} p.template   bot/system-prompt.md (prompt part)
 * @param {object} p.model      from lib/model.js
 * @param {Array}  p.messages   sanitized user/assistant turns
 * @param {object} [p.job]      fields from the last get_estimate call, sent back by the browser.
 *                              Untrusted: we re-run the engine on it, so it can't carry a price.
 * @param {string[]} [p.photos] sanitized JPEG data URLs attached to the newest message
 */
export async function runChat({ rules, brand, template, model, messages, job, photos = [] }) {
  const { phone } = rules.business;
  const base = { mode: model.mode };

  if (messages.length > MAX_MESSAGES) {
    return {
      ...base,
      reply: `This chat has gotten long. Please call us at ${phone} and we'll help you directly.`,
      limit_reached: true,
      job: sanitizeJob(rules, job),
      outcome: null,
      quick_replies: null,
      guard: { retried: false, fell_back: false },
    };
  }

  const priorJob = sanitizeJob(rules, job);
  const priorResult = priorJob ? estimate(rules, priorJob) : null;

  const convo = [{ role: "system", content: buildPrompt(template, rules, brand) }];
  if (priorResult) {
    convo.push({
      role: "system",
      content: `Earlier in this chat, get_estimate returned: ${JSON.stringify(priorResult)}. Only repeat dollar amounts from this result. Call get_estimate again if the customer changes any detail.`,
    });
  }
  convo.push(...messages.slice(0, -1), withPhotos(messages[messages.length - 1], photos));

  const tool = buildTool(rules);
  let latestResult = null;
  let latestJob = priorJob;

  async function draft(startMessages) {
    const working = [...startMessages];
    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      const msg = await model.complete({ messages: working, tools: [tool], rules, priorResult });
      const calls = Array.isArray(msg.tool_calls) ? msg.tool_calls : [];
      if (calls.length === 0 || round === MAX_TOOL_ROUNDS) {
        return { text: typeof msg.content === "string" ? msg.content.trim() : "", working };
      }
      working.push({ role: "assistant", content: msg.content ?? null, tool_calls: calls });
      for (const call of calls) {
        let content;
        let args = null;
        try {
          args = JSON.parse(call.function?.arguments || "{}");
        } catch {
          args = null;
        }
        if (call.function?.name !== "get_estimate") {
          content = JSON.stringify({ error: "Unknown tool. Only get_estimate exists." });
        } else if (!args || typeof args !== "object") {
          content = JSON.stringify({ error: "Tool arguments were not valid JSON." });
        } else {
          const cleanJob = sanitizeJob(rules, args) ?? Object.fromEntries(rules.fields.map((f) => [f.id, null]));
          latestResult = estimate(rules, cleanJob);
          latestJob = cleanJob;
          content = JSON.stringify(latestResult);
        }
        working.push({ role: "tool", tool_call_id: call.id, content });
      }
    }
    return { text: "", working };
  }

  // A tool call this turn means the reply must match that result exactly (range + "estimate").
  // No tool call this turn: a reply with no dollar amounts is fine; any amount must match the prior result.
  function guardCheck(text) {
    if (!text) return { ok: false, problems: ["Reply was empty."] };
    if (latestResult) return checkReply(text, latestResult);
    if (extractAmounts(text).length === 0) return { ok: true, problems: [] };
    return checkReply(text, priorResult);
  }

  let { text, working } = await draft(convo);
  let verdict = guardCheck(text);
  let retried = false;

  if (!verdict.ok) {
    retried = true;
    const correction = {
      role: "system",
      content: `Your last reply was blocked before the customer saw it: ${verdict.problems.join(" ")} Rewrite it. Only use dollar amounts returned by get_estimate in this chat. For an "ok" result, give the range as "$low to $high", call it an estimate, and include the disclaimer.`,
    };
    const retry = await draft([...working, { role: "assistant", content: text || "(empty)" }, correction]);
    text = retry.text;
    verdict = guardCheck(text);
  }

  const fellBack = !verdict.ok;
  const reply = fellBack ? `Thanks! A team member will confirm your price. You can also call us at ${phone}.` : text;
  const fresh = latestResult;

  return {
    ...base,
    reply,
    job: latestJob,
    // Cards only come from a result produced this turn and only if the reply passed the guard.
    outcome: fellBack ? null : outcomeFor(fresh),
    quick_replies: fellBack ? null : quickRepliesFor(rules, fresh),
    guard: { retried, fell_back: fellBack, problems: verdict.ok ? [] : verdict.problems },
  };
}
