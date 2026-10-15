#!/usr/bin/env bash
# Release the stable channel from `main` in a single merge.
#
# The former flow took two: changesets opened a "version packages" PR, and only
# merging *that* published. A release could therefore sit one merge short of the
# registry with every check green, which is the failure this removes. The
# pre-release branch already published in one push; now the stable channel does
# too, so neither needs a human between a merge and the registry.
#
# Order matters: publish first, then record. A published version is immutable and
# the dist-tag guard proves it moved; if the commit-back then fails, re-pushing
# the version commit is a safe retry. The reverse order would leave a recorded
# version the registry never received, and the consumed changesets would be gone,
# so nothing would publish it on a retry.
#
# Usage: release-main.sh   (run from a checkout of `main`, with GITHUB_TOKEN set)
set -euo pipefail

if [ -z "$(ls -A .changeset/*.md 2>/dev/null | grep -v README || true)" ]; then
  echo 'No changesets — nothing to release.'
  echo 'published=false' >>"${GITHUB_OUTPUT:-/dev/null}"
  exit 0
fi

# Bumps every publishable version, writes the CHANGELOGs, deletes the consumed
# changesets and relocks.
pnpm run changeset:version

# AFTER versioning: the guard compares the bumped versions against HEAD, because
# the bump is what reveals a major no changeset asked for (a peer-dependent
# escalated, then raised for the whole `fixed` group). Nothing is published or
# pushed yet, so a refusal leaves the changesets on the branch for the approved
# retry. Approval is ALLOW_MAJOR=true.
${MAJOR_GUARD:-node scripts/assert-approved-major.mjs}

# AFTER the bump, not before: the guard compares what the tree declares against
# what the registry serves, so a capture taken before versioning sees "declared ==
# served" for everything, finds nothing to expect, and passes no matter what the
# publish does. That is how it ended up inert the first time this ran.
${GUARD:-node scripts/dist-tag-guard.mjs} capture --tag latest \
  --out "${RUNNER_TEMP:-/tmp}/dist-tags-before.json"

pnpm run build:all
# Publishes each package with npm OIDC.
pnpm run changeset:publish

# The tag list comes from the manifests, not from git. `changeset tag` reports
# "New tag: …" for each package, but relying on that left the first real release
# with no tags and no releases at all — so this derives the names from what was
# just published and tags the commit itself.
tags="$(node -e '
  const fs = require("fs")
  for (const dir of fs.readdirSync("packages")) {
    const path = `packages/${dir}/package.json`
    if (!fs.existsSync(path)) continue
    const pkg = JSON.parse(fs.readFileSync(path, "utf8"))
    if (pkg.private || !pkg.name || !pkg.version) continue
    console.log(`${pkg.name}@${pkg.version}`)
  }
')"

version="$(node -p "require('./packages/backend-core/package.json').version")"

git config user.name 'github-actions[bot]'
git config user.email '41898282+github-actions[bot]@users.noreply.github.com'
git add -A
# [skip ci]: this push is the record of a release that already happened, not a
# new change to release.
git commit -m "chore: version packages ${version} [skip ci]"
git push origin "HEAD:${1:-main}"

# Tag the version commit, then push the tags by name: they are lightweight, so
# `--follow-tags` would leave every one of them behind in the runner.
for tag in ${tags}; do
  git tag -f "${tag}"
done
# shellcheck disable=SC2086 # one argument per tag is the point
git push origin ${tags}

# One GitHub release per tag, with that package's new CHANGELOG section as the
# body. `changesets/action` used to do this; it is the only part of the release
# trail that does not fall out of the publish itself, so it has to be explicit.
for tag in ${tags}; do
  # @scope/name@1.2.3 -> packages/<name>
  pkg="${tag%@*}"
  changelog="packages/${pkg#*/}/CHANGELOG.md"
  notes="$(awk '/^## /{if (seen++) exit; next} seen' "${changelog}" 2>/dev/null || true)"
  # A lockstep package's section is blank — it carries no changes of its own — and
  # `--notes ""` is rejected, so say that instead of shipping an empty release.
  if [ -z "$(printf '%s' "${notes}" | tr -d '[:space:]')" ]; then
    notes="Released ${version} in lockstep with the other core packages; no changes of its own."
  fi
  gh release create "${tag}" --title "${tag}" --notes "${notes}" ||
    echo "warning: could not create a release for ${tag}" >&2
done

echo "published=true" >>"${GITHUB_OUTPUT:-/dev/null}"
echo "released ${version}"
