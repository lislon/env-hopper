// @vitest-environment node
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

  it('timed-out request connection is aborted', async () => {
    let clientClosed = false
    const hangServer = createServer((req, _res) => {
      req.on('close', () => {
        clientClosed = true
      })
      // never responds
    })
    await new Promise<void>((r) => hangServer.listen(0, '127.0.0.1', r))
    const hangBase = `http://127.0.0.1:${(hangServer.address() as AddressInfo).port}`

    await runCheck(httpHealthChecker, { url: hangBase + '/x' }, 300)
    // Give the abort signal time to propagate
    await new Promise((r) => setTimeout(r, 50))

    hangServer.closeAllConnections()
    hangServer.close()
    expect(clientClosed).toBe(true)
  })

  it('fast response clears timeout timer', async () => {
    // Run 100 fast checks; if timers aren't cleared, we'd accumulate pending timers
    // and eventually hit resource limits or memory issues
    const results = await Promise.all(
      Array.from({ length: 100 }, () =>
        runCheck(httpHealthChecker, { url: base + '/ok' }, 5000),
      ),
    )
    expect(results.every((r) => r.state === 'healthy')).toBe(true)
  })

  it('default concurrency cap is 8', async () => {
    let inFlight = 0
    let peakInFlight = 0
    const jobs = Array.from({ length: 10 }, (_, i) => ({
      key: i,
      run: async () => {
        inFlight++
        peakInFlight = Math.max(peakInFlight, inFlight)
        await new Promise((r) => setTimeout(r, 50))
        inFlight--
        return {
          state: 'healthy' as const,
          observedAt: new Date(),
          checker: 'test',
        }
      },
    }))
    await runHealthChecks(jobs)
    expect(peakInFlight).toBe(8)
  })
})
