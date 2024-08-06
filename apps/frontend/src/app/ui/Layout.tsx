import React from 'react';
import { Footer } from './Footer/Footer';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
      <div
        className="flex min-h-screen flex-col items-center dark:bg-gray-800 dark:text-white bg-white text-black w-full">
        {children}
        <Footer />
      </div>
  );
}
