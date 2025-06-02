import React from 'react';

export function Header() {
  return (
    <header className="navbar bg-base-100 shadow mb-4">
      <div className="flex-1">
        <a className="btn btn-ghost text-xl">EnvHopper</a>
      </div>
      <div className="flex-none">
        <button className="btn btn-primary">Login</button>
      </div>
    </header>
  );
} 