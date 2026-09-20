import { test } from "node:test";
import assert from "node:assert/strict";
import * as db from "./db.js";

// Save and restore process.env between tests to prevent leakage
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

test("dbEnabled: returns false when both vars missing", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: undefined,
  SUPABASE_SECRET_KEY: undefined,
}, () => {
  assert.equal(db.dbEnabled(), false);
}));

test("dbEnabled: returns false when URL missing", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: undefined,
  SUPABASE_SECRET_KEY: "secret-key",
}, () => {
  assert.equal(db.dbEnabled(), false);
}));

test("dbEnabled: returns false when key missing", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SECRET_KEY: undefined,
}, () => {
  assert.equal(db.dbEnabled(), false);
}));

test("dbEnabled: returns true when both vars set", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SECRET_KEY: "secret-key",
}, () => {
  assert.equal(db.dbEnabled(), true);
}));

test("dbMisconfigured: returns false when both set", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SECRET_KEY: "secret-key",
}, () => {
  assert.equal(db.dbMisconfigured(), false);
}));

test("dbMisconfigured: returns false when both missing", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: undefined,
  SUPABASE_SECRET_KEY: undefined,
}, () => {
  assert.equal(db.dbMisconfigured(), false);
}));

test("dbMisconfigured: returns true when only URL set", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SECRET_KEY: undefined,
}, () => {
  assert.equal(db.dbMisconfigured(), true);
}));

test("dbMisconfigured: returns true when only key set", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: undefined,
  SUPABASE_SECRET_KEY: "secret-key",
}, () => {
  assert.equal(db.dbMisconfigured(), true);
}));

test("insertRow: sends POST with correct headers and URL", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: "https://fake.test",
  SUPABASE_SECRET_KEY: "secret-key-value",
}, async () => {
  const requests = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, opts) => {
    requests.push({ url, ...opts });
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify([{ id: "123", name: "John" }]),
    };
  };

  try {
    const result = await db.insertRow("leads", { name: "John", phone: "555-1234" });
    assert.equal(requests.length, 1);
    assert.equal(requests[0].url, "https://fake.test/rest/v1/leads");
    assert.equal(requests[0].method, "POST");
    assert.equal(requests[0].headers.apikey, "secret-key-value");
    assert.equal(requests[0].headers["Authorization"], "Bearer secret-key-value");
    assert.equal(requests[0].headers["Prefer"], "return=representation");
    assert.equal(result.id, "123");
    assert.equal(result.name, "John");
  } finally {
    globalThis.fetch = originalFetch;
  }
}));

test("upsertRow: includes on_conflict in URL and resolution in Prefer", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: "https://fake.test",
  SUPABASE_SECRET_KEY: "secret-key-value",
}, async () => {
  const requests = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, opts) => {
    requests.push({ url, ...opts });
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify([{ id: "456", slug: "example-drywall" }]),
    };
  };

  try {
    const result = await db.upsertRow("clients", { slug: "example-drywall", business_name: "Drywall Inc" }, "slug");
    assert.equal(requests.length, 1);
    assert.ok(requests[0].url.includes("?on_conflict=slug"));
    assert.equal(requests[0].headers["Prefer"], "return=representation,resolution=merge-duplicates");
    assert.equal(result.slug, "example-drywall");
  } finally {
    globalThis.fetch = originalFetch;
  }
}));

test("selectRows: sends GET with query parameters", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: "https://fake.test",
  SUPABASE_SECRET_KEY: "secret-key-value",
}, async () => {
  const requests = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, opts) => {
    requests.push({ url, ...opts });
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify([{ id: "789", client_id: "111" }]),
    };
  };

  try {
    const results = await db.selectRows("conversations", "id=eq.789&client_id=eq.111");
    assert.equal(requests.length, 1);
    assert.equal(requests[0].url, "https://fake.test/rest/v1/conversations?id=eq.789&client_id=eq.111");
    assert.equal(requests[0].method, "GET");
    assert.equal(results.length, 1);
    assert.equal(results[0].id, "789");
  } finally {
    globalThis.fetch = originalFetch;
  }
}));

test("selectRows: works with empty query", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: "https://fake.test",
  SUPABASE_SECRET_KEY: "secret-key-value",
}, async () => {
  const requests = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, opts) => {
    requests.push({ url, ...opts });
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify([]),
    };
  };

  try {
    await db.selectRows("clients");
    assert.equal(requests[0].url, "https://fake.test/rest/v1/clients");
  } finally {
    globalThis.fetch = originalFetch;
  }
}));

test("request: URL base doesn't produce double slash with trailing slash", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: "https://fake.test/",
  SUPABASE_SECRET_KEY: "secret-key-value",
}, async () => {
  const requests = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, opts) => {
    requests.push({ url, ...opts });
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify([]),
    };
  };

  try {
    await db.selectRows("test");
    assert.equal(requests[0].url, "https://fake.test/rest/v1/test");
    assert.ok(!requests[0].url.includes("//rest"));
  } finally {
    globalThis.fetch = originalFetch;
  }
}));

test("request: throws on non-ok response without exposing secret key", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: "https://fake.test",
  SUPABASE_SECRET_KEY: "secret-key-value",
}, async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    return {
      ok: false,
      status: 401,
      text: async () => "nope",
    };
  };

  try {
    await assert.rejects(
      () => db.selectRows("test"),
      (err) => {
        assert.ok(!err.message.includes("secret-key-value"));
        assert.ok(err.message.includes("401"));
        return true;
      }
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
}));

test("request: returns empty array on 204 No Content (via selectRows)", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: "https://fake.test",
  SUPABASE_SECRET_KEY: "secret-key-value",
}, async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    return {
      ok: true,
      status: 204,
      text: async () => "",
    };
  };

  try {
    const result = await db.selectRows("test");
    assert.deepEqual(result, []);
  } finally {
    globalThis.fetch = originalFetch;
  }
}));

test("insertRows: sends array of rows", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: "https://fake.test",
  SUPABASE_SECRET_KEY: "secret-key-value",
}, async () => {
  const requests = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, opts) => {
    requests.push({ url, ...opts, body: JSON.parse(opts.body) });
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify([{ id: "1" }, { id: "2" }]),
    };
  };

  try {
    const results = await db.insertRows("messages", [
      { role: "user", content: "hi" },
      { role: "assistant", content: "hello" },
    ]);
    assert.equal(results.length, 2);
    assert.ok(Array.isArray(requests[0].body));
    assert.equal(requests[0].body.length, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
}));

test("insertRows: returns empty array on null response", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: "https://fake.test",
  SUPABASE_SECRET_KEY: "secret-key-value",
}, async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    return {
      ok: true,
      status: 200,
      text: async () => "",
    };
  };

  try {
    const results = await db.insertRows("messages", []);
    assert.equal(Array.isArray(results), true);
    assert.equal(results.length, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
}));

test("updateRows: sends PATCH with query and body", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: "https://fake.test",
  SUPABASE_SECRET_KEY: "secret-key-value",
}, async () => {
  const requests = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, opts) => {
    requests.push({ url, ...opts });
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify([{ id: "conv-1", outcome: "ok" }]),
    };
  };

  try {
    const results = await db.updateRows("conversations", "id=eq.conv-1", { outcome: "ok" });
    assert.equal(requests[0].url, "https://fake.test/rest/v1/conversations?id=eq.conv-1");
    assert.equal(requests[0].method, "PATCH");
    assert.equal(results.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
}));
