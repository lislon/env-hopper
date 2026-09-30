/**
 * Refuses a release that raises any package's major version unless it was asked
 * for explicitly.
 *
 * Run this AFTER `changeset version`, which is what computes the new versions.
 * A major is never a side effect worth discovering on npm: the versions
 * published from this repo are immutable, and a consumer pinning an exact
 * version has no way back once one is out.
 *
 * The bump that prompted this guard came from no changeset at all. `test-kit`
 * peer-depends on the two cores, and changesets escalates a peer-dependent to
 * major whenever its peer takes a minor — then `fixed` raised the whole group,
 * turning seven `minor` changesets into 3.0.0.
 *
 * Approval is `ALLOW_MAJOR=true`, set from the workflow's `allow_major` input.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const PACKAGES_DIR = 'packages'

const major = (version) => Number(version.split('.')[0])

const previousVersion = (dir) => {
  try {
    const shown = execFileSync(
      'git',
      ['show', `HEAD:${PACKAGES_DIR}/${dir}/package.json`],
      { encoding: 'utf8' },
    )
    return JSON.parse(shown).version
  } catch {
    // New package in this commit: nothing to compare against.
    return undefined
  }
}

const raised = []

for (const dir of readdirSync(PACKAGES_DIR)) {
  const manifestPath = join(PACKAGES_DIR, dir, 'package.json')
  let manifest
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  } catch {
    continue
  }
  if (manifest.private) {
    continue
  }
  const before = previousVersion(dir)
  if (!before) {
    continue
  }
  if (major(manifest.version) > major(before)) {
    raised.push(`${manifest.name}: ${before} -> ${manifest.version}`)
  }
}

if (raised.length === 0) {
  console.info('major-guard: no package changed major version')
  process.exit(0)
}

if (process.env.ALLOW_MAJOR === 'true') {
  console.info(`major-guard: approved major bump\n  ${raised.join('\n  ')}`)
  process.exit(0)
}

console.error(
  [
    'major-guard: this release would raise a major version:',
    ...raised.map((line) => `  ${line}`),
    '',
    'Every changeset here may well say `minor` — a peer-dependent escalates to',
    'major on its own, and `fixed` spreads that to the whole group. Check',
    '`changeset status` before assuming a changeset asked for this.',
    '',
    'To release it deliberately, run the workflow manually with allow_major=true.',
  ].join('\n'),
)
process.exit(1)
