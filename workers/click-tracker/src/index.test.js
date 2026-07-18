import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import worker from "./index.js";

const originalFetch = globalThis.fetch;
const secret = "test-secret-with-at-least-thirty-two-bytes";

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

async function tokenFor(claims, header = { alg: "HS256", typ: "JWT" }, signingSecret = secret) {
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

function context() {
  const pending = [];
  return {
    pending,
    waitUntil(promise) {
      pending.push(promise);
    },
  };
}

test("redirects with privacy and cache protections", async () => {
  const response = await worker.fetch(new Request("https://go.benefactor.cc/r/team"), {}, context());
  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), "https://benefactor.cc/team");
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.get("referrer-policy"), "no-referrer");
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.equal(response.headers.get("x-frame-options"), "DENY");
});

test("malformed signatures fail closed without breaking the redirect", async () => {
  globalThis.fetch = () => {
    throw new Error("invalid tokens must not write");
  };
  const ctx = context();
  const response = await worker.fetch(
    new Request("https://go.benefactor.cc/r/team?t=e30.e30.%25%25%25"),
    { BENEFACTOR_TRACKING_SECRET: secret },
    ctx,
  );
  assert.equal(response.status, 302);
  assert.equal(ctx.pending.length, 0);
});

test("records only valid, unexpired lead tokens", async () => {
  let write;
  globalThis.fetch = async (url, options) => {
    write = { url, options };
    return new Response(null, { status: 201 });
  };
  const now = Math.floor(Date.now() / 1000);
  const token = await tokenFor({
    lid: "70b7b8e4-f8cb-4a7d-9ac4-b39c68e31b4e",
    cmp: "campaign",
    lk: "team",
    iat: now,
    exp: now + 300,
  });
  const ctx = context();
  await worker.fetch(
    new Request(`https://go.benefactor.cc/r/team?t=${token}`, {
      headers: { "user-agent": "x".repeat(700) },
    }),
    {
        BENEFACTOR_TRACKING_SECRET: secret,
        SUPABASE_URL: "https://project.supabase.co",
        SUPABASE_PUBLISHABLE_KEY: "publishable-key",
        SUPABASE_CLICK_WRITER_TOKEN: "click-writer-token",
    },
    ctx,
  );
  await Promise.all(ctx.pending);
  assert.equal(write.url, "https://project.supabase.co/rest/v1/benefactor_outreach_clicks");
  const body = JSON.parse(write.options.body);
    assert.equal(body.lead_id, "70b7b8e4-f8cb-4a7d-9ac4-b39c68e31b4e");
    assert.equal("email" in body, false);
    assert.equal(body.user_agent.length, 512);
    assert.equal(write.options.headers.apikey, "publishable-key");
    assert.equal(write.options.headers.Authorization, "Bearer click-writer-token");
});

test("rejects signed tokens without an expiration", async () => {
  globalThis.fetch = () => {
    throw new Error("non-expiring tokens must not write");
  };
  const token = await tokenFor({
    lid: "70b7b8e4-f8cb-4a7d-9ac4-b39c68e31b4e",
  });
  const ctx = context();
  await worker.fetch(
    new Request(`https://go.benefactor.cc/r/team?t=${token}`),
    { BENEFACTOR_TRACKING_SECRET: secret },
    ctx,
  );
  assert.equal(ctx.pending.length, 0);
});

test("accepts a previous signing key only during a planned rotation", async () => {
  const previousSecret = "previous-secret-with-at-least-thirty-two-bytes";
  const now = Math.floor(Date.now() / 1000);
  const token = await tokenFor(
    {
      lid: "70b7b8e4-f8cb-4a7d-9ac4-b39c68e31b4e",
      cmp: "campaign",
      lk: "team",
      iat: now,
      exp: now + 300,
    },
    undefined,
    previousSecret,
  );
  const ctx = context();
  await worker.fetch(
    new Request(`https://go.benefactor.cc/r/team?t=${token}`),
    { BENEFACTOR_TRACKING_SECRET: secret, BENEFACTOR_TRACKING_PREVIOUS_SECRET: previousSecret },
    ctx,
  );
  assert.equal(ctx.pending.length, 1);
});
