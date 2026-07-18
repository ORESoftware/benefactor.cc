# Benefactor click tracker (Cloudflare Worker)

Records clicks on the outreach `/team` link and redirects the visitor to the real
team page. It is the on-brand (`go.benefactor.cc`) twin of the Rust backend's
`/r/team` endpoint — same token, same Supabase table — so the email link can
point at either.

## How attribution works

The outreach email's team link is a per-lead **signed token** (HS256 JWT) minted
by `benefactor-backend-rs`. The token carries the lead's id, campaign, and
link key. This Worker (or the backend) verifies the signature, inserts a row into
Supabase, then `302`s to `REDIRECT_URL`. Only leads we already emailed can be
attributed — a random visitor has no token and is simply redirected.

## One-time setup

1. **Supabase table** — apply the migration in
   `../../../ores/k8s-cluster/remote/deployments/benefactor-backend-rs/supabase/migrations/`
   (`benefactor_outreach_clicks`) to the existing project.
2. **DNS** — none needed manually. `wrangler.toml` binds `go.benefactor.cc` as a
   Cloudflare **custom domain**, so `wrangler deploy` provisions the proxied DNS
   record automatically (the `benefactor.cc` zone is already on Cloudflare).
3. **Secrets**:
   ```sh
   cd workers/click-tracker
   wrangler secret put BENEFACTOR_TRACKING_SECRET   # must match the backend
   wrangler secret put SUPABASE_URL                 # https://<ref>.supabase.co
   wrangler secret put SUPABASE_PUBLISHABLE_KEY
   wrangler secret put SUPABASE_CLICK_WRITER_TOKEN  # role=benefactor_click_writer
   ```
4. **Deploy**:
   ```sh
   wrangler deploy
   ```

## Backend wiring

Point the email link at this Worker by setting on `benefactor-backend-rs`:

```
BENEFACTOR_TRACKING_ENABLED=true
BENEFACTOR_TRACKING_SECRET=<same secret as the Worker>
BENEFACTOR_TRACKING_PREVIOUS_SECRET=<planned rotation only>
BENEFACTOR_TRACKING_TOKEN_TTL_SECONDS=7776000
BENEFACTOR_TRACKING_BASE_URL=https://go.benefactor.cc/r/team
BENEFACTOR_TRACKING_REDIRECT_URL=https://benefactor.cc/team
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<publishable or legacy anon key>
SUPABASE_CLICK_WRITER_TOKEN=<JWT with role=benefactor_click_writer>
SUPABASE_DB_SCHEMA=benefactor-cc
```

The table lives in the **`benefactor-cc`** schema (not `public`). Apply the
migration from `benefactor-backend-rs/supabase/migrations/`, and expose the schema
in the Supabase project (Project Settings → API → Exposed schemas, i.e.
`PGRST_DB_SCHEMAS=public,benefactor-cc`) — otherwise PostgREST returns
`PGRST106` for the `Content-Profile: benefactor-cc` header.

Apply the backend's `20260718000000_least_privilege_click_writer.sql` migration
before configuring the writer token. It creates a role that is subject to RLS,
has no `BYPASSRLS` capability, and can insert only bounded click fields. The
token must be minted by a secured signer trusted by the Supabase project; never
place that signing key in the Worker. For a planned key rotation, configure the
previous signing secret in both services for no more than 90 days. For an
incident, rotate the current key without retaining the compromised key.

To use the backend endpoint instead of (or as a fallback to) this Worker, set
`BENEFACTOR_TRACKING_BASE_URL` to `https://<backend-host>/r/team`.
