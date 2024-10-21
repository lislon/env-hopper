import { ReactNode } from 'react';
import { getJumpUrl } from '../../lib/utils';
import { EhApp, EhEnv } from '@env-hopper/types';
import { EhSubstitutionValue } from '../../types';
import { useEhContext } from '../../context/EhContext';

export interface JumpUrlParams {
  children: ReactNode;
  app?: EhApp;
  env?: EhEnv;
  id?: string;
  substitution?: EhSubstitutionValue;
  className?: string;
  isMain?: boolean;
  prefetch?: boolean;
  testId?: string;
}

export function JumpALink({
  children,
  app,
  id,
  env,
  substitution,
  className,
  isMain,
  testId,
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
      id={id}
      data-testid={testId}
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
