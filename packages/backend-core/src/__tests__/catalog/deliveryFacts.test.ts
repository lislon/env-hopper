// @vitest-environment node
/** Delivery facts (ADR 0007): written once by an Entity Provider, never changed by a sync. */
import { beforeEach, describe, expect, it } from 'vitest'
import { createCatalog } from '../../catalog'
import type { DeliveryFactsInput } from '../../catalog'
import {
  getTestCatalogClient,
  resetCatalog,
  withOwnTransactions,
} from '../../testing'

const prisma = getTestCatalogClient()
const catalog = prisma ? withOwnTransactions(createCatalog(prisma)) : undefined

const repo = 'gitlab:1'
const build10 = {
  repositoryKey: repo,
  buildId: '10',
  sha: 'c1',
  ref: 'main',
  refType: 'branch' as const,
}

beforeEach(async () => {
  if (prisma) await resetCatalog(prisma)
})

async function factCounts() {
  const [repositories, commits, builds, tags, changeRequests, links, items] =
    await Promise.all([
      prisma!.catalogRepository.count(),
      prisma!.catalogCommit.count(),
      prisma!.catalogBuild.count(),
      prisma!.catalogTag.count(),
      prisma!.catalogChangeRequest.count(),
      prisma!.catalogChangeRequestWorkItem.count(),
      prisma!.catalogWorkItem.count(),
    ])
  const declared = await prisma!.catalogDeclaredVersion.count()
  return {
    repositories,
    commits,
    builds,
    tags,
    changeRequests,
    links,
    items,
    declared,
  }
}

describe.skipIf(!prisma)('delivery facts', () => {
  it('writeFacts twice with the same rows changes nothing', async () => {
    const facts: DeliveryFactsInput = {
      repositories: [{ key: repo }],
      builds: [build10],
      tags: [{ repositoryKey: repo, name: 'v1.2.0', sha: 'c1' }],
    }
    await catalog!.writeFacts(facts)
    await catalog!.writeFacts(facts)

    expect(await prisma!.catalogBuild.count()).toBe(1)
    expect(await prisma!.catalogTag.count()).toBe(1)
  })

  it('a stored value is never changed, a missing one is filled once', async () => {
    const finishedAt = new Date('2026-01-01T10:00:00Z')
    await catalog!.writeFacts({ builds: [build10] })
    await catalog!.writeFacts({
      builds: [{ ...build10, ref: 'other', outcome: 'succeeded', finishedAt }],
    })
    await catalog!.writeFacts({
      builds: [{ ...build10, outcome: 'failed', finishedAt: new Date() }],
    })

    const { builds } = await catalog!.readFacts({
      builds: [{ repositoryKey: repo, buildId: '10' }],
    })
    expect(builds).toEqual([{ ...build10, outcome: 'succeeded', finishedAt }])
  })

  it('reads a build with its commit, tags at it or named after it, its change request and declared versions', async () => {
    await catalog!.writeFacts({
      repositories: [{ key: repo }],
      commits: [{ repositoryKey: repo, sha: 'c1', changeRequestNumber: '14' }],
      builds: [build10],
      tags: [
        {
          repositoryKey: repo,
          name: 'v1.2.0',
          sha: 'c1',
          releaseTitle: 'Shop 1.2.0',
        },
        { repositoryKey: repo, name: 'main-10', sha: 'c9' },
        { repositoryKey: repo, name: 'other', sha: 'c2' },
      ],
      changeRequests: [
        {
          repositoryKey: repo,
          number: '14',
          title: 'Add the basket',
          workItems: ['jira:SHOP-7', 'jira:SHOP-3'],
        },
      ],
      declaredVersions: [
        { repositoryKey: repo, sha: 'c1', type: 'maven', value: '1.2.0' },
      ],
    })

    const view = await catalog!.readFacts({
      builds: [{ repositoryKey: repo, buildId: '10' }],
    })

    expect(view).toEqual({
      commits: [{ repositoryKey: repo, sha: 'c1', changeRequestNumber: '14' }],
      builds: [build10],
      tags: [
        { repositoryKey: repo, name: 'main-10', sha: 'c9' },
        {
          repositoryKey: repo,
          name: 'v1.2.0',
          sha: 'c1',
          releaseTitle: 'Shop 1.2.0',
        },
      ],
      changeRequests: [
        {
          repositoryKey: repo,
          number: '14',
          title: 'Add the basket',
          workItems: ['jira:SHOP-7', 'jira:SHOP-3'],
        },
      ],
      declaredVersions: [
        { repositoryKey: repo, sha: 'c1', type: 'maven', value: '1.2.0' },
      ],
    })
  })

  it('a declared version may be null: the commit declares none', async () => {
    await catalog!.writeFacts({
      declaredVersions: [
        { repositoryKey: repo, sha: 'c1', type: 'maven', value: null },
      ],
    })

    const { declaredVersions } = await catalog!.readFacts({
      commits: [{ repositoryKey: repo, sha: 'c1' }],
    })
    expect(declaredVersions).toEqual([
      { repositoryKey: repo, sha: 'c1', type: 'maven', value: null },
    ])
  })

  it('work items are snapshots: the newer read replaces title and readAt', async () => {
    const later = new Date('2026-01-02T00:00:00Z')
    await catalog!.writeFacts({
      workItems: [
        { key: 'jira:SHOP-7', title: 'Basket', readAt: new Date('2026-01-01') },
      ],
    })
    await catalog!.writeFacts({
      workItems: [{ key: 'jira:SHOP-7', title: 'Checkout', readAt: later }],
    })

    expect(await prisma!.catalogWorkItem.findMany()).toEqual([
      {
        key: 'jira:SHOP-7',
        title: 'Checkout',
        type: null,
        url: null,
        readAt: later,
      },
    ])
  })

  it('newestTagName stops incremental lists', async () => {
    const tag = (name: string, at: string, releaseTitle?: string) => ({
      repositoryKey: repo,
      name,
      sha: `sha-${name}`,
      createdAt: new Date(at),
      releaseTitle,
    })
    await catalog!.writeFacts({
      tags: [
        tag('t1', '2026-01-01'),
        tag('t2', '2026-01-02', 'Shop t2'),
        tag('t3', '2026-01-03'),
        { repositoryKey: 'gitlab:2', name: 'elsewhere', sha: 'x' },
      ],
    })

    expect(await catalog!.newestTagName(repo)).toBe('t3')
    expect(await catalog!.newestTagName(repo, { released: true })).toBe('t2')
    expect(await catalog!.newestTagName('gitlab:3')).toBeNull()
  })

  it('a sync never deletes facts', async () => {
    await catalog!.writeFacts({
      repositories: [{ key: repo }],
      commits: [{ repositoryKey: repo, sha: 'c1' }],
      builds: [build10],
      tags: [{ repositoryKey: repo, name: 'v1', sha: 'c1' }],
      changeRequests: [
        { repositoryKey: repo, number: '14', title: 't', workItems: ['a'] },
      ],
      declaredVersions: [
        { repositoryKey: repo, sha: 'c1', type: 'npm', value: '1' },
      ],
      workItems: [{ key: 'a', readAt: new Date() }],
    })
    const before = await factCounts()

    await catalog!.syncArtifacts('ci', [])

    expect(await factCounts()).toEqual(before)
    expect(before).toEqual({
      repositories: 1,
      commits: 1,
      builds: 1,
      tags: 1,
      changeRequests: 1,
      links: 1,
      items: 1,
      declared: 1,
    })
  })
})
