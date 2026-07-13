// Cloudflare Worker: Benefactor outreach click tracker.
//
//   GET https://go.benefactor.cc/r/team?t=<hs256-jwt>
//
// Verifies the per-lead signed token, records the click to Supabase (REST API,
// service-role key), then 302-redirects to the team page. This mirrors the Rust
// backend's /r/team endpoint exactly (same token, same table) so the outreach
// link can point at either host.
//
// Secrets (set with `wrangler secret put <NAME>`):
//   BENEFACTOR_TRACKING_SECRET   HS256 signing secret (must match the backend)
//   SUPABASE_URL                 https://<ref>.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY    Supabase service-role key
// Vars (wrangler.toml [vars]):
//   REDIRECT_URL                 final landing page (default benefactor.cc/team)
//   SUPABASE_CLICKS_TABLE        default benefactor_outreach_clicks
//   SUPABASE_DB_SCHEMA           Postgres schema / Content-Profile (default benefactor-cc)

const DEFAULT_REDIRECT_URL = "https://benefactor.cc/team";
const TRACKING_PATHS = new Set(["/r/team", "/r/team/"]);
const MAX_TOKEN_BYTES = 4096;
const MAX_CLAIM_LENGTH = 512;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const redirectTo = safeRedirectUrl(env.REDIRECT_URL);
    const token = url.searchParams.get("t");

    if (TRACKING_PATHS.has(url.pathname) && token) {
      const claims = await verifyToken(token, env.BENEFACTOR_TRACKING_SECRET);
      if (claims) {
        // Best-effort: don't block the redirect on the Supabase insert.
        ctx.waitUntil(
          recordClick(claims, request, env).catch((err) =>
            console.error("supabase click insert failed", err),
          ),
        );
      } else {
        console.warn("received outreach click with invalid/expired token");
      }
    }

    return Response.redirect(redirectTo, 302);
  },
};

function safeRedirectUrl(value) {
  if (!value) return DEFAULT_REDIRECT_URL;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : DEFAULT_REDIRECT_URL;
  } catch {
    return DEFAULT_REDIRECT_URL;
  }
}

function base64urlToBytes(input) {
  if (!/^[A-Za-z0-9_-]+$/.test(input)) throw new Error("invalid base64url");
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function verifyToken(token, secret) {
  if (!secret) return null;
  if (token.length > MAX_TOKEN_BYTES) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, sigB64] = parts;
  if (!headerB64 || !payloadB64 || !sigB64) return null;
  const enc = new TextEncoder();
  let header;
  try {
    header = JSON.parse(new TextDecoder().decode(base64urlToBytes(headerB64)));
  } catch {
    return null;
  }
  if (header.alg !== "HS256") return null;
  if (header.typ && header.typ !== "JWT") return null;

  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    base64urlToBytes(sigB64),
    enc.encode(`${headerB64}.${payloadB64}`),
  );
  if (!valid) return null;

  let claims;
  try {
    claims = JSON.parse(new TextDecoder().decode(base64urlToBytes(payloadB64)));
  } catch {
    return null;
  }
  if (!isValidClaims(claims)) return null;
  return claims;
}

function isValidClaims(claims) {
  if (!claims || typeof claims !== "object" || Array.isArray(claims)) return false;
  const now = Date.now() / 1000;
  if (claims.exp !== undefined && (!Number.isFinite(claims.exp) || now > claims.exp)) return false;
  if (claims.nbf !== undefined && (!Number.isFinite(claims.nbf) || now < claims.nbf)) return false;
  if (!isBoundedString(claims.email) || !claims.email.includes("@")) return false;
  if (!isBoundedString(claims.lid)) return false;
  for (const optional of ["cmp", "lk"]) {
    if (claims[optional] !== undefined && claims[optional] !== null && !isBoundedString(claims[optional])) {
      return false;
    }
  }
  return true;
}

function isBoundedString(value, max = MAX_CLAIM_LENGTH) {
  return typeof value === "string" && value.length > 0 && value.length <= max;
}

function boundedHeader(request, name, max = MAX_CLAIM_LENGTH) {
  const value = request.headers.get(name);
  if (!value) return null;
  return value.slice(0, max);
}

async function recordClick(claims, request, env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("supabase not configured; click not recorded");
    return;
  }
  const table = env.SUPABASE_CLICKS_TABLE || "benefactor_outreach_clicks";
  const endpoint = `${env.SUPABASE_URL.replace(/\/+$/, "")}/rest/v1/${table}`;
  // cf-connecting-ip is the trusted client IP inside a Worker.
  const ip =
    request.headers.get("cf-connecting-ip") ||
    (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
    null;

  const body = {
    lead_id: claims.lid,
    email: claims.email,
    campaign: claims.cmp || null,
    link_key: claims.lk || "team",
    source: "cloudflare-worker",
    ip_address: ip,
    user_agent: boundedHeader(request, "user-agent"),
    referer: boundedHeader(request, "referer", 2048),
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      // Select the (non-public) target schema for this write. Must be in the
      // PostgREST exposed schemas list (PGRST_DB_SCHEMAS / Supabase API settings).
      "Content-Profile": env.SUPABASE_DB_SCHEMA || "benefactor-cc",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.warn("supabase click insert non-success", res.status, await res.text());
  }
}
