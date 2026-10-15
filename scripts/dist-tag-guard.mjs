#!/usr/bin/env node
/**
 * Release guard: prove that a publish actually MOVED the npm dist-tag.
 *
 * Both publish paths treat "this exact version is already on the registry" as a
 * warning and exit 0 — `changeset publish` by design, and
 * `scripts/publish-oidc.mjs` deliberately, so partial-failure reruns are safe.
 * The consequence is that a release which shipped nothing reports success, while
 * the changeset that triggered it is consumed either way, so the next run has
 * nothing left to publish. That is how the stable channel stayed wedged for days
 * without a single red check.
 *
 * Usage:
 *   node scripts/dist-tag-guard.mjs capture --tag <tag> --out <file>
 *   node scripts/dist-tag-guard.mjs assert  --before <file> --mode snapshot|release
 *
 * `capture` records, for every publishable package under `packages/`, the
 * version declared in package.json and the version the registry currently
 * serves on <tag>. Run it before the publish step, while package.json still
 * describes what this run intends to ship.
 *
 * `assert` re-reads the registry and fails the job when the publish was a no-op:
 *
 *   --mode snapshot   The pre-release channel. Every push mints a fresh
 *                     timestamped version, so the tag MUST move on every run.
 *                     Requires <tag> to now serve the version currently
 *                     declared in package.json.
 *
 *   --mode release    The stable channel. A push with nothing new to publish is
 *                     legitimate, so the expectation comes from the capture: for
 *                     each package whose captured declared version was not the
 *                     one the registry served, <tag> must now serve it. Packages
 *                     that were already published stay silent.
 *                     The expectation cannot be re-read from the working tree,
 *                     because `changesets/action` rewrites package.json in place
 *                     when it opens a version PR.
 *
 * Reads are retried until a deadline, because a fresh publish takes a few
 * seconds to become visible through npm's CDN. Every individual lookup is also
 * given a hard timeout: `npm view` was measured hanging for 951s on one call out
 * of ten while its neighbours answered in under a second, and an unbounded read
 * would stall the release rather than report on it.
 *
 * Unlike `scripts/check-registry-versions.mjs` this guard is fail-CLOSED: it
 * runs on the publish path, where "cannot tell" must never be reported as
 * "shipped".
 */
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const PACKAGES_DIR = 'packages'
/** Hard cap on a single `npm view`; observed p99 is well under a second. */
const LOOKUP_TIMEOUT_MS = 15_000
const RETRY_DELAY_MS = 10_000
/**
 * Total patience for a fresh publish to clear npm's CDN. A package whose
 * packument is young — a newly added one, or one nothing downloads — has taken
 * well over 3 minutes, which failed this step while the publish itself was fine.
 */
const DEADLINE_MS = 10 * 60_000

function flag(name) {
  const i = process.argv.indexOf(name)
  return i === -1 ? undefined : process.argv[i + 1]
}

function usage(message) {
  console.error(`${message}\n
Usage:
  node scripts/dist-tag-guard.mjs capture --tag <tag> --out <file>
  node scripts/dist-tag-guard.mjs assert  --before <file> --mode snapshot|release`)
  process.exit(2)
}

/** Every publishable package under packages/, sorted by name. */
function declaredPackages() {
  const found = []
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
    found.push({ name: pkg.name, version: pkg.version })
  }
  return found.sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Ask the registry what `tag` currently points at.
 *
 * Returns `{version, error}`. `version` is null both when the tag does not exist
 * and when the lookup failed, so `error` is what tells "the registry answered,
 * and the answer is nothing" apart from "the registry never answered" — the
 * difference between a stalled release and an unreadable registry. `npm view`
 * exits 0 with empty output for a missing dist-tag.
 */
function served(name, tag) {
  try {
    const out = execFileSync(
      'npm',
      ['view', '--prefer-online', name, `dist-tags.${tag}`],
      {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
        timeout: LOOKUP_TIMEOUT_MS,
        killSignal: 'SIGKILL',
      },
    ).trim()
    return { version: out === '' ? null : out, error: null }
  } catch (e) {
    const reason =
      e.signal === 'SIGKILL'
        ? `timed out after ${LOOKUP_TIMEOUT_MS / 1000}s`
        : String(e.message || e).split('\n')[0]
    return { version: null, error: reason }
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** `served`, retried so one flaky lookup does not decide anything. */
async function servedRetrying(name, tag, attempts = 3) {
  let result
  for (let i = 1; i <= attempts; i++) {
    result = served(name, tag)
    if (!result.error) return result
    console.log(`  ${name}: lookup failed (${result.error})`)
    if (i < attempts) await sleep(RETRY_DELAY_MS)
  }
  return result
}

async function capture() {
  const tag = flag('--tag')
  const out = flag('--out')
  if (!tag || !out) usage('capture needs --tag and --out')

  const declared = declaredPackages()
  if (declared.length === 0) {
    console.error(`No publishable packages found under ${PACKAGES_DIR}/.`)
    process.exit(1)
  }

  const packages = []
  const unreadable = []
  for (const pkg of declared) {
    const result = await servedRetrying(pkg.name, tag)
    if (result.error) unreadable.push({ name: pkg.name, error: result.error })
    packages.push({ ...pkg, served: result.version })
  }

  // A baseline read from an unreachable registry would make the post-publish
  // assertion assert the wrong thing, so refuse it. Nothing has been published
  // yet at this point, so failing here leaves no half-released state.
  if (unreadable.length > 0) {
    console.error(
      '\nCould not read the registry, so there is no trustworthy baseline to\n' +
        'compare the publish against. Refusing to continue:\n',
    )
    for (const pkg of unreadable) {
      console.error(`  ${pkg.name}: ${pkg.error}`)
    }
    process.exit(1)
  }

  writeFileSync(out, `${JSON.stringify({ tag, packages }, null, 2)}\n`)
  console.log(`Captured @${tag} for ${packages.length} package(s):`)
  for (const pkg of packages) {
    console.log(
      `- ${pkg.name}: declares ${pkg.version}, @${tag} serves ${pkg.served ?? '(nothing)'}`,
    )
  }
  console.log(`\nWrote ${out}`)
}

async function assert() {
  const beforePath = flag('--before')
  const mode = flag('--mode')
  if (!beforePath) usage('assert needs --before')
  if (mode !== 'snapshot' && mode !== 'release') {
    usage('assert needs --mode snapshot or --mode release')
  }

  const before = JSON.parse(readFileSync(beforePath, 'utf8'))
  const tag = before.tag
  const publishedByAction = process.env.CHANGESETS_PUBLISHED
  if (publishedByAction) {
    console.log(`changesets/action reported published=${publishedByAction}`)
  }

  /** @type {{name: string, expect: string, was: string | null, actual?: string | null, error?: string | null}[]} */
  let expected = []
  if (mode === 'snapshot') {
    const wasByName = new Map(before.packages.map((p) => [p.name, p.served]))
    expected = declaredPackages().map((pkg) => ({
      name: pkg.name,
      expect: pkg.version,
      was: wasByName.get(pkg.name) ?? null,
    }))
    const alreadyServed = expected.filter((e) => e.expect === e.was)
    if (alreadyServed.length > 0) {
      console.error(
        `The version(s) this run built are already on @${tag}, so the publish\n` +
          'could only ever be a no-op. Every snapshot must be a new version:\n',
      )
      for (const e of alreadyServed) {
        console.error(
          `  ${e.name}: built ${e.expect}, @${tag} already served it`,
        )
      }
      process.exit(1)
    }
  } else {
    expected = before.packages
      .filter((pkg) => pkg.version !== pkg.served)
      .map((pkg) => ({
        name: pkg.name,
        expect: pkg.version,
        was: pkg.served,
      }))
    if (expected.length === 0) {
      console.log(
        `Every package already declared the version @${tag} serves, so this run\n` +
          'was not expected to publish anything. Nothing to assert.',
      )
      return
    }
  }

  console.log(`Waiting for @${tag} to serve ${expected.length} new version(s)…`)
  const pending = new Map(expected.map((e) => [e.name, e]))
  const deadline = Date.now() + DEADLINE_MS
  let attempt = 0
  while (pending.size > 0) {
    attempt++
    for (const entry of [...pending.values()]) {
      // Plain `served`, not `servedRetrying`: this loop already *is* the retry,
      // and nesting one inside the other would overrun the deadline before it
      // gets checked.
      const result = served(entry.name, tag)
      entry.actual = result.version
      entry.error = result.error
      if (entry.error) console.log(`  ${entry.name}: ${entry.error}`)
      if (entry.actual === entry.expect) {
        console.log(`✓ @${tag} ${entry.name} → ${entry.actual}`)
        pending.delete(entry.name)
      }
    }
    if (pending.size === 0) break
    // Deadline, not a fixed attempt count: each lookup is already capped by
    // LOOKUP_TIMEOUT_MS, so total patience is what needs bounding here.
    if (Date.now() + RETRY_DELAY_MS >= deadline) break
    console.log(
      `… ${pending.size} package(s) not visible yet (attempt ${attempt}); retrying in ${RETRY_DELAY_MS / 1000}s`,
    )
    await sleep(RETRY_DELAY_MS)
  }

  if (pending.size > 0) {
    // Every remaining lookup errored, so the registry never said what it serves.
    // That is a different diagnosis from "it serves the old version", and saying
    // "nothing was published" would be a guess.
    if ([...pending.values()].every((entry) => entry.error)) {
      console.error(
        `\nCANNOT TELL whether anything was published: every @${tag} lookup failed.\n` +
          'Treated as a failed release, because on the publish path "cannot tell"\n' +
          'must not be reported as "shipped". Re-run once the registry answers.\n',
      )
      for (const entry of pending.values()) {
        console.error(`  ${entry.name}: ${entry.error}`)
      }
      process.exit(1)
    }
    console.error(
      `\nNOTHING WAS PUBLISHED: the @${tag} dist-tag did not move.\n\n` +
        'The publish step exited 0 anyway — a version that is already on the\n' +
        'registry is only a warning — so this run looks green while shipping\n' +
        'nothing. Do not treat it as a release.\n',
    )
    for (const entry of pending.values()) {
      const state = entry.error
        ? `lookup failed (${entry.error})`
        : `still serves ${entry.actual ?? '(nothing)'}`
      console.error(
        `  ${entry.name}: expected @${tag} = ${entry.expect}, ${state}` +
          ` (was ${entry.was ?? '(nothing)'} before the publish)`,
      )
    }
    console.error(
      '\nUsual cause: the declared version was already published, so there was\n' +
        'no new version left to ship. Bump the declared version and re-release.',
    )
    process.exit(1)
  }

  console.log(`\n@${tag} moved for every expected package.`)
}

const command = process.argv[2]
if (command === 'capture') {
  await capture()
} else if (command === 'assert') {
  await assert()
} else {
  usage(`Unknown command: ${command ?? '(none)'}`)
}
