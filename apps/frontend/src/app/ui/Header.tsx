import React from 'react';
import { Link } from 'react-router-dom';

export function Header() {
  return (
    <header className="flex">
      <div className="my-4">
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
      </div>
    </header>
  );
}
