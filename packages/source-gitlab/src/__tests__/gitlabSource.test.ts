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
      pipeline: {
        id: 30,
        created_at: '2026-01-02T23:00:00Z',
        web_url: 'https://git.example.com/g/p/-/pipelines/30',
      },
      finished_at: '2026-01-03T00:00:00Z',
      // A manual job: someone else played it than who started the pipeline.
      user: { username: 'asmith', name: 'Al Smith' },
    },
    user: {
      username: 'jdoe',
      name: 'Jo Doe',
      avatar_url: 'https://git.example.com/a/jdoe.png',
      public_email: '',
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
    status: 'failed',
    updated_at: '2026-01-10T00:00:00Z',
    environment: { name: 'staging' },
    deployable: {
      name: 'deploy-staging',
      tag: false,
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
    status: 'canceled',
    updated_at: '2026-01-11T00:00:00Z',
    environment: { name: 'preprod' },
    deployable: {
      name: 'deploy-preprod',
      // GitLab sends the tag flag on the deploy job, not on the deployment.
      tag: true,
      commit: { committed_date: '2026-01-10T12:00:00Z' },
      pipeline: { id: 110 },
      finished_at: '2026-01-11T01:00:00Z',
    },
  },
]

const runningDeployments = [
  {
    id: 12,
    ref: 'main',
    sha: 'cr1',
    status: 'running',
    created_at: '2026-01-12T00:00:00Z',
    updated_at: '2026-01-12T00:02:00Z',
    environment: { name: 'qa' },
    deployable: {
      id: 1201,
      name: 'deploy-qa',
      pipeline: { id: 120 },
      started_at: '2026-01-12T00:01:00Z',
      web_url: 'https://git.example.com/g/p/-/jobs/1201',
    },
  },
  {
    // A job not picked up by a runner yet: no start of its own.
    id: 13,
    ref: 'main',
    sha: 'cr2',
    status: 'running',
    created_at: '2026-01-12T01:00:00Z',
    updated_at: '2026-01-12T01:00:00Z',
    environment: { name: 'dev' },
    deployable: { name: 'deploy-dev', pipeline: { id: 130 } },
  },
]

// GitLab's environment list returns no `last_deployment` (verified against a
// real instance); only the single-environment endpoint does.
const environments = [
  {
    id: 9,
    name: 'prod',
    tier: 'production',
    external_url: null,
    state: 'available',
  },
  {
    id: 10,
    name: 'staging',
    tier: 'staging',
    external_url: 'https://staging.example.com',
    state: 'stopped',
  },
]

const mergeRequest14 = {
  id: 9014,
  iid: 14,
  title: 'SHOP-7: add the basket',
  description: '## Why\nPeople asked.',
  source_branch: 'feat/SHOP-7-basket',
  target_branch: 'main',
  state: 'merged',
  web_url: 'https://git.example.com/g/p/-/merge_requests/14',
  merge_commit_sha: 'cm14',
  squash_commit_sha: null,
  merged_at: '2026-01-05T10:00:00Z',
  author: { username: 'jdoe', name: 'Jo Doe' },
  merged_by: { username: 'asmith', name: 'Al Smith' },
}

// Five tags and their releases, newest first, served two per page.
const tags8 = ['t5', 't4', 't3', 't2', 't1'].map((name, i) => ({
  name,
  commit: { id: `c-${name}`, created_at: `2026-01-0${5 - i}T00:00:00Z` },
  // Only an annotated tag has a time of its own.
  created_at: name === 't5' ? '2026-01-06T00:00:00Z' : null,
}))
const releases8 = tags8.map((t) => ({
  name: `Shop ${t.name}`,
  tag_name: t.name,
  commit: { id: t.commit.id },
  released_at: t.commit.created_at,
}))
/** The query strings each paged list of project 8 was asked with. */
const seen8: Record<string, Array<URLSearchParams>> = {}

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
    if (status === 'running') data = runningDeployments

    // two pages of size 2 to exercise pagination for success deployments
    const slice = data.slice((page - 1) * 2, page * 2)
    if (page === 1 && data === successDeployments)
      res.setHeader('x-next-page', '2')
    res.end(JSON.stringify(slice))
    return
  }

  const list8 = {
    '/api/v4/projects/8/repository/tags': tags8,
    '/api/v4/projects/8/releases': releases8,
  }[url.pathname]
  if (list8) {
    ;(seen8[url.pathname] ??= []).push(url.searchParams)
    const page = Number(url.searchParams.get('page'))
    const per = Number(url.searchParams.get('per_page'))
    if (page * per < list8.length) res.setHeader('x-next-page', `${page + 1}`)
    res.end(JSON.stringify(list8.slice((page - 1) * per, page * per)))
    return
  }

  if (url.pathname === '/api/v4/projects/7/repository/tags') {
    // GitLab's `x$` search: names ending in x.
    const end = (url.searchParams.get('search') ?? '').replace(/\$$/, '')
    res.end(
      JSON.stringify(
        [
          { name: 'release-shop-1.68.0-1234567', commit: { id: 'c9' } },
          { name: 'v1.0', commit: { id: 'c1' } },
        ].filter((t) => t.name.endsWith(end)),
      ),
    )
    return
  }
  if (url.pathname === '/api/v4/projects/7/repository/files/pom.xml/raw') {
    if (url.searchParams.get('ref') === 'c9') {
      res.end('<project><version>1.68.0</version></project>')
    } else {
      res.statusCode = 404
      res.end('{"message":"404 File Not Found"}')
    }
    return
  }
  if (url.pathname === '/api/v4/projects/7/pipelines/3553947') {
    res.end(
      JSON.stringify({
        id: 3553947,
        ref: 'develop-3497764',
        tag: true,
        sha: '6230d905aa',
        source: 'api',
        status: 'success',
        created_at: '2026-10-12T12:09:00Z',
        finished_at: '2026-10-12T12:30:00Z',
        web_url: 'https://git.example.com/g/p/-/pipelines/3553947',
        user: { username: 'jdoe', name: 'Jo Doe' },
      }),
    )
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

  if (url.pathname === '/api/v4/projects/7/merge_requests/14') {
    res.end(JSON.stringify(mergeRequest14))
    return
  }

  if (url.pathname === '/api/v4/projects/7/merge_requests/14/commits') {
    // A second page exists; only the first is read.
    res.setHeader('x-next-page', '2')
    res.end(
      JSON.stringify([
        { id: 'c14b', title: 'SHOP-9 totals', message: 'SHOP-9 totals\n' },
        { id: 'c14a', title: 'basket', message: 'basket\n\nfor SHOP-7' },
      ]),
    )
    return
  }

  if (
    url.pathname === '/api/v4/projects/7/repository/commits/cm14/merge_requests'
  ) {
    res.end(JSON.stringify([mergeRequest14]))
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
        pipelineCreatedAt: '2026-01-02T23:00:00Z',
        pipelineUrl: 'https://git.example.com/g/p/-/pipelines/30',
        committedAt: null,
        status: 'success',
        finishedAt: '2026-01-03T00:00:00Z',
        startedAt: null,
        jobUrl: null,
        user: {
          username: 'jdoe',
          name: 'Jo Doe',
          avatarUrl: 'https://git.example.com/a/jdoe.png',
          email: null,
        },
        jobUser: {
          username: 'asmith',
          name: 'Al Smith',
          avatarUrl: null,
          email: null,
        },
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
        pipelineCreatedAt: null,
        pipelineUrl: null,
        committedAt: null,
        status: 'failed',
        finishedAt: null,
        startedAt: null,
        jobUrl: null,
        user: null,
        jobUser: null,
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
        pipelineCreatedAt: null,
        pipelineUrl: null,
        committedAt: '2026-01-10T12:00:00Z',
        status: 'canceled',
        finishedAt: '2026-01-11T01:00:00Z',
        startedAt: null,
        jobUrl: null,
        user: null,
        jobUser: null,
      },
    ])
  })

  it('says when a running deploy started and links its job', async () => {
    const src = createGitlabSource({ baseUrl: base, token: 't' })
    const [qa, dev] = await src.latestDeployments(7, { status: 'running' })
    expect({ qa, dev }).toEqual({
      qa: {
        projectId: 7,
        environmentName: 'qa',
        ref: 'main',
        sha: 'cr1',
        tag: false,
        jobName: 'deploy-qa',
        pipelineId: 120,
        pipelineCreatedAt: null,
        pipelineUrl: null,
        committedAt: null,
        status: 'running',
        startedAt: '2026-01-12T00:01:00Z',
        finishedAt: null,
        jobUrl: 'https://git.example.com/g/p/-/jobs/1201',
        user: null,
        jobUser: null,
      },
      // A job no runner has started: no start, whenever the record was made.
      dev: expect.objectContaining({
        environmentName: 'dev',
        startedAt: null,
        jobUrl: null,
      }),
    })
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
        lastDeployedAt: null,
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

  it('pageLimit reads the newest pages only and keeps what they hold', async () => {
    const src = createGitlabSource({ baseUrl: base, token: 't' })
    // Project 999 pages forever, one deployment a page.
    const out = await src.latestDeployments(999, { pageLimit: 3 })
    expect(out.map((d) => d.sha)).toEqual(['s1'])
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
        lastDeployedAt: null,
      },
    ])
  })
})

describe('gitlab source deployment window', () => {
  const capture = () => {
    const urls: Array<URL> = []
    const fetch = (async (input: string) => {
      urls.push(new URL(input))
      return new Response('[]', { status: 200 })
    }) as unknown as typeof globalThis.fetch
    return { urls, fetch }
  }

  it('starts from updatedAfter, paired with order_by=updated_at', async () => {
    const { urls, fetch } = capture()
    const src = createGitlabSource({
      baseUrl: 'https://git.example',
      token: 't',
      fetch,
    })
    await src.latestDeployments(7, {
      updatedAfter: new Date('2026-04-01T00:00:00Z'),
    })
    expect(urls[0]?.searchParams.get('updated_after')).toBe(
      '2026-04-01T00:00:00.000Z',
    )
    expect(urls[0]?.searchParams.get('order_by')).toBe('updated_at')
  })

  it('reads the whole history without it', async () => {
    const { urls, fetch } = capture()
    const src = createGitlabSource({
      baseUrl: 'https://git.example',
      token: 't',
      fetch,
    })
    await src.latestDeployments(7)
    expect(urls[0]?.searchParams.has('updated_after')).toBe(false)
  })
})

describe('gitlab source single environment', () => {
  const fetchJson = (body: unknown, status = 200) =>
    (async () =>
      new Response(JSON.stringify(body), {
        status,
      })) as unknown as typeof globalThis.fetch

  it('returns the environment with its last deployment', async () => {
    const src = createGitlabSource({
      baseUrl: 'https://git.example',
      token: 't',
      fetch: fetchJson({
        id: 5,
        name: 'production/eu',
        state: 'available',
        external_url: 'https://app.example',
        last_deployment: {
          id: 9,
          ref: 'main',
          sha: 'c9',
          status: 'success',
          created_at: '2025-01-02T00:00:00Z',
          updated_at: '2025-01-02T00:10:00Z',
          deployable: {
            name: 'deploy-prod',
            pipeline: { id: 90, created_at: '2025-01-01T22:00:00Z' },
            finished_at: '2025-01-02T00:09:00Z',
          },
        },
      }),
    })
    expect(await src.getEnvironment(7, 5)).toEqual({
      environment: {
        projectId: 7,
        id: 5,
        name: 'production/eu',
        tier: null,
        externalUrl: 'https://app.example',
        state: 'available',
        lastDeployedAt: '2025-01-02T00:00:00Z',
      },
      lastDeployment: {
        projectId: 7,
        environmentName: 'production/eu',
        ref: 'main',
        sha: 'c9',
        tag: false,
        jobName: 'deploy-prod',
        pipelineId: 90,
        pipelineCreatedAt: '2025-01-01T22:00:00Z',
        pipelineUrl: null,
        committedAt: null,
        status: 'success',
        finishedAt: '2025-01-02T00:09:00Z',
        startedAt: null,
        jobUrl: null,
        user: null,
        jobUser: null,
      },
    })
  })

  it('has no last deployment for a never-deployed environment', async () => {
    const src = createGitlabSource({
      baseUrl: 'https://git.example',
      token: 't',
      fetch: fetchJson({ id: 6, name: 'staging', state: 'available' }),
    })
    expect((await src.getEnvironment(7, 6)).lastDeployment).toBeNull()
  })

  it('names the status when GitLab refuses', async () => {
    const src = createGitlabSource({
      baseUrl: 'https://git.example',
      token: 't',
      fetch: fetchJson({}, 404),
    })
    await expect(src.getEnvironment(7, 6)).rejects.toThrow(
      'GitLab /projects/7/environments/6: 404',
    )
  })

  describe('merge requests', () => {
    const src = () => createGitlabSource({ baseUrl: base, token: 't0k' })
    const record14 = {
      projectId: 7,
      iid: 14,
      title: 'SHOP-7: add the basket',
      description: '## Why\nPeople asked.',
      sourceBranch: 'feat/SHOP-7-basket',
      targetBranch: 'main',
      state: 'merged',
      webUrl: 'https://git.example.com/g/p/-/merge_requests/14',
      mergeCommitSha: 'cm14',
      squashCommitSha: null,
      mergedAt: '2026-01-05T10:00:00Z',
      author: 'jdoe',
      mergedBy: 'asmith',
    }

    it('merge requests carry mergedAt, author and mergedBy', async () => {
      const { mergedAt, author, mergedBy } = (await src().getMergeRequest(
        7,
        14,
      ))!
      expect({ mergedAt, author, mergedBy }).toEqual({
        mergedAt: '2026-01-05T10:00:00Z',
        author: 'jdoe',
        mergedBy: 'asmith',
      })
    })

    it('reads one merge request; one GitLab does not know is null', async () => {
      expect({
        known: await src().getMergeRequest(7, 14),
        unknown: await src().getMergeRequest(7, 15),
      }).toEqual({ known: record14, unknown: null })
    })

    it("reads a merge request's commits, the first page only", async () => {
      expect(await src().mergeRequestCommits(7, 14)).toEqual([
        { sha: 'c14b', message: 'SHOP-9 totals\n' },
        { sha: 'c14a', message: 'basket\n\nfor SHOP-7' },
      ])
    })

    it('reads the merge requests a commit belongs to', async () => {
      expect({
        merged: await src().commitMergeRequests(7, 'cm14'),
        pushedDirectly: await src().commitMergeRequests(7, 'c99'),
      }).toEqual({ merged: [record14], pushedDirectly: [] })
    })
  })
})

describe('gitlab source pipeline', () => {
  it('describes one pipeline by id: ref, commit, whether the ref is a tag, and what started it', async () => {
    const src = createGitlabSource({ baseUrl: base, token: 't' })
    expect({
      found: await src.getPipeline(7, 3553947),
      missing: await src.getPipeline(7, 1),
    }).toEqual({
      found: {
        projectId: 7,
        id: 3553947,
        ref: 'develop-3497764',
        tag: true,
        sha: '6230d905aa',
        source: 'api',
        status: 'success',
        createdAt: '2026-10-12T12:09:00Z',
        finishedAt: '2026-10-12T12:30:00Z',
        webUrl: 'https://git.example.com/g/p/-/pipelines/3553947',
        user: 'jdoe',
      },
      missing: null,
    })
  })

  it('getPipeline carries status, finishedAt and user', async () => {
    const src = createGitlabSource({ baseUrl: base, token: 't' })
    const { status, finishedAt, user } = (await src.getPipeline(7, 3553947))!
    expect({ status, finishedAt, user }).toEqual({
      status: 'success',
      finishedAt: '2026-10-12T12:30:00Z',
      user: 'jdoe',
    })
  })

  it("finds tags by GitLab's search and reads a file at a commit, null where it is not", async () => {
    const src = createGitlabSource({ baseUrl: base, token: 't' })

    expect({
      tags: await src.searchTags(7, '1234567$'),
      file: await src.rawFile(7, 'pom.xml', 'c9'),
      missing: await src.rawFile(7, 'pom.xml', 'c1'),
    }).toEqual({
      tags: [{ name: 'release-shop-1.68.0-1234567', commitSha: 'c9' }],
      file: '<project><version>1.68.0</version></project>',
      missing: null,
    })
  })
})

describe('gitlab source incremental tag and release lists', () => {
  const src = () =>
    createGitlabSource({ baseUrl: base, token: 't', perPage: 2 })
  const tagsPath = '/api/v4/projects/8/repository/tags'
  const releasesPath = '/api/v4/projects/8/releases'
  const pagesRead = (path: string) =>
    (seen8[path] ?? []).map((q) => q.get('page'))

  it('listTags stops before the stored name, newest first', async () => {
    seen8[tagsPath] = []
    const tags = await src().listTags(8, { stopAt: 't3' })

    expect({ tags, pages: pagesRead(tagsPath) }).toEqual({
      tags: [
        {
          projectId: 8,
          name: 't5',
          commitSha: 'c-t5',
          createdAt: '2026-01-06T00:00:00Z',
        },
        {
          projectId: 8,
          name: 't4',
          commitSha: 'c-t4',
          createdAt: '2026-01-04T00:00:00Z',
        },
      ],
      pages: ['1', '2'],
    })
    expect(seen8[tagsPath][0]!.get('order_by')).toBe('updated')
    expect(seen8[tagsPath][0]!.get('sort')).toBe('desc')
  })

  it('listTags reads at most maxPages without stopAt', async () => {
    seen8[tagsPath] = []
    const tags = await src().listTags(8, { maxPages: 2 })

    expect({
      names: tags.map((t) => t.name),
      pages: pagesRead(tagsPath),
    }).toEqual({ names: ['t5', 't4', 't3', 't2'], pages: ['1', '2'] })
  })

  it('listReleases with stopAt pages by released_at until the stored tag', async () => {
    seen8[releasesPath] = []
    const releases = await src().listReleases(8, { stopAt: 't2' })

    expect({
      tags: releases.map((r) => r.tagName),
      pages: pagesRead(releasesPath),
      order: seen8[releasesPath].map(
        (q) => `${q.get('order_by')} ${q.get('sort')}`,
      ),
    }).toEqual({
      tags: ['t5', 't4', 't3'],
      pages: ['1', '2'],
      order: ['released_at desc', 'released_at desc'],
    })
  })
})
