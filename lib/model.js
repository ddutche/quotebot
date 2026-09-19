// Talks to the chatbot model through any OpenAI-compatible API (golden rule 6).
// Server only. The key is read from the environment and never leaves this file.

import { createMockModel } from "./mock-model.js";

const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";
const TIMEOUT_MS = 45_000;

export function createOpenAICompatibleModel({ apiKey, model, baseUrl = DEFAULT_BASE_URL, fetchImpl = fetch }) {
  return {
    mode: "live",
    name: model,
    async complete({ messages, tools }) {
      const res = await fetchImpl(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, messages, tools, tool_choice: "auto", temperature: 0.2 }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) {
        // Don't echo the provider's body: it can include request details.
        throw new Error(`Chat model request failed with HTTP ${res.status}`);
      }
      const data = await res.json();
      const message = data?.choices?.[0]?.message;
      if (!message) throw new Error("Chat model returned no message");
      return message;
    },
  };
}

/**
 * Picks live or test mode.
 * - CHAT_MODEL=mock: test mode, always.
 * - No OPENROUTER_API_KEY outside production: test mode, so the app runs before keys exist.
 * - No key in production: null (the route answers with the error state, never a fake bot).
 */
export function getModel(env = process.env) {
  if (env.CHAT_MODEL === "mock") return createMockModel();
  if (!env.OPENROUTER_API_KEY) {
    return env.NODE_ENV === "production" && env.QUOTEBOT_ALLOW_TEST_MODE !== "1" ? null : createMockModel();
  }
  return createOpenAICompatibleModel({
    apiKey: env.OPENROUTER_API_KEY,
    model: env.CHAT_MODEL,
    baseUrl: env.CHAT_BASE_URL || DEFAULT_BASE_URL,
  });
}
