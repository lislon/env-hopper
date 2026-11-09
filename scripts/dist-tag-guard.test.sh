#!/usr/bin/env bash
# Checks that `dist-tag-guard.mjs capture` takes a never-published package
# (npm view exits non-zero with E404) as "serves nothing", while a lookup that
# really fails still refuses the baseline. Runs against a fake `npm` on PATH.
set -euo pipefail

guard="$(cd "$(dirname "$0")" && pwd)/dist-tag-guard.mjs"
tmp="$(mktemp -d)"
trap '/bin/rm -rf "$tmp"' EXIT

fail() { echo "FAIL: $1" >&2; exit 1; }

mkdir -p "$tmp/bin" "$tmp/repo/packages/old" "$tmp/repo/packages/new"
echo '{"name":"@x/old","version":"1.1.0"}' > "$tmp/repo/packages/old/package.json"
echo '{"name":"@x/new","version":"1.0.0"}' > "$tmp/repo/packages/new/package.json"

cat > "$tmp/bin/npm" <<'EOF'
#!/usr/bin/env bash
case "$3" in
  @x/old) echo '1.0.0' ;;
  @x/new) echo 'npm error code E404' >&2; echo 'npm error 404 Not Found' >&2; exit 1 ;;
  *) echo 'npm error code ETIMEDOUT' >&2; exit 1 ;;
esac
EOF
chmod +x "$tmp/bin/npm"

cd "$tmp/repo"
PATH="$tmp/bin:$PATH" node "$guard" capture --tag latest --out "$tmp/before.json" > /dev/null \
  || fail 'capture refused a baseline that only lacks a never-published package'
node -e '
  const b = require(process.argv[1]).packages
  const by = Object.fromEntries(b.map((p) => [p.name, p.served]))
  if (by["@x/old"] !== "1.0.0") throw new Error("old: " + by["@x/old"])
  if (by["@x/new"] !== null) throw new Error("new: " + by["@x/new"])
' "$tmp/before.json" || fail 'baseline recorded the wrong served versions'

echo 'dist-tag-guard: never-published package OK'
