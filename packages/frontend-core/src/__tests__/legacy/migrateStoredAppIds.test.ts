import { beforeEach, describe, expect, it } from 'vitest'
import { migrateStoredAppIds } from '~/legacy/lib/migrateStoredAppIds'

/*
 * An explicit in-memory store rather than the ambient `localStorage`: under
 * Node 25 the ambient one can be Node's own experimental global, which shadows
 * jsdom's and lacks half the Storage interface.
 */
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

let localStorage: Storage

/*
 * The values below are what the previous UI writes — measured on its live site:
 * favouriting page `shipments` of app `orders` stores `["orders/shipments"]`.
 */
describe('migrateStoredAppIds', () => {
  beforeEach(() => {
    localStorage = memoryStorage()
  })

  it('rewrites favourites to the ids this app uses', () => {
    localStorage.setItem(
      'favoriteApps',
      JSON.stringify(['orders/shipments', 'orders/home', 'billing']),
    )

    migrateStoredAppIds(localStorage)

    expect(JSON.parse(localStorage.getItem('favoriteApps')!)).toEqual([
      'orders@shipments',
      'orders',
      'billing',
    ])
  })

  it('rewrites the app of every history entry and keeps the rest of it', () => {
    localStorage.setItem(
      'recent',
      JSON.stringify([
        { env: 'dev', app: 'orders/shipments', url: 'https://example.test/1' },
        { env: 'dev', app: 'orders/home', substitution: 'X-1', url: 'u2' },
      ]),
    )

    migrateStoredAppIds(localStorage)

    expect(JSON.parse(localStorage.getItem('recent')!)).toEqual([
      { env: 'dev', app: 'orders@shipments', url: 'https://example.test/1' },
      { env: 'dev', app: 'orders', substitution: 'X-1', url: 'u2' },
    ])
  })

  it('rewrites the last-used app', () => {
    localStorage.setItem('lastUsedApp', JSON.stringify('orders/shipments'))

    migrateStoredAppIds(localStorage)

    expect(localStorage.getItem('lastUsedApp')).toBe('"orders@shipments"')
  })

  it('merges a favourite stored in both forms into one', () => {
    localStorage.setItem(
      'favoriteApps',
      JSON.stringify(['orders/shipments', 'orders@shipments']),
    )

    migrateStoredAppIds(localStorage)

    expect(JSON.parse(localStorage.getItem('favoriteApps')!)).toEqual([
      'orders@shipments',
    ])
  })

  it('is a no-op on ids already in this form, and on anything unparseable', () => {
    localStorage.setItem('favoriteApps', JSON.stringify(['orders@shipments']))
    localStorage.setItem('recent', 'not json')

    migrateStoredAppIds(localStorage)
    migrateStoredAppIds(localStorage)

    expect(localStorage.getItem('favoriteApps')).toBe('["orders@shipments"]')
    expect(localStorage.getItem('recent')).toBe('not json')
  })
})
