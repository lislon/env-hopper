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
 * `--published` is the post-publish mode: every publishable package, a brand-new
 * one included, must have its exact declared version on the registry. It is
 * fail-CLOSED, because "cannot tell" after a publish must not read as "shipped".
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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** True when the registry serves exactly `name@version`; retried for CDN lag. */
async function isPublished(name, version, attempts = 6) {
  for (let i = 1; i <= attempts; i++) {
    try {
      const out = execFileSync(
        'npm',
        ['view', '--prefer-online', `${name}@${version}`, 'version'],
        {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
          timeout: LOOKUP_TIMEOUT_MS,
          killSignal: 'SIGKILL',
        },
      ).trim()
      if (out === version) return true
    } catch {
      // Not visible yet, or the lookup failed: retry either way.
    }
    if (i < attempts) await sleep(10_000)
  }
  return false
}

if (process.argv.includes('--published')) {
  const missing = []
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
    const ok = await isPublished(pkg.name, pkg.version)
    console.log(`${ok ? '✓' : '✗'} ${pkg.name}@${pkg.version}`)
    if (!ok) missing.push(`${pkg.name}@${pkg.version}`)
  }
  if (missing.length > 0) {
    console.error(
      `\nNot on the registry after publish:\n  ${missing.join('\n  ')}`,
    )
    process.exit(1)
  }
  console.log('\nEvery publishable package is on the registry.')
  process.exit(0)
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
