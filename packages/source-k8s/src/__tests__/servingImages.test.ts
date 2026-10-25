// @vitest-environment node
/**
 * Which images the Ready pods run, read from the Deployment and its
 * ReplicaSets as the API server lists them.
 */
import { describe, expect, it } from 'vitest'
import { createK8sSource } from '../k8sSource'
import type { RawDeployment, RawReplicaSet } from '../k8sTypes'

/** `shop` at `revision`, wanting 2 pods of `tag`. */
const shop = (revision: number, tag: string): RawDeployment => ({
  metadata: {
    namespace: 'qa',
    name: 'shop',
    annotations: { 'deployment.kubernetes.io/revision': String(revision) },
  },
  spec: {
    replicas: 2,
    template: {
      spec: { containers: [{ image: `r.example.com/shop:${tag}` }] },
    },
  },
  status: { readyReplicas: 2 },
})

/** A ReplicaSet of `shop` at `revision`, with `ready` of its pods Ready. */
const rs = (revision: number, tag: string, ready: number): RawReplicaSet => ({
  metadata: {
    namespace: 'qa',
    name: `shop-${revision}abc`,
    annotations: { 'deployment.kubernetes.io/revision': String(revision) },
    ownerReferences: [{ kind: 'Deployment', name: 'shop' }],
  },
  spec: {
    replicas: ready === 0 ? 2 : ready,
    template: {
      spec: { containers: [{ image: `r.example.com/shop:${tag}` }] },
    },
  },
  status: { replicas: Math.max(ready, 1), readyReplicas: ready },
})

const refused = Object.assign(new Error('forbidden'), { statusCode: 403 })

async function workloadsOf(
  deployment: RawDeployment,
  sets: Array<RawReplicaSet> | Error,
) {
  const src = createK8sSource({
    cluster: 'stage',
    apps: {
      listDeploymentForAllNamespaces: async () => ({
        body: { items: [deployment] },
      }),
      listReplicaSetForAllNamespaces: async () => {
        if (sets instanceof Error) throw sets
        return { body: { items: sets } }
      },
      readNamespacedDeployment: () => Promise.reject(new Error('unused')),
    },
    networking: {
      listIngressForAllNamespaces: async () => ({ body: { items: [] } }),
    },
  })
  return (await src.listWorkloads()).map((w) => ({
    images: w.images.map((i) => i.tag),
    servingImages: w.servingImages?.map((i) => i.tag),
  }))
}

describe('the images Ready pods run', () => {
  it('mid-rollout, the old ReplicaSet still serves: its images', async () => {
    expect(
      await workloadsOf(shop(2, 'main-42'), [
        rs(1, 'main-41', 1),
        rs(2, 'main-42', 0),
      ]),
    ).toEqual([{ images: ['main-42'], servingImages: ['main-41'] }])
  })

  it('once the new ReplicaSet is Ready, the spec serves', async () => {
    expect(
      await workloadsOf(shop(2, 'main-42'), [rs(2, 'main-42', 2)]),
    ).toEqual([{ images: ['main-42'], servingImages: undefined }])
  })

  it('nothing Ready anywhere: nothing to say', async () => {
    expect(
      await workloadsOf(shop(2, 'main-42'), [
        rs(1, 'main-41', 0),
        rs(2, 'main-42', 0),
      ]),
    ).toEqual([{ images: ['main-42'], servingImages: undefined }])
  })

  it('of two older ReplicaSets still Ready, the higher revision serves', async () => {
    expect(
      await workloadsOf(shop(3, 'main-43'), [
        rs(1, 'main-41', 1),
        rs(2, 'main-42', 1),
        rs(3, 'main-43', 0),
      ]),
    ).toEqual([{ images: ['main-43'], servingImages: ['main-42'] }])
  })

  it('ReplicaSets refused: the workloads still come, as the spec says', async () => {
    expect(await workloadsOf(shop(2, 'main-42'), refused)).toEqual([
      { images: ['main-42'], servingImages: undefined },
    ])
  })
})
