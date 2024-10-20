import React from 'react';
import { Link } from 'react-router-dom';
import { useEhServerSync } from '../context/EhServerSyncContext';
import cn from 'classnames';

export interface HeaderProps {
  className?: string;
}
export function Header({ className }: HeaderProps) {
  const { error, needRefresh, refresh } = useEhServerSync();
  const APP_VERSION = import.meta.env.VITE_APP_VERSION;
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
          <Link
            className={'hover:underline'}
            title={'View release on GitHub'}
            to={`https://github.com/lislon/env-hopper/releases/${APP_VERSION.includes('.') ? `tag/v${APP_VERSION}` : ''}`}
          >
            v{APP_VERSION}
          </Link>
        </div>
        {/*<div className={"flex gap-1"}>*/}
        {/*  <div className={"invisible sm:visible"}>sm</div>*/}
        {/*  <div className={"invisible lg:visible"}>lg</div>*/}
        {/*  <div className={"invisible xl:visible"}>xl</div>*/}
        {/*  <div className={"invisible 2xl:visible"}>2xl</div>*/}
        {/*</div>*/}
      </div>
      {error && (
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
  );
}
