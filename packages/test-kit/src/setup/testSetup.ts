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

// jsdom 25 implements `<dialog>` as an element but not its methods — there is no
// top layer to put one in. Any component that opens a dialog therefore throws
// "showModal is not a function" and is caught by an error boundary, which looks
// like a broken component rather than a missing test API. Toggling `open` is the
// observable part and the only part a test can assert on.
if (typeof HTMLDialogElement !== 'undefined') {
  // `Partial` because the DOM types declare these as always present, which is
  // exactly the assumption being corrected.
  const dialog: Partial<HTMLDialogElement> = HTMLDialogElement.prototype
  const openIt = function openIt(this: HTMLDialogElement) {
    this.open = true
  }
  if (typeof dialog.showModal !== 'function') {
    dialog.showModal = openIt
  }
  if (typeof dialog.show !== 'function') {
    dialog.show = openIt
  }
  if (typeof dialog.close !== 'function') {
    dialog.close = function close(
      this: HTMLDialogElement,
      returnValue?: string,
    ) {
      this.open = false
      if (returnValue !== undefined) {
        this.returnValue = returnValue
      }
      this.dispatchEvent(new Event('close'))
    }
  }
}

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
