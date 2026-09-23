import cn from 'classnames'
import { Link } from '@tanstack/react-router'
import { useEhServerSync } from '../adapter/legacyApi'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { LOCAL_STORAGE_KEY_VERSION } from '../lib/local-storage-constants'

export interface HeaderProps {
  className?: string
}

/**
 * INTENTIONAL DIFF: the release link was a router `<Link to={absoluteUrl}>`. The
 * current router types `to` against the route tree, so an off-site URL does not
 * typecheck. A plain `<a href>` renders the identical element — `Link` emits an
 * `<a>` with the same href — so this is a types-level change only.
 */
/**
 * Where the version label links to. A snapshot build (`2.0.1-alpha-20260812145859`)
 * is published with no git tag, so GitHub has no release page for it and the
 * tag link was a 404; npm is the one place that version exists.
 */
export function releaseUrl(version: string | undefined): string {
  if (version && /-[a-z]+-\d{14}$/.test(version)) {
    return `https://www.npmjs.com/package/@env-hopper/backend-core/v/${version}`
  }
  return `https://github.com/lislon/env-hopper/releases/${version?.includes('.') ? `tag/v${version}` : ''}`
}

export function Header({ className }: HeaderProps) {
  const { error, needRefresh, refresh, isDegraded } = useEhServerSync()

  const [installedAppVersion] = useLocalStorage<string | undefined>(
    LOCAL_STORAGE_KEY_VERSION,
    undefined,
  )

  return (
    <header className={cn('flex items-center', className)}>
      <div className="px-4 sm:my-4">
        <Link to="/" title="Home Page">
          <img
            src="/grasshopper-lsn.svg"
            alt={'Grasshopper Logo'}
            className="h-20 w-20"
          />
        </Link>
      </div>
      <div className="place-content-center mx-4">
        <div>Env hopper</div>
        <div className="text-xs text-gray-500">
          <a
            className={'hover:underline'}
            title={'View release'}
            href={releaseUrl(installedAppVersion)}
          >
            {/* `versions` is what the previous UI showed with no version known.
                In prod a version is always known, so that fallback only ever
                appeared locally, where it read as a broken label rather than as
                "there is no release to point at". */}
            {installedAppVersion
              ? `v${installedAppVersion}`
              : import.meta.env.DEV
                ? 'Local'
                : 'versions'}
          </a>
        </div>
      </div>
      {isDegraded && (
        <div
          className="badge badge-warning badge-outline text-xs cursor-defaul tooltip"
          data-tip={'Working in offline mode: ' + error?.message}
        >
          degraded
        </div>
      )}
      {needRefresh && (
        <button className="btn btn-outline" onClick={refresh}>
          Update available, click to reload
        </button>
      )}
    </header>
  )
}
