import { EhApp, EhAppId, EhEnv, EhEnvId } from '@env-hopper/types';
import { MainFormContextProviderProps } from './MainFormContextProvider';
import { useState } from 'react';
import { useEhContext } from './EhContext';
import { getAppWithEnvOverrides, getPreselectedBasedOnParams } from '../lib/utils';

export interface EhSelectedAppEnvContextProviderProps {
  envId?: EhEnvId;
  appId?: EhAppId;
  children: React.ReactNode;
}

export function EhSelectedAppEnvContextProvider({
                                                  children,
                                                  urlParams
                                                }: MainFormContextProviderProps) {

  const { config } = useEhContext();

  const [initialEnvAppSubBased] = useState(() => {
    return getPreselectedBasedOnParams({
      urlParams,
      config,
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

  return { env, app };
}
