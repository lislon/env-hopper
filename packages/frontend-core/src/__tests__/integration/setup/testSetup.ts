import '@testing-library/jest-dom'
import 'fake-indexeddb/auto'
import { vi } from 'vitest'

// Mock window.matchMedia for jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
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

// vi.mock('*.svg', () => ({
//   default: 'mocked-svg-url',
//   ReactComponent: () => 'svg-component'
// }))

// Mock specific SVG files that might be causing issues
vi.mock('~/assets/env-hopper-logo.svg?react', () => ({
  default: 'mocked-logo-url',
  ReactComponent: () => 'logo-component',
}))

// Mock SVG with ?react query parameter
vi.mock('*.svg?react', () => ({
  default: 'mocked-svg-url',
  ReactComponent: () => 'svg-component',
}))
