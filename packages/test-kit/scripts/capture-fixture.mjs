#!/usr/bin/env node
/**
 * Capture a realistic backend fixture from a running deployment.
 *
 * Credentials are stripped in the SAME pass as the download: the raw response
 * is never written to disk, only the redacted copy. Secret-like values are
 * replaced with the literal string `REDACTED`, keeping the key present so UI
 * that renders a credentials panel still has something to render.
 *
 * Usage:
 *   EH_ORIGIN=https://<deployment-host> \
 *   EH_FIXTURE_DIR=~/somewhere/outside/this/repo \
 *   node packages/test-kit/scripts/capture-fixture.mjs
 *
 * Write the fixture OUTSIDE this repository: a real deployment's payload names
 * its own internal hosts and environments, and this repository is public.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

/** Keys whose leaf values are treated as secret. */
const SECRET_KEY =
  /pass|secret|token|api_?key|access_?key|private_?key|^username$|^user$|^login$/i

const REDACTED = 'REDACTED'

const redactionCounts = new Map()
const keyCensus = new Map()

function bump(map, key) {
  map.set(key, (map.get(key) ?? 0) + 1)
}

function redact(node, trail) {
  if (Array.isArray(node)) return node.map((v) => redact(v, `${trail}[]`))
  if (node === null || typeof node !== 'object') return node

  const out = {}
  for (const [key, value] of Object.entries(node)) {
    bump(keyCensus, key)
    const here = trail ? `${trail}.${key}` : key
    if (SECRET_KEY.test(key)) {
      if (value === null || typeof value !== 'object') {
        bump(redactionCounts, here)
        out[key] = REDACTED
        continue
      }
      if (Array.isArray(value) && value.every((v) => typeof v !== 'object')) {
        bump(redactionCounts, here)
        out[key] = value.map(() => REDACTED)
        continue
      }
    }
    out[key] = redact(value, here)
  }
  return out
}

/** tRPC answers a single query as `{result:{data}}` and a batch as an array. */
function unwrap(body) {
  const first = Array.isArray(body) ? body[0] : body
  if (first?.error) throw new Error(`tRPC error: ${first.error.message}`)
  const data = first?.result?.data
  if (data === undefined) throw new Error('no result.data in response')
  return data.json ?? data
}

async function capture(origin, procedure) {
  const res = await fetch(`${origin}/api/trpc/${procedure}`, {
    headers: { accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`${procedure}: HTTP ${res.status}`)
  const raw = await res.text()
  return { data: unwrap(JSON.parse(raw)), rawBytes: raw.length }
}

const origin = process.env.EH_ORIGIN
const dir = process.env.EH_FIXTURE_DIR
if (!origin || !dir) {
  console.error('set EH_ORIGIN and EH_FIXTURE_DIR')
  process.exit(1)
}

await mkdir(dir, { recursive: true })

const report = {}
for (const procedure of ['bootstrap', 'resourceJumps']) {
  const { data, rawBytes } = await capture(origin, procedure)
  const clean = JSON.stringify(redact(data, ''), null, 0)
  await writeFile(path.join(dir, `${procedure}.json`), clean)
  report[procedure] = { rawBytes, cleanBytes: clean.length }
}

console.log(JSON.stringify(report, null, 1))
console.log(`redacted ${redactionCounts.size} distinct key paths`)
// The census lists EVERY object key, which for a keyed map means every slug in
// it. Useful once, to eyeball for a secret-looking field the regex misses; off
// by default so a routine capture does not spill a catalog into the terminal.
if (process.env.EH_CENSUS) {
  console.log('key census:', [...keyCensus.keys()].sort().join(' '))
}
