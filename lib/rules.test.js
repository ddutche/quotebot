import { test } from "node:test";
import assert from "node:assert/strict";
import { isValidClientId, loadClient } from "./rules.js";

test("isValidClientId: accepts valid ids", () => {
  assert.equal(isValidClientId("example-drywall"), true);
  assert.equal(isValidClientId("a"), true);
  assert.equal(isValidClientId("abc-123"), true);
  assert.equal(isValidClientId("0client"), true);
});

test("isValidClientId: rejects ids starting with underscore", () => {
  assert.equal(isValidClientId("_template"), false);
  assert.equal(isValidClientId("_private"), false);
});

test("isValidClientId: rejects ids with uppercase", () => {
  assert.equal(isValidClientId("Example"), false);
  assert.equal(isValidClientId("EXAMPLE"), false);
});

test("isValidClientId: rejects empty, null, and non-string", () => {
  assert.equal(isValidClientId(""), false);
  assert.equal(isValidClientId(null), false);
  assert.equal(isValidClientId(undefined), false);
  assert.equal(isValidClientId(123), false);
});

test("isValidClientId: rejects ids longer than 63 chars", () => {
  assert.equal(isValidClientId("a".repeat(64)), false);
  assert.equal(isValidClientId("a".repeat(63)), true);
});

test("loadClient: loads example-drywall", async () => {
  const result = await loadClient("example-drywall");
  assert.ok(result);
  assert.equal(result.rules.client_id, "example-drywall");
  assert.equal(result.brand.client_id, "example-drywall");
  assert.ok(Array.isArray(result.rules.services));
  assert.ok(result.brand.business_name);
});

test("loadClient: returns null for invalid client id", async () => {
  const result = await loadClient("_template");
  assert.equal(result, null);
});

test("loadClient: returns null for nonexistent client", async () => {
  const result = await loadClient("does-not-exist");
  assert.equal(result, null);
});
