import { getJumpUrl } from '../../lib/utils';
import { JumpALink } from './JumpALink';
import { EhApp, EhEnv } from '@env-hopper/types';
import { EhSubstitutionValue } from '../../types';

export interface JumpMiniButtonProps {
  env: EhEnv | undefined;
  app: EhApp | undefined;
  substitution: EhSubstitutionValue | undefined;
}

export function JumpMiniButton({
  env,
  app,
  substitution,
}: JumpMiniButtonProps) {
  if (env === undefined || app === undefined) {
    return undefined;
  }
  const url = getJumpUrl({ app, env, substitution });
  if (url !== undefined) {
    return (
      <div className="relative">
        <JumpALink
          app={app}
          env={env}
          substitution={substitution}
          className={'btn btn-outline btn-sm'}
        >
          <div className="text-center">JUMP</div>
        </JumpALink>
      </div>
    );
  }
  return null;
}
