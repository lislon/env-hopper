'use client';
import React from 'react';
import { GitHubLink } from './GitHubLink/GitHubLink';
import { Await, useRouteLoaderData } from 'react-router-dom';
import { EhMainLoaderData } from '../../types';
import { ErrorBoundary } from 'react-error-boundary';
import { CustomHtml } from './CustomHtml/CustomHtml';

export function Footer() {
  const loaderData = useRouteLoaderData('root') as EhMainLoaderData;

  return (
    <>
      <ErrorBoundary fallback={<div></div>}>
        <Await resolve={loaderData.customization}>
          {(customization) => <CustomHtml customization={customization} />}
        </Await>
      </ErrorBoundary>

      <GitHubLink />
    </>
  );
}
