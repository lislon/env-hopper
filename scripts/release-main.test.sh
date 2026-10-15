#!/usr/bin/env bash
# Self-check for release-main.sh against a scratch bare remote, with `pnpm`, `gh`
# and the dist-tag guard stubbed. This script is the only path to the registry, so
# what must hold is checked here: a push carrying no changeset releases nothing; a
# push carrying one publishes BEFORE it records the version; the tag and release
# trail is created from the manifests rather than from git state (the first real
# release shipped with no tags because it trusted git); and the dist-tag capture
# happens AFTER the version bump, without which the guard can never fire.
# Run: bash scripts/release-main.test.sh
set -euo pipefail

script="$(cd "$(dirname "$0")" && pwd)/release-main.sh"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

mkdir "$tmp/bin"
cat >"$tmp/bin/pnpm" <<'EOF'
#!/usr/bin/env bash
echo "pnpm $*" >> "$PNPM_LOG"
# `changeset:version` consumes the changesets and bumps the version, so the
# stub does both — the script reads the version back off disk.
if [ "$*" = "run changeset:version" ]; then
  rm -f .changeset/*.md
  for f in packages/*/package.json; do
    node -e 'const f=process.argv[1];const p=JSON.parse(require("fs").readFileSync(f,"utf8"));p.version="9.9.9";require("fs").writeFileSync(f,JSON.stringify(p))' "$f"
  done
fi
# Records what the remote looked like at publish time, so the test can prove the
# publish ran before the version commit was pushed.
if [ "$*" = "run changeset:publish" ]; then
  git ls-remote origin refs/heads/main | cut -f1 > "$PUBLISH_SAW_MAIN"
  # Deliberately creates NO tag: the real `changeset tag` did create tags and the
  # script still found none, so the script must not depend on it.
fi
EOF
chmod +x "$tmp/bin/pnpm"
cat >"$tmp/bin/guard" <<'EOF'
#!/usr/bin/env bash
echo "guard $*" >> "$GUARD_LOG"
# Records the version the tree declares at capture time, which is what decides
# whether the guard has anything to expect.
node -p 'JSON.parse(require("fs").readFileSync("packages/backend-core/package.json","utf8")).version' \
  > "$GUARD_SAW_VERSION"
EOF
chmod +x "$tmp/bin/guard"
cat >"$tmp/bin/major-guard" <<'EOF'
#!/usr/bin/env bash
echo "major-guard" >> "$PNPM_LOG"
[ -z "${REFUSE_MAJOR:-}" ] || exit 1
EOF
chmod +x "$tmp/bin/major-guard"
cat >"$tmp/bin/gh" <<'EOF'
#!/usr/bin/env bash
echo "gh $*" >> "$GH_LOG"
EOF
chmod +x "$tmp/bin/gh"
export PATH="$tmp/bin:$PATH" PNPM_LOG="$tmp/pnpm.log"
export PUBLISH_SAW_MAIN="$tmp/publish-saw-main" GH_LOG="$tmp/gh.log"
export GUARD_LOG="$tmp/guard.log" GUARD_SAW_VERSION="$tmp/guard-saw-version"
export GUARD=guard MAJOR_GUARD=major-guard

git init --quiet --bare "$tmp/remote.git"
git clone --quiet "$tmp/remote.git" "$tmp/work" 2>/dev/null
cd "$tmp/work"
git config user.email t@t && git config user.name t && git config commit.gpgsign false
mkdir -p .changeset packages/backend-core packages/shared-core packages/an-example
echo '# changesets' >.changeset/README.md
echo '{"name":"@example/backend-core","version":"1.0.0"}' >packages/backend-core/package.json
# Carries no changes of its own, so its changelog section is blank.
echo '{"name":"@example/shared-core","version":"1.0.0"}' >packages/shared-core/package.json
printf '# shared\n\n## 9.9.9\n\n## 1.0.0\n' >packages/shared-core/CHANGELOG.md
# Private: never published, so never tagged or released.
echo '{"name":"@example/an-example","version":"1.0.0","private":true}' >packages/an-example/package.json
printf '# core\n\n## 9.9.9\n\n### Patch Changes\n\n- the new thing\n\n## 1.0.0\n\n- the old thing\n' \
  >packages/backend-core/CHANGELOG.md
git add -A && git commit --quiet -m base && git push --quiet origin HEAD:main

fail() { echo "FAIL: $1"; exit 1; }
remote_main() { git ls-remote origin refs/heads/main | cut -f1; }

# No changeset: nothing is versioned, captured, published or pushed.
before="$(remote_main)"
: >"$PNPM_LOG"
bash "$script" | grep -q 'nothing to release' || fail 'no-changeset run did not bail'
[ ! -s "$PNPM_LOG" ] || fail 'no-changeset run ran pnpm'
[ ! -f "$GUARD_LOG" ] || fail 'no-changeset run took a dist-tag capture'
[ "$(remote_main)" = "$before" ] || fail 'no-changeset run pushed'

# With a changeset: version, build, publish, then record.
printf -- "---\n'core': patch\n---\n\nchange\n" >.changeset/a-change.md
git add -A && git commit --quiet -m 'feat: a change' && git push --quiet origin HEAD:main

# A refused major stops the release before anything is published or pushed,
# so the changesets survive on the branch for the approved retry.
before_refusal="$(remote_main)"
if REFUSE_MAJOR=1 bash "$script" >/dev/null 2>&1; then fail 'a refused major still released'; fi
grep -q 'major-guard' "$PNPM_LOG" || fail 'the major guard did not run'
grep -q 'changeset:publish' "$PNPM_LOG" && fail 'a refused major still published'
[ ! -f "$GUARD_LOG" ] || fail 'a refused major took a dist-tag capture'
[ "$(remote_main)" = "$before_refusal" ] || fail 'a refused major pushed'
git show HEAD:.changeset/a-change.md >/dev/null 2>&1 || fail 'a refused major consumed the changeset'
git reset --quiet --hard HEAD
: >"$PNPM_LOG"

unreleased="$(remote_main)"
bash "$script" | grep -q 'released 9.9.9' || fail 'release did not report a version'
grep -q 'run changeset:publish' "$PNPM_LOG" || fail 'nothing was published'
[ "$(remote_main)" != "$before" ] || fail 'the version commit was not pushed'
git fetch --quiet origin main
git log -1 --format=%s FETCH_HEAD | grep -q 'version packages 9.9.9' ||
  fail 'the version commit is not on main'
git log -1 --format=%s FETCH_HEAD | grep -q '\[skip ci\]' ||
  fail 'the version commit would retrigger CI'

# The publish must come before the commit-back: a recorded version the registry
# never received cannot be retried, because the changesets are already consumed.
[ "$(cat "$PUBLISH_SAW_MAIN")" = "$unreleased" ] ||
  fail 'the version commit was pushed before the publish'

# The tag must leave the runner, and the release trail must be created for it -
# nothing else in the pipeline does that any more.
git ls-remote --tags origin | grep -q 'backend-core@9.9.9' ||
  fail 'the release tag was not pushed'
git ls-remote --tags origin | grep -q 'shared-core@9.9.9' ||
  fail 'the lockstep package was not tagged'
git ls-remote --tags origin | grep -q 'an-example' && fail 'a private package was tagged'
grep -q 'release create @example/backend-core@9.9.9' "$GH_LOG" ||
  fail 'no GitHub release was created for the tag'
grep -q 'the new thing' "$GH_LOG" || fail 'release notes are not the new changelog section'
grep -q 'the old thing' "$GH_LOG" && fail 'release notes carry the whole changelog'
grep -q 'lockstep' "$GH_LOG" || fail 'a blank changelog section produced empty release notes'

# The capture must see the BUMPED version. Taken before the bump it would record
# "declared == served" for everything, so the guard would expect nothing and pass
# however the publish went — which is exactly how it ended up inert.
grep -q 'guard capture --tag latest' "$GUARD_LOG" || fail 'no dist-tag capture was taken'
[ "$(cat "$GUARD_SAW_VERSION")" = '9.9.9' ] ||
  fail 'the dist-tag capture was taken before the version bump'

echo 'release-main: all cases pass'
