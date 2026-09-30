// Publish all public workspace packages to npm using the npm CLI so that
// npm's OIDC "trusted publishing" flow is used (no long-lived NPM_TOKEN).
//
// Why not `pnpm publish`? pnpm 11+ regressed the spawned-`npm publish` path so
// it no longer reaches npm's OIDC trusted-publishing (see pnpm issues re:
// "spawned npm publish no longer reaches npm OIDC trusted publishing"), which
// surfaces as `npm error code ENEEDAUTH` in CI. Instead we:
//   1) `pnpm pack` each package — pnpm rewrites `workspace:*` deps to concrete
//      versions inside the tarball (npm alone cannot do this), then
//   2) `npm publish <tarball>` — the npm CLI (>=11.5.1) performs the OIDC mint.
//
// Idempotent: a package whose exact version already exists on the registry is
// skipped (EPUBLISHCONFLICT / "cannot publish over"), so partial-failure reruns
// are safe.
//
// Usage: node scripts/publish-oidc.mjs --tag <dist-tag>
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync, mkdtempSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const tag = (() => {
  const i = process.argv.indexOf('--tag')
  return i !== -1 ? process.argv[i + 1] : 'latest'
})()

const PKG_DIR = 'packages'
const pkgs = readdirSync(PKG_DIR)
  .map((d) => join(PKG_DIR, d))
  .filter((d) => {
    try {
      const p = JSON.parse(readFileSync(join(d, 'package.json'), 'utf8'))
      return p.name && p.private !== true
    } catch {
      return false
    }
  })

console.log(
  `Publishing ${pkgs.length} package(s) with tag "${tag}" via npm OIDC`,
)

const packDir = mkdtempSync(join(tmpdir(), 'oidc-pack-'))
let failed = false

for (const dir of pkgs) {
  const meta = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
  const label = `${meta.name}@${meta.version}`
  try {
    // pnpm pack resolves workspace:* -> concrete versions in the tarball
    execFileSync('pnpm', ['pack', '--pack-destination', packDir], {
      cwd: dir,
      stdio: 'inherit',
    })
  } catch (e) {
    console.error(`✗ pack failed for ${label}`)
    failed = true
    continue
  }

  // Newest tarball in packDir for this package
  const tgz = readdirSync(packDir)
    .filter((f) => f.endsWith('.tgz'))
    .map((f) => join(packDir, f))
    .sort()
    .pop()

  try {
    // npm CLI performs the OIDC trusted-publishing mint (id-token: write)
    execFileSync(
      'npm',
      ['publish', tgz, '--tag', tag, '--access', 'public', '--provenance'],
      { stdio: 'inherit' },
    )
    console.log(`✓ published ${label}`)
  } catch (e) {
    const out =
      String(e.stdout || '') + String(e.stderr || '') + String(e.message || '')
    if (
      /EPUBLISHCONFLICT|cannot publish over|previously published|409/i.test(out)
    ) {
      console.log(`↷ skip ${label} (already on registry)`)
    } else {
      console.error(`✗ publish failed for ${label}`)
      failed = true
    }
  }
}

if (failed) {
  console.error('One or more packages failed to publish.')
  process.exit(1)
}
console.log('All packages published (or already present).')
