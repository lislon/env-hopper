import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  recall,
  remember,
} from '~/legacy/ui/Widget/ReleaseTrains/releaseTrainsMemory'

const trains = (name: string) => ({
  displayTimeZone: 'America/Los_Angeles',
  trains: [{ fullName: name }],
})

/** Under Node 25 the ambient `localStorage` can be Node's partial one: a whole Storage per test. */
function memoryStorage(): Storage {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => [...map.keys()][i] ?? null,
    removeItem: (k) => void map.delete(k),
    setItem: (k, v) => void map.set(k, String(v)),
  }
}

describe('release trains remembered per App', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage())
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('gives back what was seen last, including "this App has none"', () => {
    remember('shop', trains('M271') as never)
    remember('vet', null)

    expect({
      shop: recall('shop')?.data,
      vet: recall('vet')?.data,
      never: recall('never-seen'),
    }).toEqual({ shop: trains('M271'), vet: null, never: undefined })
  })

  it('keeps the 30 Apps seen most recently', () => {
    for (let i = 0; i < 31; i++) {
      vi.advanceTimersByTime(1000)
      remember(`app${i}`, null)
    }

    expect({ oldest: recall('app0'), newest: recall('app30')?.data }).toEqual({
      oldest: undefined,
      newest: null,
    })
  })
})
