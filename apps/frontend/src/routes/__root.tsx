import { createRootRoute } from '@tanstack/react-router';
import React from 'react';
import { Outlet } from '@tanstack/react-router';

export const Route = createRootRoute({ component: RootRoute });

 function RootRoute() {
  return (
    <div className="min-h-screen bg-base-200">
      {/* Add a navbar or layout here if needed */}
      <Outlet />
    </div>
  );
} 