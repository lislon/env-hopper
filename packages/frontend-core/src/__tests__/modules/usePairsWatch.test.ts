import { QueryClient } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { usePairsWatch } from '~/modules/pairDetails/usePairsWatch'
import { pairFacetKey } from '~/modules/pairDetails/pairDetails'

interface Subscription {
  input: { lastEventId?: string }
  onData: (e: { id: string; data: Array<object> }) => void
  onError: (e: unknown) => void
  closed: boolean
}

function fakeTrpc() {
  const subs: Array<Subscription> = []
  const client = {
    pairsWatch: {
      subscribe: (
        input: Subscription['input'],
        handlers: Omit<Subscription, 'input' | 'closed'>,
      ) => {
        const s: Subscription = { input, ...handlers, closed: false }
        subs.push(s)
        return { unsubscribe: () => void (s.closed = true) }
      },
    },
  }
  return { client: client as never, subs }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('EventSource', class {})
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('usePairsWatch', () => {
  it('opens a new subscription after one fails, from the last event it saw', async () => {
    const { client, subs } = fakeTrpc()
    const queryClient = new QueryClient()
    renderHook(() =>
      usePairsWatch(queryClient, client, { appSlug: 'shop', envSlug: 'qa' }),
    )
    expect(subs).toHaveLength(1)

    subs[0]!.onData({
      id: 'boot-7',
      data: [
        { app: 'shop', env: 'qa', facet: 'deployment', data: { rows: [] } },
      ],
    })
    // The server went away: the proxy answered an error, the stream is over.
    subs[0]!.onError(new Error('500'))
    await vi.advanceTimersByTimeAsync(5_000)

    expect(subs).toHaveLength(2)
    expect(subs[1]!.input.lastEventId).toBe('boot-7')
    expect(
      queryClient.getQueryData(pairFacetKey('shop', 'qa', 'deployment')),
    ).toBeDefined()
  })

  it('keeps retrying, further apart each time, while the server is away', async () => {
    const { client, subs } = fakeTrpc()
    renderHook(() =>
      usePairsWatch(new QueryClient(), client, { appSlug: 'shop' }),
    )

    for (let i = 0; i < 4; i++) {
      subs.at(-1)!.onError(new Error('down'))
      await vi.advanceTimersByTimeAsync(60_000)
    }

    expect(subs).toHaveLength(5)
  })

  it('stops for good on unmount', async () => {
    const { client, subs } = fakeTrpc()
    const { unmount } = renderHook(() =>
      usePairsWatch(new QueryClient(), client, { appSlug: 'shop' }),
    )
    subs[0]!.onError(new Error('down'))
    unmount()
    await vi.advanceTimersByTimeAsync(60_000)

    expect(subs).toHaveLength(1)
  })
})
