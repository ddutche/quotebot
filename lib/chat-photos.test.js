import { test } from "node:test";
import assert from "node:assert/strict";
import { sanitizePhotos, sanitizeMessages, runChat, MAX_PHOTO_CHARS, MAX_PHOTOS } from "./chat.js";
import { loadTemplate } from "./prompt.js";
import { readFileSync } from "node:fs";

const rules = JSON.parse(readFileSync(new URL("../clients/example-drywall/pricing-rules.json", import.meta.url)));
const brand = JSON.parse(readFileSync(new URL("../clients/example-drywall/brand.json", import.meta.url)));

// A valid small JPEG data URL for testing
const validSmallJpeg = "data:image/jpeg;base64," + "A".repeat(100);

test("sanitizePhotos: returns empty array for undefined", () => {
  assert.deepEqual(sanitizePhotos(undefined), []);
});

test("sanitizePhotos: returns empty array for null", () => {
  assert.deepEqual(sanitizePhotos(null), []);
});

test("sanitizePhotos: accepts valid small JPEG data URL", () => {
  const result = sanitizePhotos([validSmallJpeg]);
  assert.ok(result);
  assert.equal(result.length, 1);
  assert.equal(result[0], validSmallJpeg);
});

test("sanitizePhotos: returns null for 4 photos (exceeds MAX_PHOTOS)", () => {
  const photos = Array(4).fill(validSmallJpeg);
  assert.equal(sanitizePhotos(photos), null);
});

test("sanitizePhotos: returns null for PNG data URL", () => {
  const pngUrl = "data:image/png;base64,AAA";
  assert.equal(sanitizePhotos([pngUrl]), null);
});

test("sanitizePhotos: returns null for https:// URL", () => {
  const httpsUrl = "https://example.com/photo.jpg";
  assert.equal(sanitizePhotos([httpsUrl]), null);
});

test("sanitizePhotos: returns null for non-string", () => {
  assert.equal(sanitizePhotos([123]), null);
  assert.equal(sanitizePhotos([null]), null);
  assert.equal(sanitizePhotos([{ url: "data:image/jpeg;base64,AAA" }]), null);
});

test("sanitizePhotos: returns null for data URL longer than MAX_PHOTO_CHARS", () => {
  const tooLongUrl = "data:image/jpeg;base64," + "A".repeat(MAX_PHOTO_CHARS);
  assert.equal(sanitizePhotos([tooLongUrl]), null);
});

test("sanitizePhotos: returns null for script injection in data URL", () => {
  const maliciousUrl = "data:image/jpeg;base64,AAA<script>";
  assert.equal(sanitizePhotos([maliciousUrl]), null);
});

test("sanitizeMessages: appends photo note to user message with photo_count", () => {
  const messages = [
    { role: "user", content: "hole", photo_count: 2 },
  ];
  const result = sanitizeMessages(messages);
  assert.ok(result);
  assert.equal(result.length, 1);
  assert.ok(result[0].content.includes("[Customer sent 2 photos with this message.]"));
});

test("sanitizeMessages: uses singular 'photo' when photo_count is 1", () => {
  const messages = [
    { role: "user", content: "damage", photo_count: 1 },
  ];
  const result = sanitizeMessages(messages);
  assert.ok(result);
  assert.ok(result[0].content.includes("[Customer sent 1 photo with this message.]"));
});

test("sanitizeMessages: caps photo_count to MAX_PHOTOS", () => {
  const messages = [
    { role: "user", content: "big damage", photo_count: 9 },
  ];
  const result = sanitizeMessages(messages);
  assert.ok(result);
  assert.ok(result[0].content.includes(`[Customer sent ${MAX_PHOTOS} photos with this message.]`));
});

test("sanitizeMessages: ignores photo_count on assistant turn", () => {
  const messages = [
    { role: "user", content: "hi" },
    { role: "assistant", content: "Hello", photo_count: 5 },
    { role: "user", content: "next" },
  ];
  const result = sanitizeMessages(messages);
  assert.ok(result);
  assert.equal(result[1].content, "Hello"); // No photo note added
});

test("runChat: passes photos to model as multi-part content for last user message", async () => {
  const template = await loadTemplate();
  let capturedMessages = null;

  const model = {
    mode: "test",
    async complete({ messages }) {
      capturedMessages = messages;
      return { role: "assistant", content: "Thanks, got it." };
    },
  };

  await runChat({
    rules,
    brand,
    template,
    model,
    messages: [{ role: "user", content: "hole in wall" }],
    photos: [validSmallJpeg],
  });

  assert.ok(capturedMessages);
  const lastMsg = capturedMessages[capturedMessages.length - 1];
  assert.ok(Array.isArray(lastMsg.content), "Last user message content should be an array");
  assert.equal(lastMsg.content[0].type, "text");
  assert.equal(lastMsg.content[0].text, "hole in wall");
  assert.equal(lastMsg.content[1].type, "image_url");
  assert.equal(lastMsg.content[1].image_url.url, validSmallJpeg);
});

test("runChat: earlier messages remain plain strings when photos present", async () => {
  const template = await loadTemplate();
  let capturedMessages = null;

  const model = {
    mode: "test",
    async complete({ messages }) {
      capturedMessages = messages;
      return { role: "assistant", content: "Thanks, got it." };
    },
  };

  await runChat({
    rules,
    brand,
    template,
    model,
    messages: [
      { role: "user", content: "first message" },
      { role: "assistant", content: "response" },
      { role: "user", content: "second message with photo" },
    ],
    photos: [validSmallJpeg],
  });

  // Find the first user message (skip system message at position 0)
  const firstUserMsg = capturedMessages.find((m) => m.role === "user" && m.content === "first message");
  assert.ok(firstUserMsg);
  assert.equal(typeof firstUserMsg.content, "string", "Earlier user message should be a string");
});

test("runChat: message content is plain string when no photos", async () => {
  const template = await loadTemplate();
  let capturedMessages = null;

  const model = {
    mode: "test",
    async complete({ messages }) {
      capturedMessages = messages;
      return { role: "assistant", content: "Thanks, got it." };
    },
  };

  await runChat({
    rules,
    brand,
    template,
    model,
    messages: [{ role: "user", content: "hole in wall" }],
    photos: [],
  });

  assert.ok(capturedMessages);
  const lastMsg = capturedMessages[capturedMessages.length - 1];
  assert.equal(typeof lastMsg.content, "string", "Last user message should be plain string when no photos");
  assert.equal(lastMsg.content, "hole in wall");
});

test("runChat: reply 'Thanks, got it.' passes the guard", async () => {
  const template = await loadTemplate();

  const model = {
    mode: "test",
    async complete() {
      return { role: "assistant", content: "Thanks, got it." };
    },
  };

  const result = await runChat({
    rules,
    brand,
    template,
    model,
    messages: [{ role: "user", content: "hi" }],
    photos: [validSmallJpeg],
  });

  assert.equal(result.guard.retried, false);
  assert.equal(result.guard.fell_back, false);
});
