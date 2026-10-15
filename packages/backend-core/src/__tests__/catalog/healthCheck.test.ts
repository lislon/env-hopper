import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  httpHealthChecker,
  runCheck,
  runHealthChecks,
  sanitizeUrl,
} from '../../catalog'

let base = ''
const server = createServer((req, res) => {
  if (req.method !== 'GET') {
    res.statusCode = 405
    return res.end()
  }
  if (req.url === '/ok') return res.end('{"status":"UP"}')
  if (req.url === '/wrong-body') return res.end('{"status":"DOWN"}')
  if (req.url === '/500') {
    res.statusCode = 500
    return res.end()
  }
  if (req.url === '/hang') return undefined // never answers
  res.statusCode = 404
  return res.end()
})
beforeAll(async () => {
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r))
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})
afterAll(() => {
  server.closeAllConnections()
  server.close()
})

const check = (path: string, extra = {}) =>
  runCheck(
    httpHealthChecker,
    { url: base + path, bodyIncludes: '"UP"', ...extra },
    300,
  )

describe('http health check', () => {
  it('expected status and body is healthy', async () =>
    expect((await check('/ok')).state).toBe('healthy'))
  it('body mismatch is degraded', async () =>
    expect((await check('/wrong-body')).state).toBe('degraded'))
  it('non-2xx is down', async () =>
    expect((await check('/500')).state).toBe('down'))
  it('times out as down', async () =>
    expect((await check('/hang')).state).toBe('down'))
  it('connection refused is down', async () => {
    expect(
      (await runCheck(httpHealthChecker, { url: 'http://127.0.0.1:1/x' }, 300))
        .state,
    ).toBe('down')
  })
  it('unresolvable host is unknown', async () => {
    expect(
      (
        await runCheck(
          httpHealthChecker,
          { url: 'http://does-not-resolve.invalid/' },
          2000,
        )
      ).state,
    ).toBe('unknown')
  })
  it('strips credentials', () => {
    const urlWithCreds = `https://${'user'}:${'pass'}@h.example.com/health?token=abc`
    expect(sanitizeUrl(urlWithCreds)).toBe('https://h.example.com/health')
    expect(sanitizeUrl('not a url')).toBeNull()
  })
  it('one slow check does not block the rest', async () => {
    const started = Date.now()
    const out = await runHealthChecks(
      ['/hang', '/ok', '/ok'].map((p) => ({ key: p, run: () => check(p) })),
      { concurrency: 2 },
    )
    expect(out.map((o) => o.result.state)).toEqual([
      'down',
      'healthy',
      'healthy',
    ])
    expect(Date.now() - started).toBeLessThan(1500)
  })
})
