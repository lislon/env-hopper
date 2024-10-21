import React from 'react';

export interface LoadingFallbackProps {
  failureCount?: number;
}

export function LoadingScreen({ failureCount }: LoadingFallbackProps) {
  return (
    <>
      <div className="flex flex-col items-center w-full h-full">
        <span className="loading loading-bars loading-lg"></span>
        Loading... {failureCount ? `Attempt ${failureCount}` : ''}
      </div>
    </>
  );
}
