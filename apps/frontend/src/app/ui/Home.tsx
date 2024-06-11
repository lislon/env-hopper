'use client';
import React from 'react';
import { EhContextProvider } from '../context/EhContext';
import { useQuery } from '@tanstack/react-query';
import { getConfig } from '../api';
import { JumpMainButton } from './JumpMainButton';
import { UrlBar } from './UrlBar';
import { Header } from './Header';
import { RecentJumps } from './RecentJumps';


export function Home() {
  const { data } = useQuery({ queryKey: ['config'], queryFn: getConfig });
  if (!data) {
    return <div>Loading...</div>;
  }
  return <EhContextProvider data={data}>
    <div className="w-[400px]">
      <Header />
      <div className="flex gap-16 flex-col">
        <UrlBar />
      </div>
    </div>
    <div className="m-16 min-w-[400px]">
      <JumpMainButton />
    </div>
    <div className="min-w-[400px]">
      <RecentJumps />
    </div>

  </EhContextProvider>;
}
