'use client';
import { EhApp, EhAppId, EhClientConfig, EhEnv, EhEnvId, EhSubstitutionType } from '@env-hopper/types';
import React, { createContext, useContext, useMemo, useState } from 'react';
import { EhJumpHistory, EhJumpParams, EhSubstitutionValue } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  cutApp,
  cutDomain,
  findSubstitutionIdByUrl,
  getEnvSpecificAppUrl,
  getJumpUrl,
  getJumpUrlEvenNotComplete
} from '../lib/utils';

function sortByPopularity(list: string[]): string[] {
  const counts = list.reduce((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  return [...new Set(list)].sort((a, b) => counts[b] - counts[a]);
}

export interface EhContextProps {
  listEnvs: EhEnv[];
  listApps: EhApp[];
  listSubstitutions: EhSubstitutionType[];
  listFavoriteEnvs: EhEnvId[];
  listFavoriteApps: EhAppId[];
  toggleFavoriteEnv: (envId: EhEnvId, isOn: boolean) => void;
  toggleFavoriteApp: (appId: EhAppId, isOn: boolean) => void;
  setEnv: (env: EhEnv | undefined) => void;
  setApp: (app: EhApp | undefined) => void;
  setSubstitution: (substitution: EhSubstitutionValue | undefined) => void;
  env: EhEnv | undefined;
  app: EhApp | undefined;
  substitution: EhSubstitutionValue | undefined;
  substitutionType: EhSubstitutionType | undefined;

  getAppById(id: EhAppId | undefined): EhApp | undefined;

  getEnvById(id: EhEnvId | undefined): EhEnv | undefined;

  recordJump(jump: EhJumpParams): void;

  recentJumps: EhJumpHistory[];
  reset: () => void;
  domainPart: string;
  appPart: string;
}

//  createContext is not supported in Server Components
const EhContext = createContext<EhContextProps | undefined>(undefined);

export function useEhContext(): EhContextProps {
  const ctx = useContext(EhContext);
  if (ctx === undefined) {
    throw new Error('EhContext is not provided');
  }
  return ctx;
}

const MAX_HISTORY_JUMPS = 100;

type RecordJumpParams = {
  app: EhApp | undefined,
  env: EhEnv | undefined,
  substitution: EhSubstitutionValue | undefined
};

function getAppById(id: string | undefined, ehApps: EhApp[]) {
  return ehApps.find(app => app.name === id) || undefined;
}

function getEnvById(id: string | undefined, ehEnvs: EhEnv[]) {
  return ehEnvs.find(env => env.name === id) || undefined;
}

export function EhContextProvider({ children, data }: { children: React.ReactNode, data: EhClientConfig }) {

  const [env, setEnv] = useState<EhEnv | undefined>();
  const [app, setApp] = useState<EhApp | undefined>();
  const [substitution, setSubstitution] = useState<EhSubstitutionValue | undefined>();

  const [recentJumps, setRecentJumps] = useLocalStorage<EhJumpHistory[]>('recent', []);
  const [favoriteEnvIds, setFavoriteEnvIds] = useLocalStorage<EhEnvId[]>('favoriteEnvs', []);
  const [favoriteAppIds, setFavoriteAppIds] = useLocalStorage<EhAppId[]>('favoriteApps', []);

  const value = useMemo<EhContextProps>(() => {
    const substitutionName = findSubstitutionIdByUrl(app ? getEnvSpecificAppUrl(app, env) : undefined);

    const substitutionType = data.substitutions.find(s => s.name === substitutionName || undefined);


    const env2 = env ? env : (data.envs.length > 0 ? data.envs[0] : undefined);
    const app1 = app ? app : data.apps.length > 0 ? data.apps[0] : undefined;
    const incompleteUrl = app1 && getJumpUrlEvenNotComplete({
      app: app1,
      env: env2,
      substitution: substitution
    });
    const domainPart = cutDomain(incompleteUrl || 'https://no-env');
    const appPart = cutApp(incompleteUrl || 'https://no-env/no-app');

    return {
      setEnv: env1 => {
        setEnv(data.envs.find(env => env === env1) || undefined);
      },
      env: env,
      listFavoriteEnvs: favoriteEnvIds,
      listFavoriteApps: favoriteAppIds,
      setApp: app => {
        setApp(app);
      },
      app: app,
      substitutionType,
      listEnvs: data.envs,
      listApps: data.apps,
      listSubstitutions: data.substitutions,
      substitution,
      setSubstitution,
      getAppById(id: EhAppId): EhApp | undefined {
        return getAppById(id, data.apps);
      },
      getEnvById(id: EhEnvId): EhEnv | undefined {
        return getEnvById(id, data.envs);
      },
      recordJump({ app, env, substitution: substitution1 }: RecordJumpParams) {
        console.log(`Jumping to ${app?.name} in ${env?.name} with ${substitution?.value}`);
        if (getJumpUrl({ app: app, env: env, substitution: substitution }) === undefined) {
          return;
        }
        const newVar: EhJumpHistory = { app: app?.name, env: env?.name, substitution: substitution?.value };
        setRecentJumps([newVar, ...recentJumps].slice(0, MAX_HISTORY_JUMPS));
      },
      toggleFavoriteEnv(envId, isOn) {
        if (isOn) {
          setFavoriteEnvIds([...favoriteEnvIds, envId]);
        } else {
          setFavoriteEnvIds(favoriteEnvIds.filter(id => id !== envId));
        }
      },
      toggleFavoriteApp(appId, isOn) {
        if (isOn) {
          setFavoriteAppIds([...favoriteAppIds, appId]);
        } else {
          setFavoriteAppIds(favoriteAppIds.filter(id => id !== appId));
        }
      },
      reset() {
        setEnv(undefined);
        setApp(undefined);
        setSubstitution(undefined);
        setRecentJumps([]);
      },
      domainPart,
      appPart,
      recentJumps: recentJumps
    };
  }, [env, app, data, recentJumps, setRecentJumps, substitution, favoriteAppIds, favoriteEnvIds]);

  return <EhContext.Provider value={value}>{children}</EhContext.Provider>;
}
