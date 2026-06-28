# benefactor-interfaces

Shared schema + typed interfaces for the data the [Benefactor](../) outreach
system writes to Supabase (Postgres). Same spirit as
[`fiducia-interfaces`](../../fiducia.cloud/fiducia-interfaces),
[`sonus-auris-interfaces`](../../sonus-auris/sonus-auris-interfaces), and the
`ores/k8s-cluster/remote/libs/{interfaces,pg-defs}` libraries.

One **declarative source of truth** — [`schema/tables.json`](./schema/tables.json) —
generates everything else:

| Artifact | Path | For |
| --- | --- | --- |
| Idempotent Postgres DDL | `schema/schema.sql` | review / apply anywhere |
| Supabase declarative schema | `supabase/schemas/benefactor.sql` | `supabase db diff` |
| JSON Schema (row + insert) | `generated/json-schema/*.json` | cross-language validation |
| Dart adapters | `generated/dart/lib/benefactor_interfaces.dart` | clients |
| Rust adapters | `generated/rust/src/lib.rs` | `benefactor-backend-rs` + the Worker |

Everything under `generated/` (and `schema/schema.sql`, `supabase/schemas/`) is an
**adapter** — never hand-edit it, and never infer a migration from it. Edit
`schema/tables.json` and regenerate.

## Tables

- **`benefactor_outreach_clicks`** — click events from outreach `/team` tracking
  links. Each first-touch email's link carries a per-lead signed token (HS256
  JWT); the backend (`/r/team`) or the Cloudflare Worker (`go.benefactor.cc`)
  verifies it and inserts a row with the **service-role key**. Lead-attributed:
  only recipients we emailed produce rows.

This table is **service-role only**: RLS is enabled with no anon/authenticated
policies, so reads/writes require the service-role key (which bypasses RLS).
There is no `auth.uid()` owner column — clicks are not end-user-scoped.

## Generate

```sh
node src/generate.mjs          # write all artifacts
node src/generate.mjs --check  # CI: fail if any artifact is stale
node src/generate.mjs --print-sql
node --test src/*.test.mjs     # self-tests (no DB, no writes)
```

## Declarative migration to Supabase

The desired database state is `supabase/schemas/benefactor.sql`. With the
Supabase CLI and a linked (or local) project, generate a real delta migration:

```sh
supabase db diff -f benefactor --schema public   # → supabase/migrations/<ts>_benefactor.sql
supabase db push                                  # apply, after review
```

…or, without the CLI, emit the idempotent apply as a reviewable migration:

```sh
node src/diff.mjs            # → supabase/migrations/<utc>_benefactor.sql
node src/diff.mjs --print    # print to stdout
```

> **Migration safety.** Generated SQL is for human review. Never apply migrations
> automatically.

## Consuming the adapters

- **Rust (backend / Worker host):** depend on `generated/rust` (serde structs;
  `*_TABLE`, `*_COLUMNS`, and enum value constants are exported). Mirrors the
  insert shape `benefactor-backend-rs` POSTs to PostgREST.
- **Dart:** `OutreachClick.fromJson` reads PostgREST output (snake_case keys);
  `toInsertJson()` omits server-generated columns (`id`, `clicked_at`).
