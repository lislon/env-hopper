/**
 * Serves the mock backend over real HTTP so a browser can use it.
 *
 * The msw mock backend answers fetches inside the test process; a browser's
 * fetches never reach it. This exposes the exact same `BackendData` on a port,
 * so the dev frontend gets a full backend with no database, config server or
 * workflow engine anywhere.
 *
 *   EH_FIXTURE_DIR   directory holding `bootstrap.json` + `resourceJumps.json`,
 *                    as written by `scripts/capture-fixture.mjs`. Unset, the
 *                    sample fixture is served instead.
 *   EH_MOCK_PORT     defaults to 4000, where the dev frontend looks for tRPC.
 */
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import path from 'node:path'
import process from 'node:process'
import { BackendMagazine } from '../mock-backend/magazines'
import type { BackendData } from '../mock-backend/createBackend'

const PORT = Number(process.env.EH_MOCK_PORT ?? 4000)

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
}

function loadData(): BackendData {
  const data = BackendMagazine.default().data
  const dir = process.env.EH_FIXTURE_DIR
  if (!dir) {
    console.info('[mock-backend] EH_FIXTURE_DIR unset, serving sample fixture')
    return data
  }
  for (const procedure of ['bootstrap', 'resourceJumps'] as const) {
    const file = path.join(dir, `${procedure}.json`)
    data[procedure] = JSON.parse(readFileSync(file, 'utf8'))
  }
  console.info(
    `[mock-backend] fixture: ${Object.keys(data.bootstrap.apps).length} apps,` +
      ` ${Object.keys(data.bootstrap.envs).length} envs,` +
      ` ${data.resourceJumps.resourceJumps.length} jumps`,
  )
  return data
}

const data = loadData()

createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`)

  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS).end()
    return
  }

  // Signed out. 401 is the quiet "nobody is logged in" answer; anything else
  // makes the app log an error.
  if (url.pathname.endsWith('/api/auth/session')) {
    res.writeHead(401, CORS).end()
    return
  }

  const procedures = /\/trpc\/(.+)$/.exec(url.pathname)?.[1]
  if (!procedures) {
    res.writeHead(404, CORS).end()
    return
  }

  const answers = procedures
    .split(',')
    .map((name) =>
      name in data
        ? { result: { data: data[name as keyof BackendData] } }
        : { error: { code: -32601, message: `no mock for ${name}` } },
    )
  const body = JSON.stringify(
    url.searchParams.has('batch') ? answers : answers[0],
  )
  res.writeHead(200, { ...CORS, 'content-type': 'application/json' }).end(body)
}).listen(PORT, () => {
  console.info(`[mock-backend] listening on http://localhost:${PORT}/trpc`)
})
