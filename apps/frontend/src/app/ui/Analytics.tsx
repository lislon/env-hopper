import { Await, useRouteLoaderData } from 'react-router-dom';
import { EhMainLoaderData } from '../types';
import React, { useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

function InsertJs({ js }: { js: string }) {
  useEffect(() => {
    if (document.getElementById('analytics-script') === null) {
      const script = document.createElement('script');
      script.id = 'analytics-script';
      script.async = true;
      script.innerHTML = js;
      document.body.appendChild(script);
    }
  }, [js]);
  return null;
}

export function Analytics() {
  const loaderData = useRouteLoaderData('root') as EhMainLoaderData;

  return (
    <ErrorBoundary fallback={<div></div>}>
      <Await resolve={loaderData.customization}>
        {(customization) => <InsertJs js={customization.analyticsScript} />}
      </Await>
    </ErrorBoundary>
  );
}
