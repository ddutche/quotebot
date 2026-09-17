// Quotebot pricing engine.
// Plain code, no AI. The chatbot collects the job details, this file does the math.
// Same input + same rules = same answer, every time.

/** Does a job value meet a rule condition like { field, equals } or { field, in: [...] }? */
export function matches(condition, job) {
  const value = job[condition.field];
  if ("equals" in condition) return value === condition.equals;
  if ("in" in condition) return condition.in.includes(value);
  return false;
}

function isBlank(value) {
  return value === undefined || value === null || value === "";
}

/** Returns the fields that are missing or invalid, with the question the bot should ask. */
export function findMissing(rules, job) {
  const missing = [];
  for (const field of rules.fields) {
    const value = job[field.id];
    if (isBlank(value)) {
      if (field.required) missing.push({ id: field.id, ask: field.ask, problem: "missing" });
      continue;
    }
    let valid = true;
    if (field.type === "enum") valid = field.options.includes(value);
    if (field.type === "number") valid = typeof value === "number" && Number.isFinite(value) && value > 0;
    if (field.type === "boolean") valid = typeof value === "boolean";
    if (field.type === "string") valid = typeof value === "string";
    if (!valid) missing.push({ id: field.id, ask: field.ask, problem: "invalid" });
  }
  return missing;
}

const money = (n) => Math.round(n * 100) / 100;
const roundDown = (n, step) => Math.floor(n / step) * step;
const roundUp = (n, step) => Math.ceil(n / step) * step;

/**
 * Main entry point.
 * status is one of: ok, need_info, out_of_area, out_of_scope, needs_review
 * Only "ok" includes a price. Every other status means the bot must NOT give a number.
 */
export function estimate(rules, job) {
  const base = { rules_version: rules.rules_version, client_id: rules.client_id };

  const missing = findMissing(rules, job);
  if (missing.length > 0) return { ...base, status: "need_info", missing };

  if (!rules.business.service_zips.includes(job.zip)) {
    return { ...base, status: "out_of_area", reasons: ["This ZIP code is outside our service area."] };
  }

  const service = rules.services.find((s) => s.id === job.service_id);
  if (!service) {
    return { ...base, status: "out_of_scope", reasons: ["We don't quote this type of job online."] };
  }

  const reasons = [];
  if (job.quantity > service.max_quantity) {
    reasons.push("This job is larger than what we can estimate online.");
  }
  for (const rule of rules.escalate_if ?? []) {
    if (matches(rule.when, job)) reasons.push(rule.reason);
  }
  if (reasons.length > 0) return { ...base, status: "needs_review", reasons };

  // Price it.
  const lineItems = [];
  let serviceAmount = job.quantity * service.unit_price;
  const applied = [];

  for (const mod of rules.modifiers ?? []) {
    if (mod.multiply !== undefined && matches(mod.when, job)) {
      serviceAmount *= mod.multiply;
      applied.push(mod.id);
    }
  }
  lineItems.push({ id: service.id, label: `${service.label} x ${job.quantity}`, amount: money(serviceAmount) });

  for (const mod of rules.modifiers ?? []) {
    if (mod.add !== undefined && matches(mod.when, job)) {
      lineItems.push({ id: mod.id, label: mod.label, amount: money(mod.add) });
      applied.push(mod.id);
    }
  }
  for (const fee of rules.fees ?? []) {
    lineItems.push({ id: fee.id, label: fee.label, amount: money(fee.amount) });
  }

  const subtotal = money(lineItems.reduce((sum, item) => sum + item.amount, 0));
  const policy = rules.estimate_policy;
  const total = Math.max(subtotal, policy.minimum_job);

  const low = Math.max(roundDown(total * (1 - policy.range_low_pct), policy.round_to), policy.minimum_job);
  const high = Math.max(roundUp(total * (1 + policy.range_high_pct), policy.round_to), low);

  return {
    ...base,
    status: "ok",
    low,
    high,
    line_items: lineItems,
    applied_modifiers: applied,
    minimum_applied: subtotal < policy.minimum_job,
    disclaimer: policy.disclaimer,
  };
}
