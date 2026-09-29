import { useEffect, useState } from 'react'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { useEhServerSync, useLegacyConfig } from '../../adapter/legacyApi'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { LOCAL_STORAGE_KEY_VERSION } from '../../lib/local-storage-constants'

/** How long a render error is treated as "a new build is landing" and not an error. */
const GRACE_MS = 25_000

export interface StaleCacheSkewInput {
  /** The build the browser last booted, off localStorage. */
  localAppVersion: string | undefined
  /** The build the server says is current. */
  serverAppVersion: string | undefined
  /** The grace window has expired, so this is a real error. */
  isPastGrace: boolean
  /** The app is running off a cached payload, so a skew is not the explanation. */
  isDegraded: boolean
}

/**
 * Whether a render error is most likely a half-swapped build rather than a bug.
 *
 * The reasoning: the browser is running assets from one build against a server on
 * another, the mismatch threw, and the service worker is already fetching the new
 * one — so waiting fixes it and an error page would be noise. Both versions have
 * to be known and different, the error has to be fresh, and the app must not be
 * knowingly serving stale cached data.
 */
export function isStaleCacheSkew({
  localAppVersion,
  serverAppVersion,
  isPastGrace,
  isDegraded,
}: StaleCacheSkewInput): boolean {
  return (
    localAppVersion !== undefined &&
    serverAppVersion !== undefined &&
    localAppVersion !== serverAppVersion &&
    !isPastGrace &&
    !isDegraded
  )
}

/**
 * The previous UI's error page, including its self-healing branch.
 *
 * WIRED NOWHERE YET, AND THAT IS DELIBERATE — two things have to exist first:
 *
 *  1. `serverAppVersion` has no source. It came off the previous `/api/config`
 *     payload's `appVersion`; the current `bootstrap` procedure has no version
 *     field of any kind, so `adapter/legacyApi` falls back to the build define
 *     `VITE_APP_VERSION` — which no build in this repo sets. So `serverAppVersion`
 *     is the empty string, `localAppVersion` is never written at all (the write is
 *     gated on a truthy version), `isStaleCacheSkew` is always false, and the
 *     recovery branch can never render. Needs, in order: `appVersion` on the
 *     bootstrap payload, a
 *     `VITE_APP_VERSION` define (the same missing wiring that makes the header
 *     print the literal word "versions"), and the boot-time localStorage write —
 *     which `useEhServerSync` already performs, but only when `appVersion` is
 *     truthy, so it is inert rather than missing.
 *  2. `isDegraded` is effectively dead: the caching fetcher swallows a failed
 *     background sync into `console.debug`, so the query never errors while cache
 *     is being served and the flag never goes true. It is read here for fidelity,
 *     not because it discriminates today.
 *
 * Making this the root `errorComponent` would also cost real behaviour: the
 * current one routes authorization failures to a 403 page and offers a client-DB
 * reset for the storage errors that actually strand users. The seam, when the two
 * prerequisites above land, is to try this branch first inside `RootErrorPage` and
 * fall through to that component, not to replace it.
 */
export function DefaultErrorPage({ error }: ErrorComponentProps) {
  const { data: config } = useLegacyConfig()
  const [localAppVersion] = useLocalStorage<string | undefined>(
    LOCAL_STORAGE_KEY_VERSION,
    undefined,
  )
  const { isDegraded } = useEhServerSync()
  const serverAppVersion = config?.appVersion

  const [isPastGrace, setIsPastGrace] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setIsPastGrace(true), GRACE_MS)
    return () => clearTimeout(t)
  }, [])

  const isUpdating = isStaleCacheSkew({
    localAppVersion,
    serverAppVersion,
    isPastGrace,
    isDegraded,
  })

  // `.eh-legacy` is required, not decoration: `prose` and `loading` only exist
  // inside that scope in the vendored skin. The original ran against a global
  // stylesheet and needed no wrapper.
  return (
    <div className="eh-legacy">
      <div className={'mt-8 text-center prose !max-w-none'} role="alert">
        {isUpdating ? (
          <div>
            <h2>New version is loading....</h2>
            <div className="loading loading-dots loading-lg"></div>
            <p>
              Please wait, new version is loading{' '}
              <span className={'text-nowrap'}>
                {localAppVersion} -&gt; <strong>{serverAppVersion}</strong>
              </span>
            </p>
            <p className="text-sm">
              While waiting, you can check what is changed:{' '}
              <a href={'https://github.com/lislon/env-hopper/releases/'}>
                https://github.com/lislon/env-hopper/releases/
              </a>
            </p>
          </div>
        ) : (
          <>
            <h1>Oops!</h1>
            <p>Sorry, an unexpected error has occurred. :( </p>
            <pre className={'text-left mt-8 text-sm'}>
              {<i>{error.message}</i>}
            </pre>
            <pre className={'text-left mt-8 text-sm'}>
              {<i>{error.stack}</i>}
            </pre>
          </>
        )}
      </div>
    </div>
  )
}
