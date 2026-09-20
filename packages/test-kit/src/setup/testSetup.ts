import '@testing-library/jest-dom'
import 'fake-indexeddb/auto'
import './polyfillLocalStorage'
import './bridgeAbortSignal'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import { cleanupTestResources } from '../harness/renderApp'

// jsdom has no layout engine, so it has no matchMedia either — several
// components read it on mount and would throw before rendering anything.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Not implemented in jsdom; the autocomplete lists call them while scrolling
// the highlighted option into view.
Element.prototype.scrollIntoView = vi.fn()
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver

// A scenario that leaves its IndexedDB behind seeds the next one's favorites and
// history, which is the kind of order-dependent flake that costs a day to find.
afterEach(async () => {
  cleanup()
  await cleanupTestResources()
  localStorage.clear()
  sessionStorage.clear()
})
