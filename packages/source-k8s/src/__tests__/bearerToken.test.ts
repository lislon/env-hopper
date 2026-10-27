// @vitest-environment node
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { AppsV1Api, KubeConfig, Watch } from '@kubernetes/client-node'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { cachedToken, withBearerToken } from '../bearerToken'

describe('cachedToken', () => {
  it('mints once, again only shortly before expiry', async () => {
    let clock = 0
    let mints = 0
    const token = cachedToken(
      async () => ({
        token: `t${++mints}`,
        expiresAt: new Date(clock + 15 * 60_000),
      }),
      { refreshBeforeMs: 5 * 60_000, now: () => clock },
    )
    expect(await token()).toBe('t1')
    clock = 10 * 60_000 - 1
    expect(await token()).toBe('t1')
    clock = 10 * 60_000
    expect(await token()).toBe('t2')
    expect(mints).toBe(2)
  })

  it('shares one mint between concurrent callers', async () => {
    let mints = 0
    const token = cachedToken(async () => {
      mints++
      await new Promise((r) => setTimeout(r, 5))
      return { token: 't', expiresAt: new Date(Date.now() + 60 * 60_000) }
    })
    expect(await Promise.all([token(), token(), token()])).toEqual([
      't',
      't',
      't',
    ])
    expect(mints).toBe(1)
  })

  it('does not keep a failed mint', async () => {
    let fail = true
    const token = cachedToken(async () => {
      if (fail) throw new Error('no credentials')
      return { token: 'ok', expiresAt: new Date(Date.now() + 60 * 60_000) }
    })
    await expect(token()).rejects.toThrow('no credentials')
    fail = false
    expect(await token()).toBe('ok')
  })
})

describe('withBearerToken', () => {
  const seen: Array<string | undefined> = []
  const server = createServer((req, res) => {
    seen.push(req.headers.authorization)
    res.setHeader('content-type', 'application/json')
    if (req.url?.includes('watch=true')) {
      res.end(
        JSON.stringify({
          type: 'ADDED',
          object: { metadata: { name: 'a', resourceVersion: '2' } },
        }) + '\n',
      )
      return
    }
    res.end(JSON.stringify({ items: [], metadata: { resourceVersion: '1' } }))
  })
  let kc: KubeConfig

  beforeAll(async () => {
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r))
    const { port } = server.address() as AddressInfo
    kc = new KubeConfig()
    kc.loadFromOptions({
      clusters: [{ name: 'c', server: `http://127.0.0.1:${port}` }],
      users: [{ name: 'u', token: 'static' }],
      contexts: [{ name: 'x', cluster: 'c', user: 'u' }],
      currentContext: 'x',
    })
  })
  afterAll(() => new Promise<void>((r) => server.close(() => r())))

  it('sends the current token on API calls and watches, over the static one', async () => {
    let n = 0
    const authed = withBearerToken(kc, async () => `rotating-${++n}`)

    await authed.makeApiClient(AppsV1Api).listDeploymentForAllNamespaces()
    await new Promise<void>((resolve, reject) => {
      void new Watch(authed)
        .watch(
          '/apis/apps/v1/deployments',
          {},
          () => {},
          (err) => (err ? reject(err) : resolve()),
        )
        .catch(reject)
    })

    expect(seen).toEqual(['Bearer rotating-1', 'Bearer rotating-2'])
    // The original stays as it was.
    await kc.makeApiClient(AppsV1Api).listDeploymentForAllNamespaces()
    expect(seen[2]).toBe('Bearer static')
    expect(authed.getCurrentCluster()?.server).toBe(
      kc.getCurrentCluster()?.server,
    )
  })
})
