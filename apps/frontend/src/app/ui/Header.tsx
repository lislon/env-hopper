import React from 'react';

export function Header() {
  return (
    <div className="flex align-middle">
      <div className="my-4">
        <img
          src="/grasshopper-lsn.svg"
          alt={'Grasshopper Logo'}
          width={100}
          height={24}
        />
      </div>
      <div className="place-content-center mx-4">
        <div>Env hopper</div>
        <div className="text-xs text-gray-500">v{APP_VERSION}</div>
      </div>
    </div>
  );
}
