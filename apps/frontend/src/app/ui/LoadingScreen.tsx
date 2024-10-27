import React from 'react';

export interface LoadingFallbackProps {
  failureCount?: number;
}

export function LoadingScreen({ failureCount }: LoadingFallbackProps) {
  return (
    <>
      <div className="flex flex-col items-center w-full h-full">
        <span className="loading loading-bars loading-lg"></span>
        <div>Loading...</div>
        {failureCount && failureCount > 1 ? (
          <div className={'mt-2 text-xs'}>Attempt {failureCount}</div>
        ) : null}
      </div>
    </>
  );
}
