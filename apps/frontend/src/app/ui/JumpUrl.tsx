import { ReactNode } from 'react';
import { getJumpUrl } from '../lib/utils';
import { EhApp, EhEnv } from '@env-hopper/types';
import { EhSubstitutionValue } from '../types';
import { useEhContext } from '../context/EhContext';

export interface JumpUrlParams {
  children: ReactNode;
  app?: EhApp;
  env?: EhEnv;
  substitution?: EhSubstitutionValue;
  className?: string;
  isMain?: boolean;
  prefetch?: boolean;
}

export function JumpUrl({
  children,
  app,
  env,
  substitution,
  className,
  isMain,
}: JumpUrlParams) {
  const { recordJump } = useEhContext();

  const onClick = () => {
    if (!app || !env) {
      return;
    }
    recordJump({
      app: app,
      env: env,
      substitution,
    });
  };

  const jumpUrl = getJumpUrl({ app, env, substitution });
  if (!jumpUrl) {
    return undefined;
  }
  return (
    <a
      href={jumpUrl}
      onClick={onClick}
      onAuxClick={onClick}
      className={className}
      target="_blank"
      rel="noreferrer"
      title={isMain ? 'Jump to selected app' : undefined}
    >
      {children}
    </a>
  );
}
