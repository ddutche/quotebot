import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { estimate } from "./price.js";
import { checkReply, extractAmounts } from "./guard.js";

const rules = JSON.parse(readFileSync(new URL("../clients/example-drywall/pricing-rules.json", import.meta.url)));

const goodJob = {
  service_id: "patch_medium",
  quantity: 2,
  location: "wall",
  texture: "smooth",
  paint_included: true,
  zip: "14221",
  water_damage: false,
};

test("prices a normal job as a rounded range", () => {
  // 2 x 175 = 350, + paint 90, + trip 50 = 490. Range: 490*0.9=441 -> 425, 490*1.2=588 -> 600
  const r = estimate(rules, goodJob);
  assert.equal(r.status, "ok");
  assert.equal(r.low, 425);
  assert.equal(r.high, 600);
  assert.deepEqual(r.line_items.map((i) => i.amount), [350, 90, 50]);
});

test("applies ceiling multiplier, texture add-on, and minimum job", () => {
  // 1 x 95 x 1.25 = 118.75, + texture 75, + trip 50 = 243.75 -> minimum 250. Range 250 to 300.
  const r = estimate(rules, { ...goodJob, service_id: "patch_small", quantity: 1, location: "ceiling", texture: "orange_peel", paint_included: false });
  assert.equal(r.status, "ok");
  assert.equal(r.minimum_applied, true);
  assert.equal(r.low, 250);
  assert.equal(r.high, 300);
});

test("asks for missing info instead of guessing", () => {
  const { texture, zip, ...partial } = goodJob;
  const r = estimate(rules, partial);
  assert.equal(r.status, "need_info");
  assert.deepEqual(r.missing.map((m) => m.id).sort(), ["texture", "zip"]);
  assert.ok(r.missing.every((m) => typeof m.ask === "string"));
  assert.equal(r.low, undefined);
});

test("treats made-up option values as invalid", () => {
  const r = estimate(rules, { ...goodJob, texture: "sparkly" });
  assert.equal(r.status, "need_info");
  assert.equal(r.missing[0].problem, "invalid");
});

test("rejects jobs outside the service area", () => {
  assert.equal(estimate(rules, { ...goodJob, zip: "90210" }).status, "out_of_area");
});

test("rejects services the business does not quote online", () => {
  const r = estimate(rules, { ...goodJob, service_id: "full_remodel" });
  assert.equal(r.status, "need_info"); // not in the enum, so the bot must re-ask
});

test("sends water damage to a human, no price", () => {
  const r = estimate(rules, { ...goodJob, water_damage: true });
  assert.equal(r.status, "needs_review");
  assert.equal(r.low, undefined);
});

test("sends oversized jobs to a human", () => {
  const r = estimate(rules, { ...goodJob, quantity: 10 });
  assert.equal(r.status, "needs_review");
});

test("sends photo mismatches and older homes to a human", () => {
  assert.equal(estimate(rules, { ...goodJob, photo_matches_description: "no" }).status, "needs_review");
  assert.equal(estimate(rules, { ...goodJob, built_before_1980: "yes" }).status, "needs_review");
});

test("guard reads dollar amounts in different formats", () => {
  assert.deepEqual(extractAmounts("From $425 to $1,200.50, or about 300 dollars"), [425, 1200.5, 300]);
});

test("guard passes a correct estimate reply", () => {
  const r = estimate(rules, goodJob);
  const reply = "Your estimate is $425 to $600. This is an estimate, not a final quote.";
  assert.deepEqual(checkReply(reply, r), { ok: true, problems: [] });
});

test("guard blocks invented numbers", () => {
  const r = estimate(rules, goodJob);
  const out = checkReply("Your estimate is $425 to $600, but I can do $400 for you.", r);
  assert.equal(out.ok, false);
});

test("guard blocks any price when the engine did not approve one", () => {
  const review = estimate(rules, { ...goodJob, water_damage: true });
  assert.equal(checkReply("It will probably be around 500 bucks.", review).ok, false);
  assert.equal(checkReply("A team member will call you to confirm.", review).ok, true);
  assert.equal(checkReply("That's usually $300.", null).ok, false);
});

test("guard requires a range and the word estimate", () => {
  const r = estimate(rules, goodJob);
  assert.equal(checkReply("It costs $425.", r).ok, false);
  assert.equal(checkReply("It costs $425 to $600.", r).ok, false);
});
