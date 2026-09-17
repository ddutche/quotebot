// Builds the chatbot's system prompt and get_estimate tool from a client's files.
// Same code path for every client: nothing here knows about drywall.

import { readFile } from "node:fs/promises";
import { join } from "node:path";

const TYPE_MAP = { enum: "string", number: "number", boolean: "boolean", string: "string" };

/** Only the part of bot/system-prompt.md after the first "---" is the prompt itself. */
export function extractTemplate(markdown) {
  const parts = markdown.split(/^---\s*$/m);
  return (parts.length > 1 ? parts.slice(1).join("---") : markdown).trim();
}

function describeField(field) {
  let line = `- \`${field.id}\` (${field.required ? "required" : "optional"}`;
  if (field.type === "enum") line += `; one of: ${field.options.join(", ")}`;
  else line += `; ${field.type}`;
  line += ")";
  if (field.ask) line += `. Ask: "${field.ask}"`;
  return line;
}

export function buildPrompt(template, rules, brand) {
  // {{low}} and {{high}} stay as written: the model fills them from the tool result, not from us.
  const values = {
    business_name: brand.business_name ?? rules.business.name,
    trade: brand.trade ?? "home service",
    fields_as_bullets: rules.fields.map(describeField).join("\n"),
    disclaimer: rules.estimate_policy.disclaimer,
    voice_notes: brand.voice_notes ?? "friendly and direct",
    hours: rules.business.hours,
    phone: rules.business.phone,
  };
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => (key in values ? values[key] : match));
}

export function buildTool(rules) {
  const properties = {};
  for (const field of rules.fields) {
    const prop = { type: [TYPE_MAP[field.type] ?? "string", "null"] };
    if (field.type === "enum") prop.enum = [...field.options, null];
    if (field.ask) prop.description = field.ask;
    properties[field.id] = prop;
  }
  return {
    type: "function",
    function: {
      name: "get_estimate",
      description:
        "Calculates the price estimate using the business's pricing rules. Call only when you have the details. Use null for anything the customer has not told you.",
      parameters: {
        type: "object",
        additionalProperties: false,
        required: rules.fields.map((f) => f.id),
        properties,
      },
    },
  };
}

let cachedTemplate;
export async function loadTemplate(root = process.cwd()) {
  cachedTemplate ??= extractTemplate(await readFile(join(root, "bot", "system-prompt.md"), "utf8"));
  return cachedTemplate;
}
