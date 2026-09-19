import { test } from "node:test";
import assert from "node:assert/strict";
import { isDemoClient, publicClientConfig } from "./client-config.js";
import { loadClient } from "./rules.js";
import { loadTokens } from "./tokens.js";
import { readFileSync } from "node:fs";

// Load example-drywall for testing
const rules = JSON.parse(readFileSync(new URL("../clients/example-drywall/pricing-rules.json", import.meta.url)));
const brand = JSON.parse(readFileSync(new URL("../clients/example-drywall/brand.json", import.meta.url)));
const tokens = JSON.parse(readFileSync(new URL("../design/tokens.json", import.meta.url)));

test("isDemoClient: returns true for { is_demo: true }", () => {
  assert.equal(isDemoClient({ is_demo: true }), true);
});

test("isDemoClient: returns false for empty object", () => {
  assert.equal(isDemoClient({}), false);
});

test("isDemoClient: returns false for { is_demo: 'true' } (string, not boolean)", () => {
  assert.equal(isDemoClient({ is_demo: "true" }), false);
});

test("isDemoClient: returns false for { is_demo: 1 } (number, not boolean)", () => {
  assert.equal(isDemoClient({ is_demo: 1 }), false);
});

test("publicClientConfig has correct business_name, phone, is_demo, logo_url, and font for example-drywall", () => {
  const config = publicClientConfig({ rules, brand, tokens });
  assert.equal(config.business_name, "Example Drywall Co.");
  assert.equal(config.phone, "(555) 010-0100");
  assert.equal(config.is_demo, true);
  assert.equal(config.logo_url, null);
  assert.equal(config.font, "Inter");
});

test("publicClientConfig has theme object with --qb-color-brand", () => {
  const config = publicClientConfig({ rules, brand, tokens });
  assert.ok(config.theme);
  assert.ok(typeof config.theme === "object");
  assert.ok("--qb-color-brand" in config.theme);
});

test("publicClientConfig contains no pricing rules, modifiers, prices, or numbers outside theme", () => {
  const config = publicClientConfig({ rules, brand, tokens });
  const stringified = JSON.stringify(config);

  // Check for forbidden strings
  assert.ok(!stringified.includes("unit_price"), "should not contain unit_price");
  assert.ok(!stringified.includes("modifiers"), "should not contain modifiers");
  assert.ok(!stringified.includes("escalate_if"), "should not contain escalate_if");
  assert.ok(!stringified.includes("service_zips"), "should not contain service_zips");
  assert.ok(!stringified.includes("estimate_policy"), "should not contain estimate_policy");
  assert.ok(!stringified.includes("minimum_job"), "should not contain minimum_job");

  // Check for price numbers outside theme. Walk every non-theme value and ensure numbers only appear in theme.
  for (const [key, value] of Object.entries(config)) {
    if (key === "theme") continue; // Skip theme, it's allowed to have numbers
    const checkValue = (v, path) => {
      if (typeof v === "number") {
        throw new Error(`Found number ${v} at path ${path} outside of theme`);
      }
      if (typeof v === "string") {
        // Check for number tokens like :95 or :175
        assert.ok(!/:95[\s,}]/.test(v), `Found :95 in string at ${path}`);
        assert.ok(!/:175[\s,}]/.test(v), `Found :175 in string at ${path}`);
      }
      if (typeof v === "object" && v !== null && !Array.isArray(v)) {
        for (const [k, val] of Object.entries(v)) {
          checkValue(val, `${path}.${k}`);
        }
      }
      if (Array.isArray(v)) {
        v.forEach((item, idx) => checkValue(item, `${path}[${idx}]`));
      }
    };
    checkValue(value, key);
  }
});

test("publicClientConfig defaults font to first allowed when brand.font is not allowed", () => {
  const customBrand = { ...brand, font: "Comic Sans MS" };
  const config = publicClientConfig({ rules, brand: customBrand, tokens });
  assert.equal(config.font, "Inter"); // First in allowed_families
});
