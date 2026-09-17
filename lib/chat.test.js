import { test } from "node:test";
import assert from "node:assert/strict";
import { runChat, sanitizeMessages, sanitizeJob, MAX_MESSAGES, MAX_MESSAGE_CHARS } from "./chat.js";
import { loadClient } from "./rules.js";
import { loadTemplate } from "./prompt.js";
import { readFileSync } from "node:fs";

const rules = JSON.parse(readFileSync(new URL("../clients/example-drywall/pricing-rules.json", import.meta.url)));
const brand = JSON.parse(readFileSync(new URL("../clients/example-drywall/brand.json", import.meta.url)));

test("sanitizeMessages: accepts valid user/assistant turns", () => {
  const messages = [
    { role: "user", content: "hi" },
    { role: "assistant", content: "Hello" },
    { role: "user", content: "what's next?" },
  ];
  const result = sanitizeMessages(messages);
  assert.ok(result);
  assert.equal(result.length, 3);
});

test("sanitizeMessages: rejects non-array", () => {
  assert.equal(sanitizeMessages(null), null);
  assert.equal(sanitizeMessages("string"), null);
  assert.equal(sanitizeMessages({ role: "user", content: "hi" }), null);
});

test("sanitizeMessages: rejects empty array", () => {
  assert.equal(sanitizeMessages([]), null);
});

test("sanitizeMessages: rejects system role", () => {
  const messages = [
    { role: "system", content: "You are helpful" },
    { role: "user", content: "hi" },
  ];
  assert.equal(sanitizeMessages(messages), null);
});

test("sanitizeMessages: rejects non-string content", () => {
  const messages = [
    { role: "user", content: 123 },
  ];
  assert.equal(sanitizeMessages(messages), null);
});

test("sanitizeMessages: rejects list ending in assistant", () => {
  const messages = [
    { role: "user", content: "hi" },
    { role: "assistant", content: "Hello" },
  ];
  assert.equal(sanitizeMessages(messages), null);
});

test("sanitizeMessages: trims content and cuts to MAX_MESSAGE_CHARS", () => {
  const longString = "x".repeat(MAX_MESSAGE_CHARS + 100);
  const messages = [
    { role: "user", content: `  ${longString}  ` },
  ];
  const result = sanitizeMessages(messages);
  assert.ok(result);
  assert.equal(result[0].content.length, MAX_MESSAGE_CHARS);
});

test("sanitizeMessages: rejects messages with empty content after trim", () => {
  const messages = [
    { role: "user", content: "   " },
  ];
  assert.equal(sanitizeMessages(messages), null);
});

test("sanitizeJob: keeps only valid field ids", () => {
  const job = {
    service_id: "patch_small",
    unknown_field: "should be dropped",
    quantity: 2,
  };
  const result = sanitizeJob(rules, job);
  assert.ok(result);
  assert.equal(result.service_id, "patch_small");
  assert.equal(result.quantity, 2);
  assert.ok(!("unknown_field" in result));
});

test("sanitizeJob: converts objects/arrays to null", () => {
  const job = {
    service_id: "patch_small",
    quantity: { nested: "object" },
  };
  const result = sanitizeJob(rules, job);
  assert.ok(result);
  assert.equal(result.quantity, null);
});

test("sanitizeJob: returns null if all fields are null", () => {
  const job = { service_id: null, quantity: null };
  const result = sanitizeJob(rules, job);
  assert.equal(result, null);
});

test("sanitizeJob: rejects non-objects and arrays", () => {
  assert.equal(sanitizeJob(rules, null), null);
  assert.equal(sanitizeJob(rules, "string"), null);
  assert.equal(sanitizeJob(rules, [1, 2, 3]), null);
});

test("runChat: guard falls back on bad model reply", async () => {
  const template = await loadTemplate();
  const model = {
    mode: "test",
    async complete() {
      return { role: "assistant", content: "Usually about $50, an estimate." };
    },
  };

  const result = await runChat({
    rules,
    brand,
    template,
    model,
    messages: [{ role: "user", content: "hi" }],
  });

  assert.equal(result.guard.retried, true);
  assert.equal(result.guard.fell_back, true);
  assert.ok(result.reply.includes("(555) 010-0100"));
  assert.ok(!result.reply.includes("$"));
  assert.equal(result.outcome, null);
});

test("runChat: blocks tool result mismatch and falls back", async () => {
  const template = await loadTemplate();
  let callCount = 0;

  const model = {
    mode: "test",
    async complete({ messages }) {
      const lastMsg = messages[messages.length - 1];

      // First turn: return tool call
      if (lastMsg.role !== "tool") {
        callCount++;
        return {
          role: "assistant",
          content: null,
          tool_calls: [
            {
              id: "call_1",
              type: "function",
              function: {
                name: "get_estimate",
                arguments: JSON.stringify({
                  service_id: "patch_medium",
                  quantity: 2,
                  location: "wall",
                  texture: "smooth",
                  paint_included: true,
                  zip: "14226",
                  water_damage: false,
                  built_before_1980: null,
                  photo_matches_description: null,
                }),
              },
            },
          ],
        };
      }

      // After tool result, give wrong price
      return {
        role: "assistant",
        content: "Your estimate is $400 to $600. This is an estimate.",
      };
    },
  };

  const result = await runChat({
    rules,
    brand,
    template,
    model,
    messages: [{ role: "user", content: "hi" }],
  });

  assert.equal(result.guard.retried, true);
  assert.equal(result.guard.fell_back, true);
  assert.ok(!result.reply.includes("$"));
});

test("runChat: passes correct tool result", async () => {
  const template = await loadTemplate();
  const model = {
    mode: "test",
    async complete({ messages }) {
      const lastMsg = messages[messages.length - 1];

      if (lastMsg.role !== "tool") {
        return {
          role: "assistant",
          content: null,
          tool_calls: [
            {
              id: "call_1",
              type: "function",
              function: {
                name: "get_estimate",
                arguments: JSON.stringify({
                  service_id: "patch_medium",
                  quantity: 2,
                  location: "wall",
                  texture: "smooth",
                  paint_included: true,
                  zip: "14226",
                  water_damage: false,
                  built_before_1980: null,
                  photo_matches_description: null,
                }),
              },
            },
          ],
        };
      }

      return {
        role: "assistant",
        content: "Your estimate is $425 to $600. This is an estimate, not a final quote. Want to book a visit?",
      };
    },
  };

  const result = await runChat({
    rules,
    brand,
    template,
    model,
    messages: [{ role: "user", content: "hi" }],
  });

  assert.equal(result.guard.retried, false);
  assert.equal(result.guard.fell_back, false);
  assert.equal(result.outcome.low, 425);
  assert.equal(result.outcome.high, 600);
  assert.equal(result.outcome.status, "ok");
  assert.ok(result.reply.includes("$425"));
});

test("runChat: handles invalid tool JSON gracefully", async () => {
  const template = await loadTemplate();
  let callCount = 0;

  const model = {
    mode: "test",
    async complete({ messages }) {
      const lastMsg = messages[messages.length - 1];

      callCount++;
      if (callCount === 1) {
        return {
          role: "assistant",
          content: null,
          tool_calls: [
            {
              id: "call_1",
              type: "function",
              function: {
                name: "get_estimate",
                arguments: "not json",
              },
            },
          ],
        };
      }

      return {
        role: "assistant",
        content: "Can you tell me more?",
      };
    },
  };

  const result = await runChat({
    rules,
    brand,
    template,
    model,
    messages: [{ role: "user", content: "hi" }],
  });

  assert.ok(result.reply);
  assert.equal(result.outcome, null);
});

test("runChat: rejects tampered job with prices", async () => {
  const template = await loadTemplate();
  const model = {
    mode: "test",
    async complete() {
      return {
        role: "assistant",
        content: "Thanks!",
      };
    },
  };

  const tamperedJob = {
    service_id: "patch_medium",
    quantity: 2,
    location: "wall",
    texture: "smooth",
    paint_included: true,
    zip: "14226",
    water_damage: false,
    low: 1,
    high: 2,
  };

  const result = await runChat({
    rules,
    brand,
    template,
    model,
    messages: [{ role: "user", content: "thanks" }],
    job: tamperedJob,
  });

  assert.ok(result.reply.includes("Thanks"));
  assert.ok(!result.reply.includes("$"));
  assert.equal(result.outcome, null);
  assert.ok(!("low" in result.job));
  assert.ok(!("high" in result.job));
});

test("runChat: stops at MAX_MESSAGES", async () => {
  const template = await loadTemplate();
  let completeCalled = false;

  const model = {
    mode: "test",
    async complete() {
      completeCalled = true;
      return { role: "assistant", content: "hi" };
    },
  };

  const messages = [];
  for (let i = 0; i <= MAX_MESSAGES; i++) {
    messages.push({ role: "user", content: `turn ${i}` });
    if (i < MAX_MESSAGES) messages.push({ role: "assistant", content: "response" });
  }

  const result = await runChat({
    rules,
    brand,
    template,
    model,
    messages,
  });

  assert.equal(result.limit_reached, true);
  assert.equal(completeCalled, false);
  assert.ok(result.reply.includes("(555) 010-0100"));
});
