import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { IDLE_MS, useAttention } from '~/util/useAttention'

describe('useAttention', () => {
  afterEach(() => vi.useRealTimers())

  it('is idle after IDLE_MS with no activity, and attentive again on a mouse move', () => {
    vi.useFakeTimers()
    const { result, unmount } = renderHook(() => useAttention())
    const atStart = result.current
    act(() => vi.advanceTimersByTime(IDLE_MS + 1))
    const afterIdle = result.current
    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove'))
    })
    const afterMove = result.current
    unmount()

    expect({ atStart, afterIdle, afterMove }).toEqual({
      atStart: true,
      afterIdle: false,
      afterMove: true,
    })
  })
})
