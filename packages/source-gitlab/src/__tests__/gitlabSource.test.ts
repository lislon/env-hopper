// @vitest-environment node
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createGitlabSource } from '../gitlabSource'

const deployments = [
  {
    id: 3,
    ref: 'main',
    sha: 'c3',
    status: 'success',
    updated_at: '2026-01-03T00:00:00Z',
    environment: { name: 'prod' },
    deployable: {
      name: 'deploy-prod',
      pipeline: { id: 30 },
      finished_at: '2026-01-03T00:00:00Z',
    },
  },
  {
    id: 2,
    ref: 'main',
    sha: 'c2',
    status: 'success',
    updated_at: '2026-01-02T00:00:00Z',
    environment: { name: 'prod' },
    deployable: {
      name: 'migrate-prod',
      pipeline: { id: 20 },
      finished_at: '2026-01-02T00:00:00Z',
    },
  },
  {
    id: 1,
    ref: 'main',
    sha: 'c1',
    status: 'failed',
    updated_at: '2026-01-01T00:00:00Z',
    environment: { name: 'dev' },
    deployable: { name: 'deploy-dev', pipeline: { id: 10 }, finished_at: null },
  },
]
let base = ''
let sawToken = ''
const server = createServer((req, res) => {
  sawToken = String(req.headers['private-token'] ?? '')
  const url = new URL(req.url!, 'http://x')
  res.setHeader('content-type', 'application/json')
  if (url.pathname === '/api/v4/projects/7/deployments') {
    const page = Number(url.searchParams.get('page') ?? '1')
    // two pages of size 2 to exercise pagination
    const slice = deployments.slice((page - 1) * 2, page * 2)
    if (page === 1) res.setHeader('x-next-page', '2')
    res.end(JSON.stringify(slice))
    return
  }
  if (url.pathname === '/api/v4/projects/7/environments') {
    res.end(
      JSON.stringify([
        {
          id: 9,
          name: 'prod',
          tier: 'production',
          external_url: null,
          state: 'available',
          last_deployment: { created_at: '2026-01-03T00:00:00Z' },
        },
      ]),
    )
    return
  }
  res.statusCode = 404
  res.end('[]')
})
beforeAll(async () => {
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r))
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})
afterAll(() => server.close())

describe('gitlab source', () => {
  it('returns the latest successful deploy per environment, by the caller job rule', async () => {
    const src = createGitlabSource({ baseUrl: base, token: 't0k', perPage: 2 })
    const out = await src.latestDeployments(7, {
      jobNames: (n) => n.startsWith('deploy'),
    })
    expect(out).toEqual([
      {
        projectId: 7,
        environmentName: 'prod',
        ref: 'main',
        sha: 'c3',
        tag: false,
        jobName: 'deploy-prod',
        pipelineId: 30,
        status: 'success',
        finishedAt: '2026-01-03T00:00:00Z',
      },
    ])
    expect(sawToken).toBe('t0k')
  })
  it('lists environments with tier and external url', async () => {
    const src = createGitlabSource({ baseUrl: base, token: 't' })
    expect(await src.listEnvironments(7)).toEqual([
      {
        projectId: 7,
        id: 9,
        name: 'prod',
        tier: 'production',
        externalUrl: null,
        state: 'available',
        lastDeployedAt: '2026-01-03T00:00:00Z',
      },
    ])
  })
  it('a non-2xx response throws, so a caller never mistakes failure for "nothing deployed"', async () => {
    const src = createGitlabSource({ baseUrl: base, token: 't' })
    await expect(src.listReleases(404)).rejects.toThrow(/404/)
  })
})
