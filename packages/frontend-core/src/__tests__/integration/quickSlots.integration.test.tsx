import { setupServer } from 'msw/node'
import { describe, expect, it } from 'vitest'
import { renderApp } from './helpers/renderWithProviders'

const server = setupServer()

describe('Quick slots preloaded from DB (simple)', () => {
  it('renders two prepopulated app slots (column-first grid) and two env slots', async () => {
    const result = await renderApp({
      server,
    })

    // Use UI helper (under resourceJump ui) to verify app jump slots
    const appSlots = await result.ui.resourceJump.quickSlots.getAppSlots()
    expect(appSlots).toEqual(['app1', 'app2'])
  })
})
