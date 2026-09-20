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
            title={'View release on GitHub'}
            href={`https://github.com/lislon/env-hopper/releases/${installedAppVersion?.includes('.') ? `tag/v${installedAppVersion}` : ''}`}
          >
            {installedAppVersion ? `v${installedAppVersion}` : 'versions'}
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
