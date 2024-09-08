import { getJumpUrl } from '../lib/utils';
import { JumpUrl } from './JumpUrl';
import { EhApp, EhEnv } from '@env-hopper/types';
import { EhSubstitutionValue } from '../types';

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
        <JumpUrl app={app} env={env} substitution={substitution}>
          <div className="border border-dashed border-black dark:border-white rounded flex justify-center p-2 hover:border-solid hover:bg-gray-100 dark:hover:bg-gray-700 flex-col">
            <div className="text-center">JUMP</div>
          </div>
        </JumpUrl>
      </div>
    );
  }
  return null;
}
