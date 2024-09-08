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
    <footer className="mt-8 w-full p-4 flex justify-end items-end gap-4 flex-grow">
      <ErrorBoundary fallback={<div></div>}>
        <Await resolve={loaderData.customization}>
          {(customization) => <CustomHtml customization={customization} />}
        </Await>
      </ErrorBoundary>

      <GitHubLink />
    </footer>
  );
}
