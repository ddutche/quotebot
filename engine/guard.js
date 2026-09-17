// Reply guard. Runs on every bot message BEFORE the customer sees it.
// Rule: the bot may only say dollar amounts that the pricing engine produced.
// If the engine did not return status "ok", the bot may not say any dollar amount.

const DOLLAR_SIGN = /\$\s?(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?/g;
const DOLLAR_WORD = /\b(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?\s*(?:dollars|bucks|usd)\b/gi;

export function extractAmounts(text) {
  const amounts = [];
  for (const pattern of [DOLLAR_SIGN, DOLLAR_WORD]) {
    for (const m of text.matchAll(pattern)) {
      const whole = Number(m[1].replace(/,/g, ""));
      const cents = m[2] ? Number(m[2].padEnd(2, "0")) / 100 : 0;
      amounts.push(whole + cents);
    }
  }
  return amounts;
}

/**
 * @param {string} reply   the bot's draft message
 * @param {object|null} result  the latest engine result for this chat (or null if none)
 * @returns {{ ok: boolean, problems: string[] }}
 */
export function checkReply(reply, result) {
  const problems = [];
  const amounts = extractAmounts(reply);

  if (!result || result.status !== "ok") {
    if (amounts.length > 0) problems.push(`Bot mentioned a price (${amounts.join(", ")}) without an approved estimate.`);
    return { ok: problems.length === 0, problems };
  }

  const allowed = new Set([result.low, result.high, ...result.line_items.map((i) => i.amount)]);
  for (const a of amounts) {
    if (!allowed.has(a)) problems.push(`Bot mentioned $${a}, which the pricing engine did not produce.`);
  }
  if (!amounts.includes(result.low) || !amounts.includes(result.high)) {
    problems.push("Estimate must be shown as a range with both the low and high number.");
  }
  if (!/estimate/i.test(reply)) {
    problems.push('Reply must call the price an "estimate".');
  }
  return { ok: problems.length === 0, problems };
}
