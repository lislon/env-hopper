'use client';
import React, { useEffect } from 'react';
import { EhContextProvider, useEhContext } from '../context/EhContext';
import { useQuery } from '@tanstack/react-query';
import { getConfig } from '../api';
import { JumpMainButton } from './JumpMainButton';
import { MainForm } from './MainForm';
import { Header } from './Header';
import { RecentJumps } from './RecentJumps';
import { Layout } from './Layout';

function HomeWithContext() {
  const { recentJumps, setApp, setEnv, getEnvById, getAppById } =
    useEhContext();
  useEffect(() => {
    if (recentJumps.length > 0) {
      const latestJump = recentJumps[0];
      const latestEnv = getEnvById(latestJump?.env);
      const latestApp = getAppById(latestJump?.app);
      setEnv(latestEnv);
      setApp(latestApp);
    }
  }, []);

  return (
    <Layout>
      <div className="w-[400px]">
        <Header />
        <div className="flex gap-16 flex-col">
          <MainForm />
        </div>
      </div>
      <div className="m-16 min-w-[400px]">
        <JumpMainButton />
      </div>
      <div className="min-w-[400px]">
        <RecentJumps />
      </div>
    </Layout>
  );
}

export function Home() {
  const { data, failureCount } = useQuery({
    queryKey: ['config'],
    queryFn: getConfig,
    retry: 50,
    refetchInterval: 1000 * 60 * 60, // 1h
  });
  if (!data) {
    return (
      <Layout>
        <div>
          Loading... {failureCount > 0 ? `Attempt ${failureCount}` : ''}
        </div>
      </Layout>
    );
  }

  return (
    <EhContextProvider data={data}>
      <HomeWithContext />
    </EhContextProvider>
  );
}
