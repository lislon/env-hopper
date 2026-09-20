import { describe, expect, it } from 'vitest'
import { mergeContextFlags } from '~/modules/crossCuttingParams/utils/mergeContextFlags'

const params = [
  { slug: 'kafkaTopic', displayName: 'Kafka Topic' },
  { slug: 'caseId', displayName: 'Case ID' },
  { slug: 'shipperId', displayName: 'Shipper ID' },
]

const contexts = [
  { slug: 'kafkaTopic', displayName: 'Kafka Topic', isSharedAcrossEnvs: true },
  { slug: 'caseId', displayName: 'Case ID', isSharedAcrossEnvs: false },
  // No flag stated at all.
  { slug: 'shipperId', displayName: 'Shipper ID' },
  // The environment selector: a context with no matching param.
  { slug: 'env', displayName: 'Environment', isSharedAcrossEnvs: true },
]

describe('mergeContextFlags', () => {
  it('takes the shared flag from the matching context', () => {
    const merged = mergeContextFlags(params, contexts)

    expect(merged.map((d) => [d.slug, d.isSharedAcrossEnvs])).toEqual([
      ['kafkaTopic', true],
      ['caseId', false],
      ['shipperId', undefined],
    ])
  })

  it('never turns a context into a parameter of its own', () => {
    expect(
      mergeContextFlags(params, contexts).map((d) => d.slug),
    ).not.toContain('env')
    expect(mergeContextFlags([], contexts)).toEqual([])
  })

  it('keeps a flag the param itself declared when no context states one', () => {
    const declared = [
      { slug: 'orderId', displayName: 'Order ID', isSharedAcrossEnvs: true },
    ]

    expect(mergeContextFlags(declared, [])[0]?.isSharedAcrossEnvs).toBe(true)
    expect(
      mergeContextFlags(declared, [
        { slug: 'orderId', displayName: 'Order ID' },
      ])[0]?.isSharedAcrossEnvs,
    ).toBe(true)
  })

  it('lets a context override a flag the param declared', () => {
    const declared = [
      { slug: 'orderId', displayName: 'Order ID', isSharedAcrossEnvs: true },
    ]
    const override = [
      { slug: 'orderId', displayName: 'Order ID', isSharedAcrossEnvs: false },
    ]

    expect(mergeContextFlags(declared, override)[0]?.isSharedAcrossEnvs).toBe(
      false,
    )
  })

  it('preserves the rest of the param definition', () => {
    expect(mergeContextFlags(params, contexts)[0]).toMatchObject({
      slug: 'kafkaTopic',
      displayName: 'Kafka Topic',
    })
  })
})
