import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTool, buildPrompt, extractTemplate, loadTemplate } from "./prompt.js";
import { readFileSync } from "node:fs";

const rules = JSON.parse(readFileSync(new URL("../clients/example-drywall/pricing-rules.json", import.meta.url)));
const brand = JSON.parse(readFileSync(new URL("../clients/example-drywall/brand.json", import.meta.url)));
const toolSpec = JSON.parse(readFileSync(new URL("../bot/get_estimate.tool.json", import.meta.url)));

test("extractTemplate: keeps content after the first ---", () => {
  const markdown = "# Title\nSome preamble\n---\nActual prompt content\nMore lines";
  const result = extractTemplate(markdown);
  assert.ok(result.includes("Actual prompt content"));
  assert.ok(!result.includes("preamble"));
});

test("extractTemplate: handles multiple --- separators", () => {
  const markdown = "Preamble\n---\nFirst part\n---\nSecond part";
  const result = extractTemplate(markdown);
  assert.ok(result.includes("First part"));
  assert.ok(result.includes("Second part"));
});

test("extractTemplate: returns whole input if no --- found", () => {
  const markdown = "Just a prompt, no separator";
  const result = extractTemplate(markdown);
  assert.equal(result, markdown);
});

test("extractTemplate: trims whitespace", () => {
  const markdown = "---\n\n  Trimmed content  \n";
  const result = extractTemplate(markdown);
  assert.equal(result, "Trimmed content");
});

test("buildPrompt: replaces business_name", async () => {
  const template = await loadTemplate();
  const prompt = buildPrompt(template, rules, brand);
  assert.ok(prompt.includes("Example Drywall Co."));
});

test("buildPrompt: replaces phone", async () => {
  const template = await loadTemplate();
  const prompt = buildPrompt(template, rules, brand);
  assert.ok(prompt.includes("(555) 010-0100"));
});

test("buildPrompt: includes disclaimer", async () => {
  const template = await loadTemplate();
  const prompt = buildPrompt(template, rules, brand);
  assert.ok(prompt.includes("This is an estimate, not a final quote"));
});

test("buildPrompt: replaces fields_as_bullets", async () => {
  const template = await loadTemplate();
  const prompt = buildPrompt(template, rules, brand);
  assert.ok(prompt.includes("`service_id` (required"));
  assert.ok(prompt.includes("`quantity` (required"));
  assert.ok(prompt.includes("`water_damage` (required"));
});

test("buildPrompt: includes ask text for fields", async () => {
  const template = await loadTemplate();
  const prompt = buildPrompt(template, rules, brand);
  assert.ok(prompt.includes("What kind of damage is it"));
});

test("buildPrompt: preserves {{low}} and {{high}} placeholders", async () => {
  const template = await loadTemplate();
  const prompt = buildPrompt(template, rules, brand);
  assert.ok(prompt.includes("{{low}}"));
  assert.ok(prompt.includes("{{high}}"));
});

test("buildPrompt: contains no unfilled {{...}} placeholders", async () => {
  const template = await loadTemplate();
  const prompt = buildPrompt(template, rules, brand);
  const unfilled = prompt.match(/\{\{[^}]+\}\}/g)?.filter(p => !["{{low}}", "{{high}}"].includes(p));
  assert.ok(!unfilled || unfilled.length === 0, `Unfilled placeholders: ${unfilled?.join(", ")}`);
});

test("buildTool: function.name is get_estimate", () => {
  const tool = buildTool(rules);
  assert.equal(tool.function.name, "get_estimate");
});

test("buildTool: type is 'function'", () => {
  const tool = buildTool(rules);
  assert.equal(tool.type, "function");
});

test("buildTool: required fields match the tool spec", () => {
  const tool = buildTool(rules);
  // The tool spec includes all fields (both required and optional) in the required array
  // because the function call must include them (with null for optional ones).
  assert.deepEqual(
    tool.function.parameters.required.sort(),
    toolSpec.function.parameters.required.sort()
  );
});

test("buildTool: matches tool spec structure", () => {
  const tool = buildTool(rules);
  
  // Type check
  assert.equal(tool.type, toolSpec.type);
  assert.equal(tool.function.name, toolSpec.function.name);
  
  // Required fields
  assert.deepEqual(
    tool.function.parameters.required.sort(),
    toolSpec.function.parameters.required.sort()
  );
  
  // Properties types and enums
  for (const fieldId in toolSpec.function.parameters.properties) {
    const specProp = toolSpec.function.parameters.properties[fieldId];
    const generatedProp = tool.function.parameters.properties[fieldId];
    
    assert.ok(generatedProp, `Missing property: ${fieldId}`);
    assert.deepEqual(generatedProp.type, specProp.type, `Type mismatch for ${fieldId}`);
    
    if (specProp.enum) {
      assert.deepEqual(generatedProp.enum?.sort(), specProp.enum?.sort(), `Enum mismatch for ${fieldId}`);
    }
  }
});

test("buildTool: enum fields have null as an option", () => {
  const tool = buildTool(rules);
  const enumProps = Object.entries(tool.function.parameters.properties)
    .filter(([, prop]) => Array.isArray(prop.enum));
  
  for (const [name, prop] of enumProps) {
    assert.ok(prop.enum.includes(null), `${name} enum should include null`);
  }
});

test("buildTool: number fields allow null", () => {
  const tool = buildTool(rules);
  const numProp = tool.function.parameters.properties.quantity;
  
  assert.deepEqual(numProp.type, ["number", "null"]);
});

test("buildTool: boolean fields allow null", () => {
  const tool = buildTool(rules);
  const boolProp = tool.function.parameters.properties.paint_included;
  
  assert.deepEqual(boolProp.type, ["boolean", "null"]);
});

test("buildTool: includes ask descriptions for fields", () => {
  const tool = buildTool(rules);
  const serviceIdProp = tool.function.parameters.properties.service_id;
  
  assert.ok(serviceIdProp.description);
  assert.ok(serviceIdProp.description.includes("What kind of damage"));
});
