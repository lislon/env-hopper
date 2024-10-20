import React from 'react';
import { Link } from 'react-router-dom';
import { useEhServerSync } from '../context/EhServerSyncContext';

export function Header() {
  const { error } = useEhServerSync();
  return (
    <header className="flex items-center">
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
    </header>
  );
}
