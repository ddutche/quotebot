import { test } from "node:test";
import assert from "node:assert/strict";
import * as storage from "./storage.js";

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

// isPhotoPathFor tests
test("isPhotoPathFor: true for valid UUID pair", () => {
  const validUuid = "550e8400-e29b-41d4-a716-446655440000";
  const path = `example-drywall/${validUuid}/${validUuid}.jpg`;
  assert.equal(storage.isPhotoPathFor(path, "example-drywall", validUuid), true);
});

test("isPhotoPathFor: false for different client slug", () => {
  const validUuid = "550e8400-e29b-41d4-a716-446655440000";
  const path = `other-client/${validUuid}/${validUuid}.jpg`;
  assert.equal(storage.isPhotoPathFor(path, "example-drywall", validUuid), false);
});

test("isPhotoPathFor: false for different conversation id", () => {
  const uuid1 = "550e8400-e29b-41d4-a716-446655440000";
  const uuid2 = "650e8400-e29b-41d4-a716-446655440001";
  const path = `example-drywall/${uuid2}/${uuid1}.jpg`;
  assert.equal(storage.isPhotoPathFor(path, "example-drywall", uuid1), false);
});

test("isPhotoPathFor: false for .png extension", () => {
  const validUuid = "550e8400-e29b-41d4-a716-446655440000";
  const path = `example-drywall/${validUuid}/${validUuid}.png`;
  assert.equal(storage.isPhotoPathFor(path, "example-drywall", validUuid), false);
});

test("isPhotoPathFor: false for path with .. in it", () => {
  const validUuid = "550e8400-e29b-41d4-a716-446655440000";
  const path = `example-drywall/${validUuid}/../other/${validUuid}.jpg`;
  assert.equal(storage.isPhotoPathFor(path, "example-drywall", validUuid), false);
});

test("isPhotoPathFor: false for path with segment removed", () => {
  const validUuid = "550e8400-e29b-41d4-a716-446655440000";
  const path = `example-drywall/${validUuid}.jpg`;
  assert.equal(storage.isPhotoPathFor(path, "example-drywall", validUuid), false);
});

test("isPhotoPathFor: false for 300-character path", () => {
  const longPath = "a".repeat(300);
  assert.equal(storage.isPhotoPathFor(longPath, "example-drywall", "uuid"), false);
});

test("isPhotoPathFor: false for non-string", () => {
  assert.equal(storage.isPhotoPathFor(null, "example-drywall", "uuid"), false);
  assert.equal(storage.isPhotoPathFor(123, "example-drywall", "uuid"), false);
  assert.equal(storage.isPhotoPathFor(undefined, "example-drywall", "uuid"), false);
});

// photoPath tests
test("photoPath: starts with slug and conversation id, ends with .jpg", () => {
  const path = storage.photoPath("example-drywall", "conv-uuid-123");
  assert.ok(path.startsWith("example-drywall/conv-uuid-123/"));
  assert.ok(path.endsWith(".jpg"));
});

test("photoPath: different calls produce different paths", () => {
  const path1 = storage.photoPath("example-drywall", "conv-uuid-123");
  const path2 = storage.photoPath("example-drywall", "conv-uuid-123");
  assert.notEqual(path1, path2);
});

// storageEnabled tests
test("storageEnabled: returns false when both env vars missing", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: undefined,
  SUPABASE_SECRET_KEY: undefined,
}, () => {
  assert.equal(storage.storageEnabled(), false);
}));

test("storageEnabled: returns false when URL missing", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: undefined,
  SUPABASE_SECRET_KEY: "secret-key",
}, () => {
  assert.equal(storage.storageEnabled(), false);
}));

test("storageEnabled: returns false when key missing", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SECRET_KEY: undefined,
}, () => {
  assert.equal(storage.storageEnabled(), false);
}));

test("storageEnabled: returns true when both vars set", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SECRET_KEY: "secret-key",
}, () => {
  assert.equal(storage.storageEnabled(), true);
}));

// createUploadLink tests
test("createUploadLink: POSTs to correct URL with correct headers", withEnv({
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
      text: async () => "",
      json: async () => ({ url: "/object/upload/sign/chat-photos/p.jpg?token=abc123", token: "abc123" }),
    };
  };

  try {
    const result = await storage.createUploadLink("p.jpg");
    assert.equal(requests.length, 1);
    assert.equal(
      requests[0].url,
      "https://fake.test/storage/v1/object/upload/sign/chat-photos/p.jpg"
    );
    assert.equal(requests[0].method, "POST");
    assert.equal(requests[0].headers.apikey, "secret-key-value");
    assert.equal(requests[0].headers.Authorization, "Bearer secret-key-value");
    assert.equal(result.path, "p.jpg");
    assert.equal(result.token, "abc123");
    assert.ok(result.uploadUrl.includes("/storage/v1"));
  } finally {
    globalThis.fetch = originalFetch;
  }
}));

// createReadLink tests
test("createReadLink: POSTs to correct URL with expiresIn body", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: "https://fake.test",
  SUPABASE_SECRET_KEY: "secret-key-value",
}, async () => {
  const requests = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, opts) => {
    // Spread opts first: otherwise the raw string body overwrites the parsed one.
    requests.push({ url, ...opts, body: opts.body ? JSON.parse(opts.body) : null });
    return {
      ok: true,
      status: 200,
      text: async () => "",
      json: async () => ({ signedURL: "/object/sign/chat-photos/p.jpg?token=xyz789" }),
    };
  };

  try {
    const result = await storage.createReadLink("p.jpg");
    assert.equal(requests.length, 1);
    assert.equal(
      requests[0].url,
      "https://fake.test/storage/v1/object/sign/chat-photos/p.jpg"
    );
    assert.equal(requests[0].method, "POST");
    assert.ok(requests[0].body.expiresIn);
    assert.ok(result.includes("/storage/v1"));
  } finally {
    globalThis.fetch = originalFetch;
  }
}));

test("createReadLink: handles signedUrl key variant", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: "https://fake.test",
  SUPABASE_SECRET_KEY: "secret-key-value",
}, async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    return {
      ok: true,
      status: 200,
      text: async () => "",
      json: async () => ({ signedUrl: "/object/sign/chat-photos/p.jpg?token=xyz789" }),
    };
  };

  try {
    const result = await storage.createReadLink("p.jpg");
    assert.ok(result.includes("/storage/v1"));
  } finally {
    globalThis.fetch = originalFetch;
  }
}));

// readLinksFor tests
test("readLinksFor: skips failed paths and returns successful links", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: "https://fake.test",
  SUPABASE_SECRET_KEY: "secret-key-value",
}, async () => {
  let callCount = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    callCount++;
    if (callCount === 1) {
      throw new Error("First photo failed");
    }
    return {
      ok: true,
      status: 200,
      text: async () => "",
      json: async () => ({ signedURL: "/object/sign/chat-photos/b.jpg?token=xyz" }),
    };
  };

  try {
    const results = await storage.readLinksFor(["a.jpg", "b.jpg"]);
    assert.equal(results.length, 1);
    assert.ok(results[0].includes("/storage/v1"));
  } finally {
    globalThis.fetch = originalFetch;
  }
}));

test("readLinksFor: doesn't throw when all requests fail", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: "https://fake.test",
  SUPABASE_SECRET_KEY: "secret-key-value",
}, async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("Network error");
  };

  try {
    const results = await storage.readLinksFor(["a.jpg", "b.jpg"]);
    assert.equal(results.length, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
}));

// Error message security tests
test("createUploadLink: error does not contain secret key", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: "https://fake.test",
  SUPABASE_SECRET_KEY: "secret-key-value",
}, async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    return {
      ok: false,
      status: 401,
      text: async () => "unauthorized",
    };
  };

  try {
    await assert.rejects(
      () => storage.createUploadLink("p.jpg"),
      (err) => {
        assert.ok(!err.message.includes("secret-key-value"));
        return true;
      }
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
}));

test("createReadLink: error does not contain secret key", withEnv({
  NEXT_PUBLIC_SUPABASE_URL: "https://fake.test",
  SUPABASE_SECRET_KEY: "secret-key-value",
}, async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    return {
      ok: false,
      status: 401,
      text: async () => "unauthorized",
    };
  };

  try {
    await assert.rejects(
      () => storage.createReadLink("p.jpg"),
      (err) => {
        assert.ok(!err.message.includes("secret-key-value"));
        return true;
      }
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
}));
