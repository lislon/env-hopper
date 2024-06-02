import { ReactNode } from 'react';
import { useEhContext } from '../context/EhContext';
import { getJumpUrl, jump } from '../lib/utils';
import { EhApp, EhEnv } from '@env-hopper/types';
import { EhSubstitutionValue } from '../types';

export interface JumpUrlParams {
  children: ReactNode;
  app?: EhApp
  env?: EhEnv,
  substitution?: EhSubstitutionValue
  className?: string;
}

export function JumpUrl({ children, app, env, substitution, className }: JumpUrlParams) {

  const onClick = () => {
    if (!app || !env) {
      return;
    }
    jump({
      app: app,
      env: env,
      substitution
    });
  };

  const jumpUrl = getJumpUrl({ app, env, substitution });
  if (!jumpUrl) {
    return undefined;
  }
  return <a href={jumpUrl} onClick={() => onClick()} className={className}>
    {children}
  </a>;
}
