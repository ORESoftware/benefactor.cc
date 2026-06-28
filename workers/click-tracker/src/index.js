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

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const redirectTo = env.REDIRECT_URL || "https://benefactor.cc/team";
    const token = url.searchParams.get("t");

    if (token) {
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

function base64urlToBytes(input) {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function verifyToken(token, secret) {
  if (!secret) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, sigB64] = parts;
  const enc = new TextEncoder();

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
  if (claims.exp && Date.now() / 1000 > claims.exp) return null;
  return claims;
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
    lead_id: claims.lid || null,
    email: claims.email,
    campaign: claims.cmp || null,
    link_key: claims.lk || "team",
    source: "cloudflare-worker",
    ip_address: ip,
    user_agent: request.headers.get("user-agent"),
    referer: request.headers.get("referer"),
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
