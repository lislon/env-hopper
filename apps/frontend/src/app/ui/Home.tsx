'use client';
import React from 'react';
import { EnvList } from './EnvList';
import { AppList } from './AppList';
import { SubstitutionList } from './SubstitutionList';
import { EhContextProvider } from '../context/EhContext';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getConfig } from '../api';
import { JumpMainButton } from './JumpMainButton';
import { ShowContext } from './ShowContext';
import { UrlBar } from './UrlBar';


export function Home() {
  const { data } = useQuery({ queryKey: ['config'], queryFn: getConfig });
  if (!data) {
    return <div>Loading...</div>
  }
  return <EhContextProvider data={data}>
    <div className="w-full items-center justify-between font-mono">
      <div
        className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
      >
      </div>
    </div>
    <div>
    </div>

    <div className="flex w-full  justify-center gap-16 flex-wrap">
      <div className="">
        <div className="flex align-middle">
          <div className="place-content-center m-4">
            Env hopper
          </div>
          <div className="m-4">

          </div>
        </div>
        <div className="flex gap-16 flex-col">
          <UrlBar />
          {/*<EnvList />*/}
          {/*<AppList />*/}
          {/*<SubstitutionList />*/}
          {/*<JumpMainButton />*/}
          <ShowContext />
        </div>
      </div>
    </div>

  </EhContextProvider>;
}
