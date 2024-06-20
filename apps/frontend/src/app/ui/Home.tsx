'use client';
import React, { useEffect } from 'react';
import { EhContextProvider, useEhContext } from '../context/EhContext';
import { useQuery } from '@tanstack/react-query';
import { getConfig } from '../api';
import { JumpMainButton } from './JumpMainButton';
import { UrlBar } from './UrlBar';
import { Header } from './Header';
import { RecentJumps } from './RecentJumps';
import { findSubstitutionIdByUrl } from '../lib/utils';

function HomeWithContext() {
  const {
    recentJumps,
    setApp,
    setSubstitution,
    setEnv,
    getEnvById,
    getAppById,
  } = useEhContext();
  useEffect(() => {
    if (recentJumps.length > 0) {
      const latestJump = recentJumps[0];
      const latestEnv = getEnvById(latestJump?.env);
      const latestApp = getAppById(latestJump?.app);
      setEnv(latestEnv);
      setApp(latestApp);
      if (
        latestJump.substitution &&
        latestApp !== undefined &&
        latestEnv !== undefined
      ) {
        const lastSubstitutionName = findSubstitutionIdByUrl({
          app: latestApp,
          env: latestEnv,
        });
        if (lastSubstitutionName) {
          setSubstitution({
            name: lastSubstitutionName,
            value: latestJump.substitution,
          });
        }
      }
    }
  }, []);

  return (
    <>
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
    </>
  );
}

export function Home() {
  const { data, failureCount } = useQuery({
    queryKey: ['config'],
    queryFn: getConfig,
    retry: 50,
  });
  if (!data) {
    if (failureCount > 0) {
      return <div>Loading... Attempt {failureCount}</div>;
    }
    return <div>Loading...</div>;
  }
  return (
    <EhContextProvider data={data}>
      <HomeWithContext />
    </EhContextProvider>
  );
}
