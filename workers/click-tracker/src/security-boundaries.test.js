import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import worker from "./index.js";

const originalFetch = globalThis.fetch;
const currentSecret = "current-secret-with-at-least-thirty-two-bytes";
const previousSecret = "previous-secret-with-at-least-thirty-two-bytes";
const leadId = "70b7b8e4-f8cb-4a7d-9ac4-b39c68e31b4e";

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function context() {
  const pending = [];
  return {
    pending,
    waitUntil(promise) {
      pending.push(promise);
    },
  };
}

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

async function tokenFor(claims, signingSecret = currentSecret, header = { alg: "HS256", typ: "JWT" }) {
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(claims));
  const input = `${encodedHeader}.${encodedPayload}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(signingSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(input));
  return `${input}.${Buffer.from(signature).toString("base64url")}`;
}

function validClaims(overrides = {}) {
  const now = Math.floor(Date.now() / 1000);
  return {
    lid: leadId,
    cmp: "campaign",
    lk: "team",
    iat: now,
    exp: now + 300,
    ...overrides,
  };
}

async function assertNoWrite(token, env = {}) {
  globalThis.fetch = () => {
    throw new Error("rejected input must never write to Supabase");
  };
  const ctx = context();
  const response = await worker.fetch(
    new Request(`https://go.benefactor.cc/r/team?t=${encodeURIComponent(token)}`),
    { BENEFACTOR_TRACKING_SECRET: currentSecret, ...env },
    ctx,
  );
  assert.equal(response.status, 302);
  assert.equal(ctx.pending.length, 0);
}

test("rejects algorithm confusion and non-JWT token types", async () => {
  await assertNoWrite(await tokenFor(validClaims(), currentSecret, { alg: "none", typ: "JWT" }));
  await assertNoWrite(await tokenFor(validClaims(), currentSecret, { alg: "HS256", typ: "JWE" }));
});

test("rejects future, inverted, and overlong token lifetimes", async () => {
  const now = Math.floor(Date.now() / 1000);
  await assertNoWrite(await tokenFor(validClaims({ iat: now + 301, exp: now + 600 })));
  await assertNoWrite(await tokenFor(validClaims({ iat: now, exp: now - 1 })));
  await assertNoWrite(await tokenFor(validClaims({ iat: now, exp: now + 60 * 60 * 24 * 90 + 1 })));
  await assertNoWrite(await tokenFor(validClaims({ nbf: now + 1 })));
});

test("rejects invalid lead identifiers and oversized campaign metadata", async () => {
  await assertNoWrite(await tokenFor(validClaims({ lid: "not-a-uuid" })));
  await assertNoWrite(await tokenFor(validClaims({ cmp: "x".repeat(257) })));
  await assertNoWrite(await tokenFor(validClaims({ lk: "x".repeat(129) })));
});

test("rejects short signing keys even when the signature matches", async () => {
  const shortSecret = "too-short";
  const token = await tokenFor(validClaims(), shortSecret);
  await assertNoWrite(token, { BENEFACTOR_TRACKING_SECRET: shortSecret });
});

test("falls back from unsafe redirect and Supabase configuration", async () => {
  const token = await tokenFor(validClaims());
  const attemptedWrites = [];
  globalThis.fetch = async (...args) => {
    attemptedWrites.push(args);
    return new Response(null, { status: 201 });
  };

  const ctx = context();
  const response = await worker.fetch(
    new Request(`https://go.benefactor.cc/r/team?t=${encodeURIComponent(token)}`),
    {
      BENEFACTOR_TRACKING_SECRET: currentSecret,
      REDIRECT_URL: "https://user:password@example.com/private",
      SUPABASE_URL: "http://project.supabase.co",
      SUPABASE_PUBLISHABLE_KEY: "publishable-key",
      SUPABASE_CLICK_WRITER_TOKEN: "writer-token",
    },
    ctx,
  );
  await Promise.all(ctx.pending);

  assert.equal(response.headers.get("location"), "https://benefactor.cc/team");
  assert.equal(attemptedWrites.length, 0);
});

test("rejects unsafe table and schema identifiers before constructing a request", async () => {
  const token = await tokenFor(validClaims());
  const attemptedWrites = [];
  globalThis.fetch = async (...args) => {
    attemptedWrites.push(args);
    return new Response(null, { status: 201 });
  };

  for (const env of [
    { SUPABASE_CLICKS_TABLE: "clicks?select=*" },
    { SUPABASE_DB_SCHEMA: "benefactor-cc;drop schema public" },
  ]) {
    const ctx = context();
    await worker.fetch(
      new Request(`https://go.benefactor.cc/r/team?t=${encodeURIComponent(token)}`),
      {
        BENEFACTOR_TRACKING_SECRET: currentSecret,
        SUPABASE_URL: "https://project.supabase.co",
        SUPABASE_PUBLISHABLE_KEY: "publishable-key",
        SUPABASE_CLICK_WRITER_TOKEN: "writer-token",
        ...env,
      },
      ctx,
    );
    await Promise.all(ctx.pending);
  }

  assert.equal(attemptedWrites.length, 0);
});

test("accepts the previous key only when it is explicitly configured", async () => {
  const token = await tokenFor(validClaims(), previousSecret);
  await assertNoWrite(token);

  const ctx = context();
  await worker.fetch(
    new Request(`https://go.benefactor.cc/r/team?t=${encodeURIComponent(token)}`),
    {
      BENEFACTOR_TRACKING_SECRET: currentSecret,
      BENEFACTOR_TRACKING_PREVIOUS_SECRET: previousSecret,
    },
    ctx,
  );
  assert.equal(ctx.pending.length, 1);
});
