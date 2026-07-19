# Agent Context — benefactor.cc

Durable operating context for coding agents in this repo. Read this first, then
read any nested `AGENTS.md` in the subdirectory you are working in.

## Sibling org repos — use `~/codes/benefactor-cc/`

All repos of the GitHub org
[benefactor-cc](https://github.com/orgs/benefactor-cc/repositories) are checked
out side by side in `/Users/maca5/codes/benefactor-cc/` (**hyphen** — distinct
from this folder's dot). Use that checkout from now on; read its `AGENTS.md`
for the repo map and shared tooling (e.g. the `dd-web-scraper` service).

This repo (Astro site source, `ORESoftware/benefactor.cc` — personal account,
not the org) stays here. Do **not** clone org repos inside it: a nested
`benefactor-interfaces/` working copy lived here until 2026-07-12 and has been
removed — use the org checkout instead.

## Worktrees

Git worktrees go under the repo's `tmp/` folder, which is gitignored:

```
tmp/worktrees/*
```

Create each worktree at `tmp/worktrees/<name>` (e.g.
`git worktree add tmp/worktrees/my-feature`). Keeping them under `tmp/` keeps
worktree checkouts out of version control.

## Deploying (read before shipping the live site)

The live site **https://benefactor.cc** is **not** served by this repo's own
GitHub Pages. Topology:

| Role | Repo | Notes |
| --- | --- | --- |
| Source (this repo) | `ORESoftware/benefactor.cc` (`origin`) | Astro source. |
| **Live site** | `benefactor-cc/benefactor-cc.github.io` (`production`) | Legacy Pages, serves the **built** site from `main` **root**. Custom domain `benefactor.cc` (CNAME), fronted by Cloudflare. |
| Stale/decoy | `oresoftware.github.io/benefactor.cc` | Historical project Pages target. `benefactor.cc` does **not** point here. |

Pushing a validated change to `origin/main` runs the frontend CI workflow and
publishes through the `BENEFACTOR_PAGES_TOKEN` Actions secret, a fine-grained
token scoped to the production repository with Contents read/write only. The
current token expires 2026-10-16 and must be rotated before then. `npm run
deploy` (see `scripts/deploy.sh`) is the manual recovery path. Both
paths build with `CUSTOM_DOMAIN=benefactor.cc` so output is root-based
(`base=/`) and carries `CNAME` + `.nojekyll`; guardrails reject a wrong-base
build.

Do **not** hand-edit the `production` repo — it holds generated output only;
edit source here and let CI deploy (or use the manual recovery command). Live
changes flush through Pages + Cloudflare in about a minute.
