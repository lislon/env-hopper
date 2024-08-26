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
        <div className="text-xs text-gray-500">v{APP_VERSION}</div>
      </div>
    </header>
  );
}
