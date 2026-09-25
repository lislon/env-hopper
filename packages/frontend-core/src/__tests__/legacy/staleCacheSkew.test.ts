import { describe, expect, it } from 'vitest'
import { isStaleCacheSkew } from '~/legacy/ui/Error/DefaultErrorPage'

const skew = {
  localAppVersion: '1.15.0',
  serverAppVersion: '1.16.0',
  isPastGrace: false,
  isDegraded: false,
}

describe('isStaleCacheSkew', () => {
  it('treats a fresh error with two different known versions as an update', () => {
    expect(isStaleCacheSkew(skew)).toBe(true)
  })

  it('is an error, not an update, once the grace window has passed', () => {
    expect(isStaleCacheSkew({ ...skew, isPastGrace: true })).toBe(false)
  })

  it('is an error when the app is knowingly serving a cached payload', () => {
    expect(isStaleCacheSkew({ ...skew, isDegraded: true })).toBe(false)
  })

  it('is an error when the versions match', () => {
    expect(isStaleCacheSkew({ ...skew, serverAppVersion: '1.15.0' })).toBe(
      false,
    )
  })

  it.each(['localAppVersion', 'serverAppVersion'] as const)(
    'is an error when %s is unknown',
    (field) => {
      expect(isStaleCacheSkew({ ...skew, [field]: undefined })).toBe(false)
    },
  )

  /*
   * What ships today. `serverAppVersion` comes off `VITE_APP_VERSION`, which no
   * build defines, so the adapter yields the empty string and the boot-time
   * localStorage write never fires. This pins the recovery as unreachable: when
   * someone lands a real version on the bootstrap payload, this case flips and the
   * test tells them the prerequisite is done.
   */
  it('cannot fire while no build defines a version', () => {
    expect(
      isStaleCacheSkew({
        localAppVersion: undefined,
        serverAppVersion: '',
        isPastGrace: false,
        isDegraded: false,
      }),
    ).toBe(false)
  })
})
