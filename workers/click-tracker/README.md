# Benefactor click tracker (Cloudflare Worker)

Records clicks on the outreach `/team` link and redirects the visitor to the real
team page. It is the on-brand (`go.benefactor.cc`) twin of the Rust backend's
`/r/team` endpoint — same token, same Supabase table — so the email link can
point at either.

## How attribution works

The outreach email's team link is a per-lead **signed token** (HS256 JWT) minted
by `benefactor-backend-rs`. The token carries the lead's id, email, campaign, and
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
   wrangler secret put SUPABASE_SERVICE_ROLE_KEY
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
BENEFACTOR_TRACKING_BASE_URL=https://go.benefactor.cc/r/team
BENEFACTOR_TRACKING_REDIRECT_URL=https://benefactor.cc/team
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role key>
```

To use the backend endpoint instead of (or as a fallback to) this Worker, set
`BENEFACTOR_TRACKING_BASE_URL` to `https://<backend-host>/r/team`.
