import { Link } from 'react-router-dom';
import React from 'react';

export function Header() {
  return <div className="flex align-middle">
    <div className="my-4">
      <Link to="/">
        <img
          src="/grasshopper-lsn.svg"
          // className="dark:invert"
          alt={'Grasshopper Logo'}
          width={100}
          height={24}
        />
      </Link>
    </div>
    <div className="place-content-center mx-4">
      <div>Env hopper</div>
      <div className="text-xs text-gray-500">v0.0.3</div>
    </div>
  </div>;

}
