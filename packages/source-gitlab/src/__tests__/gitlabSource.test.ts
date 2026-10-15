// @vitest-environment node
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createGitlabSource } from '../gitlabSource'

const successDeployments = [
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
]

const failedDeployments = [
  {
    id: 10,
    ref: 'feat/test',
    sha: 'cf1',
    tag: false,
    status: 'failed',
    updated_at: '2026-01-10T00:00:00Z',
    environment: { name: 'staging' },
    deployable: {
      name: 'deploy-staging',
      pipeline: { id: 100 },
      finished_at: null as string | null,
    },
  },
]

const canceledDeployments = [
  {
    id: 11,
    ref: 'v2.0.0',
    sha: 'ct1',
    tag: true,
    status: 'canceled',
    updated_at: '2026-01-11T00:00:00Z',
    environment: { name: 'preprod' },
    deployable: {
      name: 'deploy-preprod',
      pipeline: { id: 110 },
      finished_at: '2026-01-11T01:00:00Z',
    },
  },
]

const environments = [
  {
    id: 9,
    name: 'prod',
    tier: 'production',
    external_url: null,
    state: 'available',
    last_deployment: { created_at: '2026-01-03T00:00:00Z' },
  },
  {
    id: 10,
    name: 'staging',
    tier: 'staging',
    external_url: 'https://staging.example.com',
    state: 'stopped',
    last_deployment: { created_at: '2026-01-02T00:00:00Z' },
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
    const status = url.searchParams.get('status') ?? 'success'

    let data: Array<unknown> = successDeployments
    if (status === 'failed') data = failedDeployments
    if (status === 'canceled') data = canceledDeployments

    // two pages of size 2 to exercise pagination for success deployments
    const slice = data.slice((page - 1) * 2, page * 2)
    if (page === 1 && data === successDeployments)
      res.setHeader('x-next-page', '2')
    res.end(JSON.stringify(slice))
    return
  }

  if (url.pathname === '/api/v4/projects/7/environments') {
    const states = url.searchParams.get('states')
    const filtered = states
      ? environments.filter((e) => e.state === states)
      : environments
    res.end(JSON.stringify(filtered))
    return
  }

  if (url.pathname === '/api/v4/projects/999/deployments') {
    // Infinite pagination to test maxPages bound
    const page = Number(url.searchParams.get('page') ?? '1')
    res.setHeader('x-next-page', String(page + 1))
    res.end(
      JSON.stringify([
        {
          id: page,
          ref: 'main',
          sha: `s${page}`,
          status: 'success',
          updated_at: '2026-01-01T00:00:00Z',
          environment: { name: 'test' },
          deployable: { name: 'deploy', pipeline: { id: page } },
        },
      ]),
    )
    return
  }

  if (url.pathname === '/api/v4/projects/500/deployments') {
    res.statusCode = 500
    res.end(JSON.stringify({ error: 'Internal Server Error' }))
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

  it('returns failed deployments unchanged when status=failed', async () => {
    const src = createGitlabSource({ baseUrl: base, token: 't' })
    const out = await src.latestDeployments(7, { status: 'failed' })
    expect(out).toEqual([
      {
        projectId: 7,
        environmentName: 'staging',
        ref: 'feat/test',
        sha: 'cf1',
        tag: false,
        jobName: 'deploy-staging',
        pipelineId: 100,
        status: 'failed',
        finishedAt: null,
      },
    ])
  })

  it('returns canceled deployments with tag=true unchanged when status=canceled', async () => {
    const src = createGitlabSource({ baseUrl: base, token: 't' })
    const out = await src.latestDeployments(7, { status: 'canceled' })
    expect(out).toEqual([
      {
        projectId: 7,
        environmentName: 'preprod',
        ref: 'v2.0.0',
        sha: 'ct1',
        tag: true,
        jobName: 'deploy-preprod',
        pipelineId: 110,
        status: 'canceled',
        finishedAt: '2026-01-11T01:00:00Z',
      },
    ])
  })

  it('preserves finishedAt: null for unfinished deployments', async () => {
    const src = createGitlabSource({ baseUrl: base, token: 't' })
    const out = await src.latestDeployments(7, { status: 'failed' })
    expect(out[0]?.finishedAt).toBeNull()
  })

  it('lists environments with non-available state', async () => {
    const src = createGitlabSource({ baseUrl: base, token: 't' })
    const out = await src.listEnvironments(7, { states: ['stopped'] })
    expect(out).toEqual([
      {
        projectId: 7,
        id: 10,
        name: 'staging',
        tier: 'staging',
        externalUrl: 'https://staging.example.com',
        state: 'stopped',
        lastDeployedAt: '2026-01-02T00:00:00Z',
      },
    ])
  })

  it('lists all environments when multiple states requested', async () => {
    const src = createGitlabSource({ baseUrl: base, token: 't' })
    const out = await src.listEnvironments(7, {
      states: ['available', 'stopped'],
    })
    expect(out).toHaveLength(2)
    expect(out.map((e) => e.state)).toEqual(['available', 'stopped'])
  })

  it('throws when exceeding maxPages limit', async () => {
    const src = createGitlabSource({
      baseUrl: base,
      token: 't',
      maxPages: 3,
    })
    await expect(src.latestDeployments(999)).rejects.toThrow(
      /exceeded maxPages limit of 3/,
    )
  })

  it('a non-2xx response throws with status code', async () => {
    const src = createGitlabSource({ baseUrl: base, token: 't' })
    await expect(src.latestDeployments(500)).rejects.toThrow(/500/)
  })

  it('a 404 response includes the status code in error', async () => {
    const src = createGitlabSource({ baseUrl: base, token: 't' })
    await expect(src.listReleases(404)).rejects.toThrow(/404/)
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
})
