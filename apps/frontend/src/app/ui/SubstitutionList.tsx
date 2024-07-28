'use client';
import React from 'react';
import { useEhContext } from '../context/EhContext';
import { EhEnv, EhSubstitutionType } from '@env-hopper/types';
import { getJumpUrl } from '../lib/utils';

function getAutoCompleteAttr(
  substitutionType: EhSubstitutionType,
  env: EhEnv | undefined
) {
  if (!substitutionType.isBrowserAutocomplete) {
    return 'off';
  }
  if (!substitutionType.isSharedAcrossEnvs) {
    return env === undefined
      ? 'off'
      : `env-${env.name} eh-${substitutionType.name}`;
  }
  return `eh-${substitutionType.name}`;
}

function getAutoCompleteName(
  substitutionType: EhSubstitutionType,
  env: EhEnv | undefined
) {
  if (!substitutionType.isBrowserAutocomplete) {
    return 'context';
  }
  if (!substitutionType.isSharedAcrossEnvs) {
    return env === undefined
      ? 'context'
      : `context-env-${env.name}-eh-${substitutionType.name}`;
  }
  return `context-eh-${substitutionType.name}`;
}

export function SubstitutionList() {
  const {
    substitutionType,
    app,
    substitution,
    setSubstitution,
    env,
    recordJump,
    tryJump,
  } = useEhContext();
  if (!substitutionType) {
    return undefined;
  }
  return (
    <div>
      <label className="w-fit" htmlFor={'context'}>
        {substitutionType?.title}
      </label>
      <div className="flex shadow-sm border dark:border-0 dark:bg-black gap-0.5">
        <input
          type="text"
          placeholder={`Enter ${substitutionType?.title}`}
          autoComplete={getAutoCompleteAttr(substitutionType, env)}
          name={getAutoCompleteName(substitutionType, env)}
          autoFocus={true}
          className="w-full h-10 text-gray-500 p-2 text-xl"
          value={substitution?.value || ''}
          onChange={(e) =>
            setSubstitution({
              value: e.target.value,
              name: substitutionType?.name,
            })
          }
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              tryJump();
            }
          }}
        />
      </div>
    </div>
  );
}
