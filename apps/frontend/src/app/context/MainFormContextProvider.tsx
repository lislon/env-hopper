'use client';
import { EhApp, EhAppId, EhEnv, EhEnvId, EhLastUsedSubs, EhSubstitutionType } from '@env-hopper/types';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ComboBoxType, EhEnvAppSubSelectedState, EhSubstitutionValue } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  cutApp,
  cutDomain,
  findSubstitutionIdByUrl,
  formatAppTitle,
  getAppWithEnvOverrides,
  getJumpUrl,
  getJumpUrlEvenNotComplete, getPreselectedBasedOnParams, getSubstitutionBasedOnAppAndLastUsed
} from '../lib/utils';
import { usePrefetch } from '../hooks/usePrefetch';
import { FocusControllerEh, useFocusController } from '../lib/focusController';
import { omit } from 'lodash';
import { useNavigate } from '@tanstack/react-router';
import { getEhToOptions } from '../lib/route-utils';
import {
  LOCAL_STORAGE_KEY_LAST_USED_APP,
  LOCAL_STORAGE_KEY_LAST_USED_ENV,
  LOCAL_STORAGE_KEY_LAST_USED_SUBS
} from '../lib/local-storage-constants';
import { doGetAppById, EhContextProps, useEhContext } from './EhContext';

export interface EhMainFormContextProps extends FocusControllerEh {
  setEnv: (env: EhEnv | undefined) => void;
  setApp: (app: EhApp | undefined) => void;
  setSubstitution: (substitution: EhSubstitutionValue | undefined) => void;
  env: EhEnv | undefined;
  app: EhApp | undefined;
  substitution: EhSubstitutionValue | undefined;
  substitutionType: EhSubstitutionType | undefined;
  // recordJump(jump: EhJumpParams): void;
  tryJump(): void;

  domainPart: string;
  appPart: string;
  highlightAutoComplete: ComboBoxType | undefined;
  setHighlightAutoComplete: (highlight: ComboBoxType | undefined) => void;
}

//  createContext is not supported in Server Components
const EhMainFormContext = createContext<EhMainFormContextProps | undefined>(
  undefined,
);

export function useMainAppFormContext(): EhMainFormContextProps &
  EhContextProps {
  const ehContext = useEhContext();
  const mainFormContext = useContext(EhMainFormContext);
  if (mainFormContext === undefined) {
    throw new Error('EhMainFormContext is not provided');
  }
  return { ...ehContext, ...mainFormContext };
}

export interface MainFormContextProviderProps {
  children: React.ReactNode;
  urlParams: EhEnvAppSubSelectedState;
}

export function MainFormContextProvider({
  children,
  urlParams,
}: MainFormContextProviderProps) {
  const { config, listApps, listEnvs, recordJump } = useEhContext();

  const navigate = useNavigate();
  const [lastUsedApp, setLastUsedApp] = useLocalStorage<EhAppId | undefined>(
    LOCAL_STORAGE_KEY_LAST_USED_APP,
    undefined,
  );
  const [lastUsedEnv, setLastUsedEnv] = useLocalStorage<EhEnvId | undefined>(
    LOCAL_STORAGE_KEY_LAST_USED_ENV,
    undefined,
  );
  const [lastUsedSubs, setLastUsedSubs] = useLocalStorage<
    EhLastUsedSubs | undefined
  >(LOCAL_STORAGE_KEY_LAST_USED_SUBS, undefined);

  const [initialEnvAppSubBased] = useState(() => {
    return getPreselectedBasedOnParams({
      urlParams,
      config,
      lastUsedApp,
      lastUsedSubs,
      lastUsedEnv,
    });
  });

  const [env, setEnv] = useState<EhEnv | undefined>(
    () => initialEnvAppSubBased.env,
  );
  const [app, setApp] = useState<EhApp | undefined>(() =>
    getAppWithEnvOverrides(
      initialEnvAppSubBased.app,
      initialEnvAppSubBased.env,
    ),
  );
  const [substitution, setSubstitution] = useState<
    EhSubstitutionValue | undefined
  >(initialEnvAppSubBased.substitution);

  const fixUrlBasedOnSelection = useCallback(
    async (state: EhEnvAppSubSelectedState, replace = false) => {
      await navigate({
        ...getEhToOptions(state),
        replace,
      });
    },
    [navigate],
  );

  useEffect(() => {
    if (initialEnvAppSubBased.urlWasFixed) {
      void fixUrlBasedOnSelection(
        {
          envId: initialEnvAppSubBased?.env?.id,
          appId: initialEnvAppSubBased.app?.id,
          subValue: initialEnvAppSubBased.substitution?.value,
        },
        true,
      );
    }
  }, [initialEnvAppSubBased]);

  useEffect(() => {
    if (urlParams.envId !== env?.id || urlParams.appId !== app?.id) {
      void fixUrlBasedOnSelection({ envId: env?.id, appId: app?.id }, true);
    }
  }, [app, env, urlParams]);

  useEffect(() => {
    if (app && env) {
      document.title = `${env.id} - ${formatAppTitle(app)} - Env Hopper`;
    } else if (app) {
      document.title = `${formatAppTitle(app)} - Env Hopper`;
    } else if (env) {
      document.title = `${env.id} - Env Hopper`;
    } else {
      document.title = `Env Hopper`;
    }
  }, [env, app]);

  const prefetch = usePrefetch();
  useEffect(() => {
    const jumpUrl = getJumpUrl({ app, env, substitution });
    if (jumpUrl !== undefined) {
      prefetch(jumpUrl);
    }
  }, [app, env, prefetch, substitution]);

  const substitutionName = useMemo(
    () =>
      findSubstitutionIdByUrl({
        app,
        env: listEnvs?.[0],
      }),
    [app, listEnvs],
  );

  const substitutionType = useMemo(
    () =>
      config.substitutions.find((s) => s.id === substitutionName || undefined),
    [config.substitutions, substitutionName],
  );

  const { focusControllerEnv, focusControllerSub, focusControllerApp } =
    useFocusController({
      app,
      env,
      substitutionType,
    });

  const [highlightAutoComplete, setHighlightAutoComplete] = useState<
    ComboBoxType | undefined
  >();

  const firstApp = app ? app : listApps.length > 0 ? listApps[0] : undefined;
  const firstEnv = env ? env : listEnvs.length > 0 ? listEnvs[0] : undefined;
  const incompleteUrl =
    firstApp &&
    getJumpUrlEvenNotComplete({
      app: firstApp,
      env: firstEnv,
      substitution: substitution,
    });

  const domainPart = cutDomain(incompleteUrl || 'https://no-env');
  const appPart = cutApp(incompleteUrl || 'https://no-env/no-app');

  const value: EhMainFormContextProps = {
    setEnv: useCallback<EhMainFormContextProps['setEnv']>(
      (env) => {
        setEnv(env);
        setApp(getAppWithEnvOverrides(doGetAppById(app?.id, listApps), env));
        setLastUsedEnv(env?.id);
      },
      [setEnv, setLastUsedEnv, setApp, app],
    ),
    env,
    setApp: useCallback<EhMainFormContextProps['setApp']>(
      (app) => {
        setApp(getAppWithEnvOverrides(doGetAppById(app?.id, listApps), env));
        setLastUsedApp(app?.id);
        const substitutionBasedOnAppAndLastUsed =
          getSubstitutionBasedOnAppAndLastUsed(app, listEnvs, lastUsedSubs);
        setSubstitution(substitutionBasedOnAppAndLastUsed);
      },
      [setApp, setLastUsedApp, lastUsedSubs, listEnvs, env],
    ),
    app,
    substitutionType,
    substitution,
    setSubstitution: useCallback<EhMainFormContextProps['setSubstitution']>(
      (substitution) => {
        setSubstitution(substitution);
        if (substitution?.name) {
          setLastUsedSubs((prev) => {
            if (substitution.value === '') {
              return prev ? omit(prev, substitution.name) : undefined;
            }
            return {
              ...prev,
              [substitution.name]: substitution.value,
            };
          });
        }
      },
      [],
    ),
    highlightAutoComplete,
    setHighlightAutoComplete: useCallback<
      EhMainFormContextProps['setHighlightAutoComplete']
    >((highlight) => {
      setHighlightAutoComplete(highlight);
    }, []),
    tryJump: useCallback(() => {
      const jumpUrl = getJumpUrl({ app, env, substitution });
      if (!jumpUrl) {
        return undefined;
      }
      recordJump({
        app,
        env,
        substitution,
      });
      window.open(jumpUrl, '_blank')?.focus();
    }, [getJumpUrl, recordJump, app, env, substitution]),
    domainPart,
    appPart,
    focusControllerEnv,
    focusControllerApp,
    focusControllerSub,
  };

  return (
    <EhMainFormContext.Provider value={value}>
      {children}
    </EhMainFormContext.Provider>
  );
}
