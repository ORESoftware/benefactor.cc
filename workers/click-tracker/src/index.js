// Cloudflare Worker: Benefactor outreach click tracker.
//
//   GET https://go.benefactor.cc/r/team?t=<hs256-jwt>
//
// Verifies the per-lead signed token, records the click to Supabase with a
// dedicated non-bypassing writer role, then 302-redirects to the team page. This mirrors the Rust
// backend's /r/team endpoint exactly (same token, same table) so the outreach
// link can point at either host.
//
// Secrets (set with `wrangler secret put <NAME>`):
//   BENEFACTOR_TRACKING_SECRET           current HS256 signing secret (must match backend)
//   BENEFACTOR_TRACKING_PREVIOUS_SECRET  optional previous signing secret for a normal rollover
//   SUPABASE_URL                         https://<ref>.supabase.co
//   SUPABASE_PUBLISHABLE_KEY             Supabase publishable / legacy anon API key
//   SUPABASE_CLICK_WRITER_TOKEN          custom JWT with role=benefactor_click_writer
// Vars (wrangler.toml [vars]):
//   REDIRECT_URL                 final landing page (default benefactor.cc/team)
//   SUPABASE_CLICKS_TABLE        default benefactor_outreach_clicks
//   SUPABASE_DB_SCHEMA           Postgres schema / Content-Profile (default benefactor-cc)

const DEFAULT_REDIRECT_URL = "https://benefactor.cc/team";
const TRACKING_PATHS = new Set(["/r/team", "/r/team/"]);
const MAX_TOKEN_BYTES = 4096;
const MAX_CLAIM_LENGTH = 512;
const MAX_TRACKING_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 90;
const MAX_CAMPAIGN_LENGTH = 256;
const MAX_LINK_KEY_LENGTH = 128;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const IDENTIFIER_PATTERN = /^[A-Za-z_][A-Za-z0-9_-]{0,62}$/;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const redirectTo = safeRedirectUrl(env.REDIRECT_URL);
    const token = url.searchParams.get("t");

    if (request.method === "GET" && TRACKING_PATHS.has(url.pathname) && token) {
      const claims = await verifyToken(
        token,
        env.BENEFACTOR_TRACKING_SECRET,
        env.BENEFACTOR_TRACKING_PREVIOUS_SECRET,
      );
      if (claims) {
        // Best-effort: don't block the redirect on the Supabase insert.
        ctx.waitUntil(
          recordClick(claims, request, env).catch((err) =>
            console.error("supabase click insert failed", err),
          ),
        );
      }
    }

    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectTo,
          "Cache-Control": "no-store",
          "Content-Security-Policy": "default-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'; object-src 'none'",
          "Permissions-Policy": "camera=(), geolocation=(), microphone=()",
          "Referrer-Policy": "no-referrer",
          "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY",
      },
    });
  },
};

function safeRedirectUrl(value) {
  if (!value) return DEFAULT_REDIRECT_URL;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      ? url.toString()
      : DEFAULT_REDIRECT_URL;
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

async function verifyToken(token, currentSecret, previousSecret) {
  if (token.length > MAX_TOKEN_BYTES) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, sigB64] = parts;
    if (!headerB64 || !payloadB64 || !sigB64) return null;
    const enc = new TextEncoder();
    const header = JSON.parse(new TextDecoder().decode(base64urlToBytes(headerB64)));
    if (header.alg !== "HS256") return null;
    if (header.typ && header.typ !== "JWT") return null;

    const claims = JSON.parse(new TextDecoder().decode(base64urlToBytes(payloadB64)));
    if (!isValidClaims(claims)) return null;

    for (const secret of [currentSecret, previousSecret]) {
      if (!secret || new TextEncoder().encode(secret).length < 32) continue;
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
      if (valid) return claims;
    }
    return null;
  } catch {
    return null;
  }
}

function isValidClaims(claims) {
  if (!claims || typeof claims !== "object" || Array.isArray(claims)) return false;
  const now = Date.now() / 1000;
  if (!Number.isFinite(claims.exp) || now > claims.exp) return false;
  if (!Number.isFinite(claims.iat) || claims.iat > now + 300) return false;
  if (claims.exp < claims.iat || claims.exp - claims.iat > MAX_TRACKING_TOKEN_TTL_SECONDS) return false;
  if (claims.nbf !== undefined && (!Number.isFinite(claims.nbf) || now < claims.nbf)) return false;
  if (!isBoundedString(claims.lid, 36) || !UUID_PATTERN.test(claims.lid)) return false;
  if (claims.cmp !== undefined && claims.cmp !== null && !isBoundedString(claims.cmp, MAX_CAMPAIGN_LENGTH)) return false;
  if (claims.lk !== undefined && claims.lk !== null && !isBoundedString(claims.lk, MAX_LINK_KEY_LENGTH)) return false;
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
  if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY || !env.SUPABASE_CLICK_WRITER_TOKEN) {
    console.warn("supabase not configured; click not recorded");
    return;
  }
  const table = env.SUPABASE_CLICKS_TABLE || "benefactor_outreach_clicks";
  const schema = env.SUPABASE_DB_SCHEMA || "benefactor-cc";
  if (!IDENTIFIER_PATTERN.test(table) || !IDENTIFIER_PATTERN.test(schema)) {
    console.warn("supabase table/schema configuration is invalid");
    return;
  }
  let endpoint;
  try {
    const base = new URL(env.SUPABASE_URL);
    if (base.protocol !== "https:" || !base.hostname) throw new Error("unsafe Supabase URL");
    endpoint = new URL(`/rest/v1/${table}`, base.origin).toString();
  } catch {
    console.warn("supabase URL configuration is invalid");
    return;
  }
  // cf-connecting-ip is the trusted client IP inside a Worker.
  const ip =
    boundedHeader(request, "cf-connecting-ip", 64) ||
    boundedHeader(request, "x-forwarded-for", 256)?.split(",")[0].trim().slice(0, 64) ||
    null;

  const body = {
    lead_id: claims.lid,
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
      apikey: env.SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_CLICK_WRITER_TOKEN}`,
      "Content-Type": "application/json",
      // Select the (non-public) target schema for this write. Must be in the
      // PostgREST exposed schemas list (PGRST_DB_SCHEMAS / Supabase API settings).
      "Content-Profile": schema,
      Prefer: "return=minimal",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 1024);
    console.warn("supabase click insert non-success", res.status, detail);
  }
}
