import React from 'react';
import { Await, useRouteLoaderData } from 'react-router-dom';
import { MainForm } from './MainForm';
import { JumpMainButton } from './JumpMainButton';
import { RecentJumps } from './RecentJumps';
import { EhContextProvider } from '../context/EhContext';
import { EhMainLoaderData } from '../types';

export function Home() {
  const loaderData = useRouteLoaderData('root') as EhMainLoaderData;

  return (
    <main className="flex flex-col items-center p-8">
      <Await resolve={loaderData.config}>
        {(config) => (
          <EhContextProvider config={config}>
            <div className="flex gap-16 flex-col min-w-[300px] max-w-[500px] w-full">
              <MainForm />
            </div>
            <div className="m-16 min-w-[400px] w-full">
              <JumpMainButton />
            </div>
            <div className="min-w-[400px]">
              <RecentJumps />
            </div>
          </EhContextProvider>
        )}
      </Await>
    </main>
  );
}
