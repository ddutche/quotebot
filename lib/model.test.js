import { test } from "node:test";
import assert from "node:assert/strict";
import { getModel, createOpenAICompatibleModel } from "./model.js";

test("getModel: returns test mode when CHAT_MODEL=mock", () => {
  const model = getModel({ CHAT_MODEL: "mock" });
  assert.equal(model.mode, "test");
});

test("getModel: returns test mode in development without a key", () => {
  const model = getModel({ NODE_ENV: "development" });
  assert.equal(model.mode, "test");
});

test("getModel: returns null in production without a key", () => {
  const model = getModel({ NODE_ENV: "production" });
  assert.equal(model, null);
});

test("getModel: returns test mode in production with QUOTEBOT_ALLOW_TEST_MODE=1", () => {
  const model = getModel({ NODE_ENV: "production", QUOTEBOT_ALLOW_TEST_MODE: "1" });
  assert.equal(model.mode, "test");
});

test("getModel: returns live mode with OPENROUTER_API_KEY", () => {
  const model = getModel({
    NODE_ENV: "production",
    OPENROUTER_API_KEY: "test-key",
    CHAT_MODEL: "some/model",
  });
  assert.equal(model.mode, "live");
  assert.equal(model.name, "some/model");
});

test("createOpenAICompatibleModel: sends correct POST request", async () => {
  const fetchCalls = [];
  const fakeFetch = async (url, opts) => {
    fetchCalls.push({ url, opts });
    return {
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "test reply", role: "assistant" } }],
      }),
    };
  };

  const model = createOpenAICompatibleModel({
    apiKey: "test-key-123",
    model: "kimi/kimi-model",
    baseUrl: "https://example.com/api/v1",
    fetchImpl: fakeFetch,
  });

  const result = await model.complete({
    messages: [{ role: "user", content: "hi" }],
    tools: [],
  });

  assert.equal(result.content, "test reply");
  assert.equal(fetchCalls.length, 1);

  const call = fetchCalls[0];
  assert.ok(call.url.includes("https://example.com/api/v1/chat/completions"));
  assert.equal(call.opts.method, "POST");
  assert.equal(call.opts.headers["Authorization"], "Bearer test-key-123");

  const body = JSON.parse(call.opts.body);
  assert.equal(body.model, "kimi/kimi-model");
  assert.ok(Array.isArray(body.messages));
  assert.ok(Array.isArray(body.tools));
});

test("createOpenAICompatibleModel: handles trailing slash in baseUrl", async () => {
  const fetchCalls = [];
  const fakeFetch = async (url) => {
    fetchCalls.push(url);
    return { ok: true, json: async () => ({ choices: [{ message: { content: "x", role: "assistant" } }] }) };
  };

  const model = createOpenAICompatibleModel({
    apiKey: "key",
    model: "test",
    baseUrl: "https://example.com/api/v1/",
    fetchImpl: fakeFetch,
  });

  await model.complete({ messages: [], tools: [] });
  assert.ok(fetchCalls[0].includes("https://example.com/api/v1/chat/completions"));
});

test("createOpenAICompatibleModel: throws on HTTP error without exposing key", async () => {
  const fakeFetch = async () => {
    return {
      ok: false,
      status: 401,
    };
  };

  const model = createOpenAICompatibleModel({
    apiKey: "super-secret-key",
    model: "test",
    fetchImpl: fakeFetch,
  });

  try {
    await model.complete({ messages: [], tools: [] });
    assert.fail("should throw");
  } catch (e) {
    assert.ok(e.message.includes("401"));
    assert.ok(!e.message.includes("super-secret-key"));
  }
});

test("createOpenAICompatibleModel: throws on missing message in response", async () => {
  const fakeFetch = async () => {
    return {
      ok: true,
      json: async () => ({ choices: [] }),
    };
  };

  const model = createOpenAICompatibleModel({
    apiKey: "key",
    model: "test",
    fetchImpl: fakeFetch,
  });

  try {
    await model.complete({ messages: [], tools: [] });
    assert.fail("should throw");
  } catch (e) {
    assert.ok(e.message.includes("returned no message"));
  }
});
