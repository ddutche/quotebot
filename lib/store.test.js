import { test } from "node:test";
import assert from "node:assert/strict";
import * as store from "./store.js";

function withEnv(env, fn) {
  return async () => {
    const saved = {};
    for (const [key, value] of Object.entries(env)) {
      saved[key] = process.env[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    try {
      return await fn();
    } finally {
      for (const [key, value] of Object.entries(saved)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  };
}

test("isUuid: accepts valid UUID", () => {
  const validUuid = "550e8400-e29b-41d4-a716-446655440000";
  assert.equal(store.isUuid(validUuid), true);
});

test("isUuid: rejects 'abc'", () => {
  assert.equal(store.isUuid("abc"), false);
});

test("isUuid: rejects empty string", () => {
  assert.equal(store.isUuid(""), false);
});

test("isUuid: rejects null", () => {
  assert.equal(store.isUuid(null), false);
});

test("isUuid: rejects UUID with trailing space", () => {
  const uuidWithSpace = "550e8400-e29b-41d4-a716-446655440000 ";
  assert.equal(store.isUuid(uuidWithSpace), false);
});

test("isUuid: accepts uppercase UUID", () => {
  const upperUuid = "550E8400-E29B-41D4-A716-446655440000";
  assert.equal(store.isUuid(upperUuid), true);
});

test("visitorHash: returns null for null IP", () => {
  const hash = store.visitorHash(null);
  assert.equal(hash, null);
});

test("visitorHash: same IP and user agent produce same hash", withEnv({
  VISITOR_SALT: "test-salt-123",
}, () => {
  const ip = "192.168.1.1";
  const agent = "Mozilla/5.0";
  const hash1 = store.visitorHash(ip, agent);
  const hash2 = store.visitorHash(ip, agent);
  assert.equal(hash1, hash2);
}));

test("visitorHash: different IPs produce different hashes", withEnv({
  VISITOR_SALT: "test-salt-123",
}, () => {
  const agent = "Mozilla/5.0";
  const hash1 = store.visitorHash("192.168.1.1", agent);
  const hash2 = store.visitorHash("192.168.1.2", agent);
  assert.notEqual(hash1, hash2);
}));

test("visitorHash: hash does not contain raw IP", () => {
  const ip = "192.168.1.1";
  const agent = "Mozilla/5.0";
  const hash = store.visitorHash(ip, agent);
  assert.ok(!hash.includes("192.168.1.1"));
  assert.ok(!hash.includes("192"));
  assert.ok(!hash.includes("168"));
});

test("visitorHash: hash is 32 characters", () => {
  const hash = store.visitorHash("192.168.1.1", "Mozilla/5.0");
  assert.equal(hash.length, 32);
});

test("visitorHash: changing VISITOR_SALT changes the hash", withEnv({
  VISITOR_SALT: "salt-1",
}, async () => {
  const ip = "192.168.1.1";
  const agent = "Mozilla/5.0";
  const hash1 = store.visitorHash(ip, agent);

  process.env.VISITOR_SALT = "salt-2";
  const hash2 = store.visitorHash(ip, agent);
  process.env.VISITOR_SALT = "salt-1";

  assert.notEqual(hash1, hash2);
}));

test("recordChat: returns null when Supabase is not enabled", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: undefined,
  SUPABASE_SECRET_KEY: undefined,
}, async () => {
  let fetchCalled = false;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    fetchCalled = true;
    return { ok: true, status: 200, text: async () => "[]" };
  };

  try {
    const result = await store.recordChat({
      slug: "example-drywall",
      brand: { is_demo: true },
      userMessage: "hi",
      reply: "hello",
    });
    assert.equal(result, null);
    assert.equal(fetchCalled, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
}));

test("recordChat: returns null and doesn't throw when fetch rejects", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: "https://fake.test",
  SUPABASE_SECRET_KEY: "secret-key",
}, async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("Network error");
  };

  try {
    const result = await store.recordChat({
      slug: "example-drywall",
      brand: { is_demo: true },
      userMessage: "hi",
      reply: "hello",
    });
    assert.equal(result, null);
  } finally {
    globalThis.fetch = originalFetch;
  }
}));

test("rulesForClient: returns file rules when Supabase is disabled", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: undefined,
  SUPABASE_SECRET_KEY: undefined,
}, async () => {
  const fileRules = {
    fields: [
      { id: "service_id", type: "enum" },
      { id: "quantity", type: "number" },
    ],
  };
  const result = await store.rulesForClient("example-drywall", { is_demo: true }, fileRules);
  assert.equal(result.source, "file");
  assert.deepEqual(result.rules, fileRules);
  assert.equal(result.rulesVersionId, null);
}));

test("rulesForClient: returns database rules when available", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: "https://fake.test",
  SUPABASE_SECRET_KEY: "secret-key",
}, async () => {
  const fileRules = { fields: [{ id: "old_field" }] };
  const dbRules = { fields: [{ id: "new_field" }] };
  const dbRulesVersionId = "versions-uuid-123";

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, opts) => {
    // First call: upsert client
    if (opts.method === "POST" && url.includes("clients?")) {
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify([{ id: "client-uuid-456" }]),
      };
    }
    // Second call: get latest rules
    if (opts.method === "GET" && url.includes("rules_versions")) {
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify([{ id: dbRulesVersionId, rules: dbRules }]),
      };
    }
    return {
      ok: true,
      status: 200,
      text: async () => "[]",
    };
  };

  try {
    const result = await store.rulesForClient("example-drywall", { is_demo: true }, fileRules);
    assert.equal(result.source, "database");
    assert.deepEqual(result.rules, dbRules);
    assert.equal(result.rulesVersionId, dbRulesVersionId);
  } finally {
    globalThis.fetch = originalFetch;
  }
}));

test("rulesForClient: falls back to file when database rules have no fields", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: "https://fake.test",
  SUPABASE_SECRET_KEY: "secret-key",
}, async () => {
  const fileRules = { fields: [{ id: "service_id" }] };
  const dbRulesWithoutFields = { description: "no fields here" };

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, opts) => {
    if (opts.method === "POST" && url.includes("clients?")) {
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify([{ id: "client-uuid-456" }]),
      };
    }
    if (opts.method === "GET" && url.includes("rules_versions")) {
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify([{ id: "v-123", rules: dbRulesWithoutFields }]),
      };
    }
    return { ok: true, status: 200, text: async () => "[]" };
  };

  try {
    const result = await store.rulesForClient("example-drywall", { is_demo: true }, fileRules);
    assert.equal(result.source, "file");
    assert.deepEqual(result.rules, fileRules);
  } finally {
    globalThis.fetch = originalFetch;
  }
}));

test("rulesForClient: falls back to file when database returns empty fields", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: "https://fake.test",
  SUPABASE_SECRET_KEY: "secret-key",
}, async () => {
  const fileRules = { fields: [{ id: "service_id" }] };
  const dbRulesEmptyFields = { fields: [] };

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, opts) => {
    if (opts.method === "POST" && url.includes("clients?")) {
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify([{ id: "client-uuid-456" }]),
      };
    }
    if (opts.method === "GET" && url.includes("rules_versions")) {
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify([{ id: "v-123", rules: dbRulesEmptyFields }]),
      };
    }
    return { ok: true, status: 200, text: async () => "[]" };
  };

  try {
    const result = await store.rulesForClient("example-drywall", { is_demo: true }, fileRules);
    assert.equal(result.source, "file");
  } finally {
    globalThis.fetch = originalFetch;
  }
}));

test("openConversation: reuses conversation ID when it exists", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: "https://fake.test",
  SUPABASE_SECRET_KEY: "secret-key",
}, async () => {
  const existingId = "550e8400-e29b-41d4-a716-446655440000";

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, opts) => {
    // Select query should return the existing conversation
    if (opts.method === "GET" && url.includes("conversations?")) {
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify([{ id: existingId }]),
      };
    }
    return { ok: true, status: 200, text: async () => "[]" };
  };

  try {
    const result = await store.openConversation({
      clientRowId: "client-uuid-456",
      conversationId: existingId,
      sourceDomain: "example.com",
      visitor: "visitor-hash",
    });
    assert.equal(result, existingId);
  } finally {
    globalThis.fetch = originalFetch;
  }
}));

test("openConversation: creates new conversation when ID doesn't exist", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: "https://fake.test",
  SUPABASE_SECRET_KEY: "secret-key",
}, async () => {
  const newId = "new-conv-uuid-999";

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, opts) => {
    // Select query returns empty
    if (opts.method === "GET" && url.includes("conversations?")) {
      return {
        ok: true,
        status: 200,
        text: async () => "[]",
      };
    }
    // Insert returns new conversation
    if (opts.method === "POST" && url.includes("conversations")) {
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify([{ id: newId }]),
      };
    }
    return { ok: true, status: 200, text: async () => "[]" };
  };

  try {
    const result = await store.openConversation({
      clientRowId: "client-uuid-456",
      conversationId: "existing-uuid-wrong",
      sourceDomain: "example.com",
      visitor: "visitor-hash",
    });
    assert.equal(result, newId);
  } finally {
    globalThis.fetch = originalFetch;
  }
}));

test("openConversation: creates new conversation for invalid UUID without URL fetch", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: "https://fake.test",
  SUPABASE_SECRET_KEY: "secret-key",
}, async () => {
  const newId = "new-conv-uuid-999";

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, opts) => {
    // This should not be called for a select when conversationId is invalid
    if (opts.method === "GET") {
      assert.fail("Should not make GET request for invalid UUID");
    }
    if (opts.method === "POST" && url.includes("conversations")) {
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify([{ id: newId }]),
      };
    }
    return { ok: true, status: 200, text: async () => "[]" };
  };

  try {
    const result = await store.openConversation({
      clientRowId: "client-uuid-456",
      conversationId: "not-a-valid-uuid",
      sourceDomain: "example.com",
      visitor: "visitor-hash",
    });
    assert.equal(result, newId);
  } finally {
    globalThis.fetch = originalFetch;
  }
}));

test("saveTurn: posts two message rows with correct roles", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: "https://fake.test",
  SUPABASE_SECRET_KEY: "secret-key",
}, async () => {
  const requests = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, opts) => {
    if (opts.method === "POST" && url.includes("messages")) {
      requests.push({ url, body: JSON.parse(opts.body) });
      return {
        ok: true,
        status: 200,
        text: async () => "[]",
      };
    }
    if (opts.method === "PATCH") {
      return {
        ok: true,
        status: 200,
        text: async () => "[]",
      };
    }
    return { ok: true, status: 200, text: async () => "[]" };
  };

  try {
    await store.saveTurn({
      conversationId: "conv-123",
      userMessage: "help",
      photoCount: 0,
      reply: "sure",
      guard: { fell_back: false },
      result: null,
      rulesVersionId: null,
    });
    assert.equal(requests.length, 1);
    assert.ok(Array.isArray(requests[0].body));
    assert.equal(requests[0].body.length, 2);
    assert.equal(requests[0].body[0].role, "user");
    assert.equal(requests[0].body[0].content, "help");
    assert.equal(requests[0].body[1].role, "assistant");
    assert.equal(requests[0].body[1].content, "sure");
  } finally {
    globalThis.fetch = originalFetch;
  }
}));

test("saveTurn: sets blocked and block_reasons when guard fell back", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: "https://fake.test",
  SUPABASE_SECRET_KEY: "secret-key",
}, async () => {
  const requests = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, opts) => {
    if (opts.method === "POST" && url.includes("messages")) {
      requests.push({ url, body: JSON.parse(opts.body) });
      return {
        ok: true,
        status: 200,
        text: async () => "[]",
      };
    }
    if (opts.method === "PATCH") {
      return {
        ok: true,
        status: 200,
        text: async () => "[]",
      };
    }
    return { ok: true, status: 200, text: async () => "[]" };
  };

  try {
    await store.saveTurn({
      conversationId: "conv-123",
      userMessage: "help",
      photoCount: 0,
      reply: "sure",
      guard: { fell_back: true, problems: ["price mismatch"] },
      result: null,
      rulesVersionId: null,
    });
    const msgRow = requests[0].body.find((m) => m.role === "assistant");
    assert.equal(msgRow.blocked, true);
    assert.deepEqual(msgRow.block_reasons, ["price mismatch"]);
  } finally {
    globalThis.fetch = originalFetch;
  }
}));

test("saveTurn: inserts estimate row only when result is provided", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: "https://fake.test",
  SUPABASE_SECRET_KEY: "secret-key",
}, async () => {
  const requests = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, opts) => {
    if (opts.method === "POST") {
      requests.push({ url, body: opts.body ? JSON.parse(opts.body) : null });
      return {
        ok: true,
        status: 200,
        text: async () => "[]",
      };
    }
    if (opts.method === "PATCH") {
      return {
        ok: true,
        status: 200,
        text: async () => "[]",
      };
    }
    return { ok: true, status: 200, text: async () => "[]" };
  };

  try {
    await store.saveTurn({
      conversationId: "conv-123",
      userMessage: "help",
      photoCount: 0,
      reply: "sure",
      guard: { fell_back: false },
      result: null,
      rulesVersionId: null,
    });
    const estimateRequests = requests.filter((r) => r.url.includes("estimates"));
    assert.equal(estimateRequests.length, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
}));

test("saveTurn: inserts estimate row when result is provided", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: "https://fake.test",
  SUPABASE_SECRET_KEY: "secret-key",
}, async () => {
  const requests = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, opts) => {
    if (opts.method === "POST") {
      requests.push({ url, body: opts.body ? JSON.parse(opts.body) : null });
      return {
        ok: true,
        status: 200,
        text: async () => "[]",
      };
    }
    if (opts.method === "PATCH") {
      return {
        ok: true,
        status: 200,
        text: async () => "[]",
      };
    }
    return { ok: true, status: 200, text: async () => "[]" };
  };

  try {
    const result = {
      status: "ok",
      low: 100,
      high: 200,
      engine_input: { service_id: "repair" },
    };
    await store.saveTurn({
      conversationId: "conv-123",
      userMessage: "help",
      photoCount: 0,
      reply: "sure",
      guard: { fell_back: false },
      result,
      rulesVersionId: "rules-v1",
    });
    const estimateRequests = requests.filter((r) => r.url.includes("estimates"));
    assert.equal(estimateRequests.length, 1);
    const estimate = estimateRequests[0].body;
    assert.equal(estimate.low, 100);
    assert.equal(estimate.high, 200);
    assert.equal(estimate.status, "ok");
  } finally {
    globalThis.fetch = originalFetch;
  }
}));

test("saveTurn: sets low/high to null when status is not 'ok'", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: "https://fake.test",
  SUPABASE_SECRET_KEY: "secret-key",
}, async () => {
  const requests = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, opts) => {
    if (opts.method === "POST") {
      requests.push({ url, body: opts.body ? JSON.parse(opts.body) : null });
      return {
        ok: true,
        status: 200,
        text: async () => "[]",
      };
    }
    if (opts.method === "PATCH") {
      return {
        ok: true,
        status: 200,
        text: async () => "[]",
      };
    }
    return { ok: true, status: 200, text: async () => "[]" };
  };

  try {
    const result = {
      status: "out_of_area",
      engine_input: { zip: "99999" },
    };
    await store.saveTurn({
      conversationId: "conv-123",
      userMessage: "help",
      photoCount: 0,
      reply: "sorry out of area",
      guard: { fell_back: false },
      result,
      rulesVersionId: "rules-v1",
    });
    const estimateRequests = requests.filter((r) => r.url.includes("estimates"));
    const estimate = estimateRequests[0].body;
    assert.equal(estimate.status, "out_of_area");
    assert.equal(estimate.low, null);
    assert.equal(estimate.high, null);
  } finally {
    globalThis.fetch = originalFetch;
  }
}));

test("saveTurn: updates conversation with outcome", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: "https://fake.test",
  SUPABASE_SECRET_KEY: "secret-key",
}, async () => {
  const requests = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, opts) => {
    if (opts.method === "POST") {
      requests.push({ url, body: opts.body ? JSON.parse(opts.body) : null });
      return {
        ok: true,
        status: 200,
        text: async () => "[]",
      };
    }
    if (opts.method === "PATCH") {
      requests.push({ url, body: JSON.parse(opts.body) });
      return {
        ok: true,
        status: 200,
        text: async () => "[]",
      };
    }
    return { ok: true, status: 200, text: async () => "[]" };
  };

  try {
    const result = { status: "ok", low: 100, high: 200, engine_input: {} };
    await store.saveTurn({
      conversationId: "conv-123",
      userMessage: "help",
      photoCount: 0,
      reply: "sure",
      guard: { fell_back: false },
      result,
      rulesVersionId: "rules-v1",
    });
    const patchRequests = requests.filter((r) => r.url && r.url.includes("conversations"));
    assert.ok(patchRequests.length > 0);
    assert.equal(patchRequests[0].body.outcome, "ok");
  } finally {
    globalThis.fetch = originalFetch;
  }
}));

test("saveTurn: includes photo_count in user message", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: "https://fake.test",
  SUPABASE_SECRET_KEY: "secret-key",
}, async () => {
  const requests = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, opts) => {
    if (opts.method === "POST" && url.includes("messages")) {
      requests.push({ url, body: JSON.parse(opts.body) });
      return {
        ok: true,
        status: 200,
        text: async () => "[]",
      };
    }
    if (opts.method === "PATCH") {
      return {
        ok: true,
        status: 200,
        text: async () => "[]",
      };
    }
    return { ok: true, status: 200, text: async () => "[]" };
  };

  try {
    await store.saveTurn({
      conversationId: "conv-123",
      userMessage: "help",
      photoCount: 2,
      reply: "sure",
      guard: { fell_back: false },
      result: null,
      rulesVersionId: null,
    });
    const msgRow = requests[0].body.find((m) => m.role === "user");
    assert.equal(msgRow.photo_count, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
}));
