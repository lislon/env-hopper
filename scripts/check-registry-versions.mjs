#!/usr/bin/env node
/**
 * Guardrail: every publishable package's declared version must be >= the version
 * the registry already serves under the `latest` tag.
 *
 * Why: if the branch declares a version that is already published, `changeset
 * publish` cannot republish it, so the release silently delivers nothing while
 * every check stays green. That failure mode wedged the stable channel for days
 * (#67) and was only noticed by comparing package.json against npm by hand.
 *
 * A declared version *equal* to `latest` is normal — that is the state right
 * after a release. Only "behind the registry" is an error.
 *
 * Registry lookups fail open (network/registry hiccups must not block PRs), but
 * a genuine version regression fails the job. Runs on pull requests and on
 * pushes to the stable branch, so a direct push is covered too.
 *
 * SCOPE LIMIT — this cannot detect a stalled pre-release channel. It compares
 * against the `latest` tag only and skips any declared pre-release outright, so
 * an `@alpha` that has not moved in months looks clean here. Do not rely on it
 * for that; whether a publish actually moved a dist-tag is proved by
 * `scripts/dist-tag-guard.mjs`, which runs on both publish paths.
 */
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const PACKAGES_DIR = 'packages'
/**
 * Hard cap on a single `npm view`. Observed p99 is well under a second, but one
 * call in ten was measured hanging for 951s while its neighbours answered
 * immediately. A timeout lands in the same `catch` as any other lookup failure,
 * so the fail-open behaviour is unchanged — it just cannot stall a job for a
 * quarter of an hour.
 */
const LOOKUP_TIMEOUT_MS = 15_000

/** Semver compare for the plain `x.y.z` releases the `latest` tag carries. */
function compare(a, b) {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) - (pb[i] ?? 0)
  }
  return 0
}

function publishedLatest(name) {
  try {
    return execFileSync('npm', ['view', `${name}@latest`, 'version'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: LOOKUP_TIMEOUT_MS,
      killSignal: 'SIGKILL',
    }).trim()
  } catch {
    // Never published yet, or the registry is unreachable.
    return null
  }
}

const problems = []

for (const dir of readdirSync(PACKAGES_DIR, { withFileTypes: true })) {
  if (!dir.isDirectory()) continue
  let pkg
  try {
    pkg = JSON.parse(
      readFileSync(join(PACKAGES_DIR, dir.name, 'package.json'), 'utf8'),
    )
  } catch {
    continue
  }
  if (pkg.private || !pkg.name || !pkg.version) continue

  const latest = publishedLatest(pkg.name)
  if (!latest) {
    console.log(`- ${pkg.name}: ${pkg.version} (no published latest — skipped)`)
    continue
  }
  // A pre-release version (0.4.0-alpha-…) lives on its own tag and never
  // competes with `latest`, so it is out of scope for this check.
  if (pkg.version.includes('-')) {
    console.log(`- ${pkg.name}: ${pkg.version} (pre-release — skipped)`)
    continue
  }
  const delta = compare(pkg.version, latest)
  console.log(
    `- ${pkg.name}: declared ${pkg.version}, registry latest ${latest}` +
      (delta < 0 ? '  <-- BEHIND' : ''),
  )
  if (delta < 0) problems.push({ name: pkg.name, version: pkg.version, latest })
}

if (problems.length > 0) {
  console.error(
    '\nThese packages declare a version the registry has already published, so a\n' +
      'release from this branch would publish nothing:\n',
  )
  for (const p of problems) {
    console.error(`  ${p.name}: ${p.version} <= published ${p.latest}`)
  }
  console.error(
    '\nBump each declared version above the published one before releasing.',
  )
  process.exit(1)
}

console.log('\nAll publishable versions are at or ahead of the registry.')
