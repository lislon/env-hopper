import React from 'react';
import { Footer } from './Footer/Footer';

export interface LoadingFallbackProps {
  failureCount: number;
}

export function LoadingFallback({ failureCount }: LoadingFallbackProps) {
  return (
    <div>
      <div className="flex min-h-screen flex-col items-center dark:bg-gray-800 dark:text-white bg-white text-black w-full">
        Loading... {failureCount > 0 ? `Attempt ${failureCount}` : ''}
      </div>
      <Footer />
    </div>
  );
}
