import { describe, expect, it } from 'vitest'
import { keepSharedAcrossEnvs } from '~/modules/crossCuttingParams/utils/keepSharedAcrossEnvs'

const defs = [
  { slug: 'orderId', displayName: 'Order ID', isSharedAcrossEnvs: true },
  { slug: 'sessionId', displayName: 'Session ID', isSharedAcrossEnvs: false },
  { slug: 'podName', displayName: 'Pod name' },
]

const values = {
  orderId: { slug: 'orderId', stringValue: 'ORD-4821' },
  sessionId: { slug: 'sessionId', stringValue: 'sess-1' },
  podName: { slug: 'podName', stringValue: 'api-7f9' },
}

describe('keepSharedAcrossEnvs', () => {
  it('keeps a shared value and drops an environment-scoped one', () => {
    expect(keepSharedAcrossEnvs(values, defs)).toEqual({
      orderId: { slug: 'orderId', stringValue: 'ORD-4821' },
    })
  })

  it('treats a param with no flag as scoped to one environment', () => {
    expect(keepSharedAcrossEnvs(values, defs)).not.toHaveProperty('podName')
  })

  it('drops a value whose definition is unknown', () => {
    expect(keepSharedAcrossEnvs(values, [])).toEqual({})
  })

  it('keeps an empty shared value rather than forgetting the param', () => {
    const emptied = { orderId: { slug: 'orderId', stringValue: '' } }

    expect(keepSharedAcrossEnvs(emptied, defs)).toEqual(emptied)
  })
})
