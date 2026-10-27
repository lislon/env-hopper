// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest'
import setup from '../../testing/globalSetup'

const saved = process.env.EH_CORE_TEST_DATABASE_URL
afterEach(() => {
  process.env.EH_CORE_TEST_DATABASE_URL = saved
})

describe('catalog test globalSetup', () => {
  it.each([
    'postgres://u:p@localhost:5532/db',
    'postgres://u:p@localhost:5532/db?schema=public',
  ])('refuses %s, which would reset public', (url) => {
    process.env.EH_CORE_TEST_DATABASE_URL = url
    expect(() => setup({ provide: () => {} })).toThrow(
      /must name a dedicated test schema/,
    )
  })
})
