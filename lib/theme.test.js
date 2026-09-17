import { test } from "node:test";
import assert from "node:assert/strict";
import { contrastRatio, resolveBrandColors, buildTheme } from "./theme.js";
import { readFileSync } from "node:fs";

test("contrastRatio: white vs black is about 21", () => {
  const ratio = contrastRatio("#FFFFFF", "#000000");
  assert.ok(Math.abs(ratio - 21) < 0.01);
});

test("contrastRatio: same color is 1", () => {
  const ratio = contrastRatio("#1F4E79", "#1F4E79");
  assert.equal(ratio, 1);
});

test("contrastRatio: is symmetric", () => {
  const a = contrastRatio("#FF0000", "#0000FF");
  const b = contrastRatio("#0000FF", "#FF0000");
  assert.equal(a, b);
});

test("contrastRatio: handles uppercase, lowercase, and no hash", () => {
  const a = contrastRatio("#FFFFFF", "#000000");
  const b = contrastRatio("#ffffff", "#000000");
  const c = contrastRatio("FFFFFF", "000000");
  assert.equal(a, b);
  assert.equal(b, c);
});

test("resolveBrandColors: dark blue brand returns white text", () => {
  const result = resolveBrandColors("#1F4E79");
  assert.equal(result.brand, "#1F4E79");
  assert.equal(result.contrast, "#FFFFFF");
  assert.equal(result.darkened, false);
  assert.ok(contrastRatio("#1F4E79", "#FFFFFF") >= 4.5);
});

test("resolveBrandColors: light color (yellow) gets dark text and darkened copy for text", () => {
  const result = resolveBrandColors("#FFD400"); // bright yellow
  assert.equal(result.brand, "#FFD400");
  assert.ok(result.contrast === "#16181D" || result.contrast === "#000000");
  assert.ok(result.darkened);
  if (result.text) {
    assert.ok(contrastRatio(result.text, "#FFFFFF") >= 4.5);
  }
});

test("resolveBrandColors: mid color gets darkened if needed", () => {
  const result = resolveBrandColors("#4CAF50"); // green
  assert.ok(contrastRatio(result.brand, result.contrast) >= 4.5);
});

test("resolveBrandColors: invalid input returns valid hex", () => {
  const result = resolveBrandColors("not-a-color");
  assert.ok(result.brand);
  assert.ok(/^#[0-9A-F]{6}$/i.test(result.brand));
  assert.ok(result.contrast);
});

test("buildTheme: example-drywall includes required vars", () => {
  const tokens = JSON.parse(readFileSync(new URL("../design/tokens.json", import.meta.url)));
  const brand = JSON.parse(readFileSync(new URL("../clients/example-drywall/brand.json", import.meta.url)));

  const vars = buildTheme(tokens, brand);

  assert.ok(vars["--qb-color-brand"]);
  assert.ok(vars["--qb-space-4"]);
  assert.equal(vars["--qb-space-4"], "16px");
  assert.ok(vars["--qb-text-base"]);
  assert.equal(vars["--qb-text-base"], "16px");
  assert.ok(vars["--qb-radius-md"]);
  assert.equal(vars["--qb-radius-md"], "10px");
});

test("buildTheme: square corners applies square radius", () => {
  const tokens = JSON.parse(readFileSync(new URL("../design/tokens.json", import.meta.url)));
  const brand = JSON.parse(readFileSync(new URL("../clients/example-drywall/brand.json", import.meta.url)));

  const vars = buildTheme(tokens, { ...brand, corners: "square" });
  assert.equal(vars["--qb-radius-md"], "4px");
});

test("buildTheme: nonexistent font falls back to allowed_families[0]", () => {
  const tokens = JSON.parse(readFileSync(new URL("../design/tokens.json", import.meta.url)));
  const brand = JSON.parse(readFileSync(new URL("../clients/example-drywall/brand.json", import.meta.url)));

  const vars = buildTheme(tokens, { ...brand, font: "Comic Sans MS" });
  assert.ok(vars["--qb-font"]);
  assert.ok(vars["--qb-font"].startsWith("'Inter'"));
});

test("buildTheme: contains no unfilled placeholders", () => {
  const tokens = JSON.parse(readFileSync(new URL("../design/tokens.json", import.meta.url)));
  const brand = JSON.parse(readFileSync(new URL("../clients/example-drywall/brand.json", import.meta.url)));

  const vars = buildTheme(tokens, brand);

  for (const [key, value] of Object.entries(vars)) {
    assert.ok(!value.includes("{"), `${key} contains unfilled placeholder: ${value}`);
  }
});

test("buildTheme: all expected sections are present", () => {
  const tokens = JSON.parse(readFileSync(new URL("../design/tokens.json", import.meta.url)));
  const brand = JSON.parse(readFileSync(new URL("../clients/example-drywall/brand.json", import.meta.url)));

  const vars = buildTheme(tokens, brand);

  // Colors
  assert.ok(vars["--qb-color-brand"]);
  assert.ok(vars["--qb-color-brand-contrast"]);

  // Font
  assert.ok(vars["--qb-font"]);

  // Type scale
  assert.ok(vars["--qb-text-xs"]);
  assert.ok(vars["--qb-text-base"]);

  // Spacing
  assert.ok(vars["--qb-space-1"]);
  assert.ok(vars["--qb-space-8"]);

  // Radius
  assert.ok(vars["--qb-radius-sm"]);
  assert.ok(vars["--qb-radius-md"]);

  // Layout
  assert.ok(vars["--qb-widget-width"]);
  assert.ok(vars["--qb-tap-target"]);
});
