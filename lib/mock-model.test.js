import { test } from "node:test";
import assert from "node:assert/strict";
import { runChat } from "./chat.js";
import { loadTemplate } from "./prompt.js";
import { createMockModel } from "./mock-model.js";
import { readFileSync } from "node:fs";

const rules = JSON.parse(readFileSync(new URL("../clients/example-drywall/pricing-rules.json", import.meta.url)));
const brand = JSON.parse(readFileSync(new URL("../clients/example-drywall/brand.json", import.meta.url)));

async function runConversation(answers) {
  const template = await loadTemplate();
  const model = createMockModel();
  
  let messages = [{ role: "user", content: "hi" }];
  let job = null;
  
  for (const answer of answers) {
    const result = await runChat({
      rules,
      brand,
      template,
      model,
      messages,
      job,
    });
    
    // Add the bot's reply
    messages.push({ role: "assistant", content: result.reply });
    job = result.job;
    
    // Add the customer's next answer
    if (answer !== undefined) {
      messages.push({ role: "user", content: answer });
    }
  }
  
  // Final turn with the last answer (if there is one)
  const finalResult = await runChat({
    rules,
    brand,
    template,
    model,
    messages,
    job,
  });
  
  return finalResult;
}

test("mock model: medium patch conversation yields ok estimate", async () => {
  const result = await runConversation([
    "Medium patch (6 to 24 in)",
    "2",
    "Wall",
    "Smooth",
    "Yes",
    "14226",
    "No",
  ]);

  assert.equal(result.outcome.status, "ok");
  assert.equal(result.outcome.low, 425);
  assert.equal(result.outcome.high, 600);
  assert.ok(result.reply.includes("$425"));
  assert.ok(result.reply.includes("$600"));
  assert.ok(result.reply.includes("estimate"));
  assert.equal(result.guard.retried, false);
  assert.equal(result.mode, "test");
});

test("mock model: popcorn texture escalates to needs_review", async () => {
  const result = await runConversation([
    "Small hole patch (under 6 in)",
    "1",
    "Wall",
    "Popcorn",
    "No",
    "14068",
    "No",
  ]);

  assert.equal(result.outcome.status, "needs_review");
  assert.ok(!result.reply.includes("$"));
});

test("mock model: out-of-area zip", async () => {
  const result = await runConversation([
    "Small hole patch (under 6 in)",
    "1",
    "Wall",
    "Smooth",
    "No",
    "10001",
    "No",
  ]);

  assert.equal(result.outcome.status, "out_of_area");
  assert.ok(!result.reply.includes("$"));
});

test("mock model: 'no idea' to texture shows options", async () => {
  const result = await runConversation([
    "Medium patch (6 to 24 in)",
    "1",
    "Wall",
    "no idea",  // unclear answer to texture, before it's been answered
  ]);

  assert.ok(result.reply.includes("The options are"));
  assert.ok(!result.reply.includes("$"));
});

test("mock model: name and phone after estimate", async () => {
  const result = await runConversation([
    "Medium patch (6 to 24 in)",
    "1",
    "Wall",
    "Smooth",
    "No",
    "14226",
    "No",
    "Jane, 555-1234",
  ]);

  assert.ok(result.reply.includes("Thanks"));
  assert.ok(!result.reply.includes("$"));
});

test("mock model: first response has quick_replies with service options", async () => {
  const template = await loadTemplate();
  const model = createMockModel();

  const result = await runChat({
    rules,
    brand,
    template,
    model,
    messages: [{ role: "user", content: "hi" }],
  });

  assert.ok(result.quick_replies);
  assert.ok(Array.isArray(result.quick_replies.options));
  assert.equal(result.quick_replies.field, "service_id");
  
  const labels = result.quick_replies.options.map(o => o.label);
  assert.ok(labels.includes("Small hole patch (under 6 in)"));
  assert.ok(labels.includes("Medium patch (6 to 24 in)"));
  assert.ok(labels.includes("Drywall replacement"));
});

test("mock model: water damage escalates", async () => {
  const result = await runConversation([
    "Medium patch (6 to 24 in)",
    "1",
    "Wall",
    "Smooth",
    "No",
    "14226",
    "Yes",
  ]);

  assert.equal(result.outcome.status, "needs_review");
  assert.ok(!result.reply.includes("$"));
});

test("mock model: ceiling multiplier affects price", async () => {
  const result = await runConversation([
    "Small hole patch (under 6 in)",
    "1",
    "Ceiling",
    "Smooth",
    "No",
    "14226",
    "No",
  ]);

  assert.equal(result.outcome.status, "ok");
  // 1 x 95 x 1.25 (ceiling) + 50 (trip) = 168.75, min 250
  assert.equal(result.outcome.low, 250);
  assert.equal(result.outcome.high, 300);
});

// built_before_1980 is optional, so the engine never asks for it and test mode never collects it.
// A real model can still pass it; this checks that path escalates with no price.
test("optional built_before_1980 = yes from the model escalates with no price", async () => {
  const template = await loadTemplate();
  const job = {
    service_id: "patch_small", quantity: 1, location: "wall", texture: "smooth",
    paint_included: false, zip: "14221", water_damage: false, built_before_1980: "yes",
    photo_matches_description: null,
  };
  const model = {
    mode: "test",
    async complete({ messages }) {
      if (messages[messages.length - 1].role !== "tool") {
        return { role: "assistant", content: null, tool_calls: [{ id: "c1", type: "function", function: { name: "get_estimate", arguments: JSON.stringify(job) } }] };
      }
      return { role: "assistant", content: "A team member will look at this and call you." };
    },
  };
  const result = await runChat({ rules, brand, template, model, messages: [{ role: "user", content: "old house, small hole" }] });
  assert.equal(result.outcome.status, "needs_review");
  assert.ok(!result.reply.includes("$"));
});
