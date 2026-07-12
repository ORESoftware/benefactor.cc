#!/usr/bin/env bash
#
# Deploy benefactor.cc to PRODUCTION (the live site).
#
# IMPORTANT — deploy topology (read before touching this):
#   * SOURCE repo (this one):      ORESoftware/benefactor.cc   (Astro source)
#   * LIVE repo (deploy target):   benefactor-cc/benefactor-cc.github.io
#         - legacy GitHub Pages, serves the built site from the `main` branch ROOT
#         - custom domain: benefactor.cc  (CNAME) -> fronted by Cloudflare
#   * This repo's OWN Pages (oresoftware.github.io/benefactor.cc via the
#     `deploy.yml` workflow) is a STALE project-pages build. benefactor.cc does
#     NOT point at it. Pushing to `origin` alone does NOT update the live site.
#
# The only correct way to ship the live site is this script (or the same steps):
# build with CUSTOM_DOMAIN so the output is root-based (base=/) and carries the
# CNAME, then publish dist/ to the live repo's main branch.
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROD_REMOTE="git@github.com:benefactor-cc/benefactor-cc.github.io.git"
WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

cd "$REPO_ROOT"

echo "==> Building for the root custom domain (base=/, emits CNAME + .nojekyll)"
CUSTOM_DOMAIN=benefactor.cc npm run build

echo "==> Guardrails: refuse to publish a build that would break the live domain"
grep -q '^benefactor\.cc$' dist/CNAME \
  || { echo "ERROR: dist/CNAME is missing or not 'benefactor.cc'"; exit 1; }
test -f dist/.nojekyll \
  || { echo "ERROR: dist/.nojekyll missing (Pages would ignore _astro dirs)"; exit 1; }
if grep -q '/benefactor\.cc/_astro/' dist/index.html; then
  echo "ERROR: dist was built with the project base '/benefactor.cc'."
  echo "       Set CUSTOM_DOMAIN=benefactor.cc so the build is root-based."
  exit 1
fi
grep -q '/_astro/' dist/index.html \
  || { echo "ERROR: dist/index.html has no /_astro/ asset refs — build looks wrong"; exit 1; }

echo "==> Publishing dist/ to $PROD_REMOTE (main)"
git clone --depth 1 "$PROD_REMOTE" "$WORKDIR" >/dev/null 2>&1
rsync -a --delete --exclude='.git' dist/ "$WORKDIR"/
cd "$WORKDIR"
git add -A
if git diff --cached --quiet; then
  echo "==> No changes to deploy. Live site already matches this build."
  exit 0
fi
SRC_SHA="$(git -C "$REPO_ROOT" rev-parse --short HEAD 2>/dev/null || echo unknown)"
git commit -q -m "deploy: publish build from ORESoftware/benefactor.cc @ ${SRC_SHA}"
git push origin HEAD:main
echo "==> Deployed. Live at https://benefactor.cc (allow ~1 min for Pages to flush)."
