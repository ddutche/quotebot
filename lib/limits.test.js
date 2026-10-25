import { test } from "node:test";
import assert from "node:assert/strict";
import * as limits from "./limits.js";

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

// hostMatches tests
test("hostMatches: exact match", () => {
  assert.equal(limits.hostMatches("acme.com", "acme.com"), true);
});

test("hostMatches: subdomain match", () => {
  assert.equal(limits.hostMatches("shop.acme.com", "acme.com"), true);
});

test("hostMatches: subdomain with port", () => {
  assert.equal(limits.hostMatches("shop.acme.com:3000", "acme.com:3000"), true);
});

test("hostMatches: ignores case", () => {
  assert.equal(limits.hostMatches("SHOP.ACME.COM", "acme.com"), true);
  assert.equal(limits.hostMatches("acme.com", "ACME.COM"), true);
});

test("hostMatches: wildcard domain", () => {
  assert.equal(limits.hostMatches("shop.acme.com", "*.acme.com"), true);
  assert.equal(limits.hostMatches("api.acme.com", "*.acme.com"), true);
});

test("hostMatches: wildcard with port", () => {
  assert.equal(limits.hostMatches("shop.acme.com:8000", "*.acme.com:8000"), true);
});

test("hostMatches: false for acme.com.evil.com", () => {
  assert.equal(limits.hostMatches("acme.com.evil.com", "acme.com"), false);
});

test("hostMatches: false for notacme.com", () => {
  assert.equal(limits.hostMatches("notacme.com", "acme.com"), false);
});

test("hostMatches: false for empty string host", () => {
  assert.equal(limits.hostMatches("", "acme.com"), false);
});

test("hostMatches: false for null host", () => {
  assert.equal(limits.hostMatches(null, "acme.com"), false);
});

test("hostMatches: false for empty string domain", () => {
  assert.equal(limits.hostMatches("acme.com", ""), false);
});

test("hostMatches: false for null domain", () => {
  assert.equal(limits.hostMatches("acme.com", null), false);
});

test("hostMatches: false when both are missing", () => {
  assert.equal(limits.hostMatches(null, null), false);
  assert.equal(limits.hostMatches("", ""), false);
});

// websiteAllowed tests
test("websiteAllowed: allowed with no database", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: undefined,
  SUPABASE_SECRET_KEY: undefined,
}, async () => {
  let fetchCalled = false;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => {
    fetchCalled = true;
    return Promise.resolve({ ok: true, status: 200, text: async () => "[]" });
  };

  try {
    const result = await limits.websiteAllowed("client-123", "example.com");
    assert.equal(result.allowed, true);
    assert.equal(result.reason, "no database");
    assert.equal(fetchCalled, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
}));

test("websiteAllowed: no domains listed means allowed", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: "https://fake.test",
  SUPABASE_SECRET_KEY: "secret-key",
}, async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    return {
      ok: true,
      status: 200,
      text: async () => "[]",
    };
  };

  try {
    const result = await limits.websiteAllowed("client-123", "example.com");
    assert.equal(result.allowed, true);
    assert.equal(result.reason, "no list");
  } finally {
    globalThis.fetch = originalFetch;
  }
}));

test("websiteAllowed: matching host is allowed", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: "https://fake.test",
  SUPABASE_SECRET_KEY: "secret-key",
}, async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify([{ domain: "example.com" }]),
    };
  };

  try {
    const result = await limits.websiteAllowed("client-123", "example.com");
    assert.equal(result.allowed, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
}));

test("websiteAllowed: non-matching host is not allowed", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: "https://fake.test",
  SUPABASE_SECRET_KEY: "secret-key",
}, async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify([{ domain: "example.com" }]),
    };
  };

  try {
    const result = await limits.websiteAllowed("client-123", "notexample.com");
    assert.equal(result.allowed, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
}));

test("websiteAllowed: null host is allowed when no domains listed", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: "https://fake.test",
  SUPABASE_SECRET_KEY: "secret-key",
}, async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    return {
      ok: true,
      status: 200,
      text: async () => "[]",
    };
  };

  try {
    const result = await limits.websiteAllowed("client-123", null);
    assert.equal(result.allowed, true);
    assert.equal(result.reason, "no list");
  } finally {
    globalThis.fetch = originalFetch;
  }
}));

test("websiteAllowed: null host with domains listed is allowed", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: "https://fake.test",
  SUPABASE_SECRET_KEY: "secret-key",
}, async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify([{ domain: "example.com" }]),
    };
  };

  try {
    const result = await limits.websiteAllowed("client-123", null);
    assert.equal(result.allowed, true);
    assert.equal(result.reason, "no origin");
  } finally {
    globalThis.fetch = originalFetch;
  }
}));

test("websiteAllowed: fetch rejection returns allowed with check failed reason", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: "https://fake.test",
  SUPABASE_SECRET_KEY: "secret-key",
}, async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("Network error");
  };

  try {
    const result = await limits.websiteAllowed("client-123", "example.com");
    assert.equal(result.allowed, true);
    assert.equal(result.reason, "check failed");
  } finally {
    globalThis.fetch = originalFetch;
  }
}));

// visitorWithinLimit tests
test("visitorWithinLimit: allowed with no visitor hash", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: "https://fake.test",
  SUPABASE_SECRET_KEY: "secret-key",
}, async () => {
  let fetchCalled = false;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => {
    fetchCalled = true;
    return Promise.resolve({ ok: true, status: 200, text: async () => "[]" });
  };

  try {
    const result = await limits.visitorWithinLimit("client-123", null);
    assert.equal(result.allowed, true);
    assert.equal(fetchCalled, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
}));

test("visitorWithinLimit: allowed with no client id", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: "https://fake.test",
  SUPABASE_SECRET_KEY: "secret-key",
}, async () => {
  let fetchCalled = false;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => {
    fetchCalled = true;
    return Promise.resolve({ ok: true, status: 200, text: async () => "[]" });
  };

  try {
    const result = await limits.visitorWithinLimit(null, "visitor-hash-123");
    assert.equal(result.allowed, true);
    assert.equal(fetchCalled, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
}));

test("visitorWithinLimit: allowed when at the limit", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: "https://fake.test",
  SUPABASE_SECRET_KEY: "secret-key",
}, async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    // Return exactly MAX_CHATS_PER_VISITOR_PER_DAY rows
    const rows = Array(limits.MAX_CHATS_PER_VISITOR_PER_DAY).fill({ id: "conv-123" });
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify(rows),
    };
  };

  try {
    const result = await limits.visitorWithinLimit("client-123", "visitor-hash-123");
    assert.equal(result.allowed, true);
    assert.equal(result.count, limits.MAX_CHATS_PER_VISITOR_PER_DAY);
  } finally {
    globalThis.fetch = originalFetch;
  }
}));

test("visitorWithinLimit: not allowed when over the limit", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: "https://fake.test",
  SUPABASE_SECRET_KEY: "secret-key",
}, async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    // Return one more than MAX_CHATS_PER_VISITOR_PER_DAY rows
    const rows = Array(limits.MAX_CHATS_PER_VISITOR_PER_DAY + 1).fill({ id: "conv-123" });
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify(rows),
    };
  };

  try {
    const result = await limits.visitorWithinLimit("client-123", "visitor-hash-123");
    assert.equal(result.allowed, false);
    assert.equal(result.count, limits.MAX_CHATS_PER_VISITOR_PER_DAY + 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
}));

test("visitorWithinLimit: query includes correct parameters", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: "https://fake.test",
  SUPABASE_SECRET_KEY: "secret-key",
}, async () => {
  const requests = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, opts) => {
    requests.push({ url, ...opts });
    return {
      ok: true,
      status: 200,
      text: async () => "[]",
    };
  };

  try {
    await limits.visitorWithinLimit("client-123", "visitor-hash-456");
    assert.equal(requests.length, 1);
    assert.ok(requests[0].url.includes("visitor_hash=eq.visitor-hash-456"));
    assert.ok(requests[0].url.includes("started_at=gte."));
  } finally {
    globalThis.fetch = originalFetch;
  }
}));

test("visitorWithinLimit: fetch rejection returns allowed", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: "https://fake.test",
  SUPABASE_SECRET_KEY: "secret-key",
}, async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("Network error");
  };

  try {
    const result = await limits.visitorWithinLimit("client-123", "visitor-hash-123");
    assert.equal(result.allowed, true);
    assert.equal(result.reason, "check failed");
  } finally {
    globalThis.fetch = originalFetch;
  }
}));
