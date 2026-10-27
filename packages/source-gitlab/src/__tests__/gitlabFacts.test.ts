import { describe, expect, it } from 'vitest'
import {
  buildFact,
  changeRequestFact,
  gitlabRepositoryKey,
  tagFacts,
} from '../gitlabFacts'
import type {
  GitlabMergeRequestRecord,
  GitlabPipelineRecord,
} from '../gitlabTypes'

const pipeline: GitlabPipelineRecord = {
  projectId: 42,
  id: 10,
  ref: 'main',
  tag: false,
  sha: 'c1',
  source: 'push',
  status: 'success',
  createdAt: '2026-01-01T09:00:00Z',
  finishedAt: '2026-01-01T10:00:00Z',
  webUrl: 'https://git.example.com/g/p/-/pipelines/10',
  user: 'jdoe',
}

describe('gitlab delivery facts', () => {
  it('names a repository by its project id', () => {
    expect(gitlabRepositoryKey(42)).toBe('gitlab:42')
  })

  it('a finished branch pipeline is a Build with its outcome', () => {
    expect(buildFact(pipeline)).toEqual({
      repositoryKey: 'gitlab:42',
      buildId: '10',
      sha: 'c1',
      ref: 'main',
      refType: 'branch',
      trigger: 'push',
      outcome: 'succeeded',
      finishedAt: new Date('2026-01-01T10:00:00Z'),
      url: 'https://git.example.com/g/p/-/pipelines/10',
      triggeredBy: 'jdoe',
    })
  })

  it('a merge request pipeline is a change-request Build; a running one has no outcome and no finishedAt', () => {
    expect(
      buildFact({
        ...pipeline,
        ref: 'refs/merge-requests/14/head',
        source: 'merge_request_event',
        status: 'running',
        finishedAt: null,
        webUrl: null,
        user: null,
      }),
    ).toEqual({
      repositoryKey: 'gitlab:42',
      buildId: '10',
      sha: 'c1',
      ref: 'refs/merge-requests/14/head',
      refType: 'change-request',
      trigger: 'merge_request_event',
    })
  })

  it('a tag pipeline is a tag Build; failed and canceled are outcomes', () => {
    expect([
      buildFact({ ...pipeline, ref: 'v1.2.0', tag: true, status: 'failed' }),
      buildFact({ ...pipeline, status: 'canceled', finishedAt: null }),
    ]).toEqual([
      {
        repositoryKey: 'gitlab:42',
        buildId: '10',
        sha: 'c1',
        ref: 'v1.2.0',
        refType: 'tag',
        trigger: 'push',
        outcome: 'failed',
        finishedAt: new Date('2026-01-01T10:00:00Z'),
        url: 'https://git.example.com/g/p/-/pipelines/10',
        triggeredBy: 'jdoe',
      },
      {
        repositoryKey: 'gitlab:42',
        buildId: '10',
        sha: 'c1',
        ref: 'main',
        refType: 'branch',
        trigger: 'push',
        outcome: 'canceled',
        url: 'https://git.example.com/g/p/-/pipelines/10',
        triggeredBy: 'jdoe',
      },
    ])
  })

  it('a tag takes its release title; a release of a tag not listed is a tag of its own', () => {
    const release = (
      tagName: string,
      name: string,
      commitSha: string | null,
    ) => ({
      projectId: 42,
      name,
      tagName,
      commitSha,
      author: 'jdoe',
      releasedAt: '2026-01-02T00:00:00Z',
    })
    expect(
      tagFacts(
        42,
        [
          {
            projectId: 42,
            name: 'v1.2.0',
            commitSha: 'c1',
            createdAt: '2026-01-01T00:00:00Z',
          },
          { projectId: 42, name: 'main-10', commitSha: 'c1', createdAt: null },
        ],
        [
          release('v1.2.0', 'Shop 1.2.0', 'c1'),
          release('v1.1.0', 'Shop 1.1.0', 'c0'),
          release('v1.0.0', 'Shop 1.0.0', null),
        ],
      ),
    ).toEqual([
      {
        repositoryKey: 'gitlab:42',
        name: 'v1.2.0',
        sha: 'c1',
        releaseTitle: 'Shop 1.2.0',
        createdAt: new Date('2026-01-01T00:00:00Z'),
      },
      { repositoryKey: 'gitlab:42', name: 'main-10', sha: 'c1' },
      {
        repositoryKey: 'gitlab:42',
        name: 'v1.1.0',
        sha: 'c0',
        releaseTitle: 'Shop 1.1.0',
        // No tag time known: the release's, so newestTagName still orders it.
        createdAt: new Date('2026-01-02T00:00:00Z'),
      },
    ])
  })

  it('a merge request is a Change Request, merged by its merge commit, else its squash commit', () => {
    const mr: GitlabMergeRequestRecord = {
      projectId: 42,
      iid: 14,
      title: 'SHOP-7: add the basket',
      description: '',
      sourceBranch: 'feat/SHOP-7-basket',
      targetBranch: 'main',
      state: 'merged',
      webUrl: 'https://git.example.com/g/p/-/merge_requests/14',
      mergeCommitSha: null,
      squashCommitSha: 'cs14',
      mergedAt: '2026-01-05T10:00:00Z',
      author: 'jdoe',
      mergedBy: 'asmith',
    }
    expect({
      merged: changeRequestFact(mr, ['jira:SHOP-7']),
      open: changeRequestFact(
        {
          ...mr,
          state: 'opened',
          squashCommitSha: null,
          mergedAt: null,
          mergedBy: null,
        },
        [],
      ),
    }).toEqual({
      merged: {
        repositoryKey: 'gitlab:42',
        number: '14',
        title: 'SHOP-7: add the basket',
        url: 'https://git.example.com/g/p/-/merge_requests/14',
        sourceBranch: 'feat/SHOP-7-basket',
        targetBranch: 'main',
        mergeSha: 'cs14',
        mergedAt: new Date('2026-01-05T10:00:00Z'),
        author: 'jdoe',
        mergedBy: 'asmith',
        workItems: ['jira:SHOP-7'],
      },
      open: {
        repositoryKey: 'gitlab:42',
        number: '14',
        title: 'SHOP-7: add the basket',
        url: 'https://git.example.com/g/p/-/merge_requests/14',
        sourceBranch: 'feat/SHOP-7-basket',
        targetBranch: 'main',
        author: 'jdoe',
        workItems: [],
      },
    })
  })
})
