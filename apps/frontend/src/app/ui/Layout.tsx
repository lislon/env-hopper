import React from 'react';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center dark:bg-gray-800 dark:text-white bg-white text-black w-full">
      {children}
    </div>
  );
}
