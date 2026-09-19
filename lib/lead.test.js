import { test } from "node:test";
import assert from "node:assert/strict";
import { validateLead } from "./lead.js";

test("validateLead: accepts valid lead with trimmed name", () => {
  const result = validateLead({
    name: "  Jane ",
    phone: "(716) 555-0100",
    best_time: "Morning",
    consent_texts: true,
  });
  assert.ok(result.lead);
  assert.equal(result.lead.name, "Jane");
  assert.equal(result.lead.phone, "(716) 555-0100");
  assert.equal(result.lead.best_time, "Morning");
  assert.equal(result.lead.consent_texts, true);
});

test("validateLead: consent_texts is only true for boolean true, not string 'true'", () => {
  const resultBoolean = validateLead({
    name: "John",
    phone: "(716) 555-0100",
    consent_texts: true,
  });
  assert.equal(resultBoolean.lead.consent_texts, true);

  const resultString = validateLead({
    name: "Jane",
    phone: "(716) 555-0100",
    consent_texts: "true",
  });
  assert.equal(resultString.lead.consent_texts, false);
});

test("validateLead: errors.name when name is missing", () => {
  const result = validateLead({
    phone: "(716) 555-0100",
    consent_texts: true,
  });
  assert.ok(result.errors);
  assert.ok(result.errors.name);
});

test("validateLead: errors.phone for invalid phone '12345'", () => {
  const result = validateLead({
    name: "Jane",
    phone: "12345",
    consent_texts: true,
  });
  assert.ok(result.errors);
  assert.ok(result.errors.phone);
});

test("validateLead: errors.phone when phone has 16 digits", () => {
  const result = validateLead({
    name: "Jane",
    phone: "1-234-567-8901-23456", // 16 digits when non-digits removed
    consent_texts: true,
  });
  assert.ok(result.errors);
  assert.ok(result.errors.phone);
});

test("validateLead: returns errors object (not throwing) when input is null", () => {
  const result = validateLead(null);
  assert.ok(result.errors);
  assert.ok(result.errors.name);
  assert.ok(result.errors.phone);
});

test("validateLead: cuts name to 80 characters", () => {
  const longName = "A".repeat(500);
  const result = validateLead({
    name: longName,
    phone: "(716) 555-0100",
    consent_texts: true,
  });
  assert.ok(result.lead);
  assert.equal(result.lead.name.length, 80);
});

test("validateLead: best_time defaults to null if not provided or empty", () => {
  const result1 = validateLead({
    name: "Jane",
    phone: "(716) 555-0100",
  });
  assert.equal(result1.lead.best_time, null);

  const result2 = validateLead({
    name: "John",
    phone: "(716) 555-0100",
    best_time: "   ",
  });
  assert.equal(result2.lead.best_time, null);
});

test("validateLead: accepts valid 10-digit phone", () => {
  const result = validateLead({
    name: "Jane",
    phone: "7165550100",
    consent_texts: true,
  });
  assert.ok(result.lead);
  assert.equal(result.lead.phone, "7165550100");
});

test("validateLead: accepts valid 15-digit phone", () => {
  const result = validateLead({
    name: "Jane",
    phone: "+1-716-555-0100-123", // 15 digits when non-digits removed
    consent_texts: true,
  });
  assert.ok(result.lead);
  assert.ok(result.lead.phone);
});
