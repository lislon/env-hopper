'use client';
import { EhApp, EhAppId, EhClientConfig, EhEnv, EhEnvId, EhSubstitution, EhSubstitutionId } from '@env-hopper/types';
import React, { createContext, useContext, useMemo, useState } from 'react';
import { EhJumpHistory } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';


export interface EhContextProps {
  envs: EhEnv[];
  apps: EhApp[];
  substitutions: EhSubstitution[];
  favoriteEnvs: EhEnvId[];
  favoriteApps: EhAppId[];
  setActiveEnv: (env: EhEnv | null) => void;
  setActiveApp: (app: EhApp | null) => void;
  setActiveSubstitution: (appContextId: EhSubstitution | null) => void;
  activeEnv: EhEnv | null;
  activeApp: EhApp | null;
  activeSubstitution: EhSubstitution | null;

  getAppById(id: EhAppId | null): EhApp | null;

  getEnvById(id: EhEnvId | null): EhEnv | null;

  getSubstitutionById(id: EhSubstitutionId | null): EhSubstitution | null;

  recordJump(jump: EhJumpHistory): void;

  recentJumps: EhJumpHistory[];
}

//  createContext is not supported in Server Components
const EhContext = createContext<EhContextProps | null>(null);

export function useEhContext(): EhContextProps {
  const ctx = useContext(EhContext);
  if (ctx === null) {
    throw new Error('EhContext is not provided');
  }
  return ctx;
}

const MAX_HISTORY_JUMPS = 100;

export function EhContextProvider({ children, data }: { children: React.ReactNode, data: EhClientConfig }) {

  const [env, setEnv] = useState<EhEnv | null>(null);
  const [app, setApp] = useState<EhApp | null>(null);
  const [appContext, setAppContext] = useState<EhSubstitution | null>(null);

  const [recentJumps, setRecentJumps] = useLocalStorage<EhJumpHistory[]>('recent', []);

  const value = useMemo<EhContextProps>(() => {
    return {
      setActiveEnv: env1 => {
        setEnv(data.envs.find(env => env === env1) || null);
      },
      activeEnv: env,
      favoriteEnvs: ['cross-04', 'sigdevdeploy-08'],
      favoriteApps: ['prod-lims'],
      setActiveApp: app => {
        setApp(app);
      },
      activeApp: app,
      activeSubstitution: appContext,
      setActiveSubstitution: appContext => {
        setAppContext(appContext);
      },
      envs: data.envs,
      apps: data.apps,
      substitutions: data.substitutions,
      getAppById(id: EhAppId): EhApp | null {
        return data.apps.find(app => app.name === id) || null;
      },
      getEnvById(id: EhEnvId): EhEnv | null {
        return data.envs.find(env => env.name === id) || null;
      },
      getSubstitutionById(appId: EhSubstitutionId | null): EhSubstitution | null {
        return data.substitutions.find(substitution => substitution.name === appId) || null;
      },
      recordJump(jump: EhJumpHistory) {
        console.log(`Jumping to ${jump.app} in ${jump.env}`);
        setRecentJumps([jump, ...recentJumps].slice(0, MAX_HISTORY_JUMPS));
      },
      recentJumps: recentJumps
    };
  }, [env, app, data, appContext, recentJumps, setRecentJumps]);

  return <EhContext.Provider value={value}>{children}</EhContext.Provider>;
}
