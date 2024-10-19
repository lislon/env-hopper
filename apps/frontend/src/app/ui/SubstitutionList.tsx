'use client';
import React, { useEffect, useRef } from 'react';
import { useEhContext } from '../context/EhContext';
import { EhEnv, EhSubstitutionType } from '@env-hopper/types';

function getAutoCompleteAttr(
  substitutionType: EhSubstitutionType,
  env: EhEnv | undefined,
) {
  if (!substitutionType.isBrowserAutocomplete) {
    return 'off';
  }
  if (!substitutionType.isSharedAcrossEnvs) {
    return env === undefined
      ? 'off'
      : `env-${env.id} eh-${substitutionType.id}`;
  }
  return `eh-${substitutionType.id}`;
}

function getAutoCompleteName(
  substitutionType: EhSubstitutionType,
  env: EhEnv | undefined,
) {
  if (!substitutionType.isBrowserAutocomplete) {
    return 'context';
  }
  if (!substitutionType.isSharedAcrossEnvs) {
    return env === undefined
      ? 'context'
      : `context-env-${env.id}-eh-${substitutionType.id}`;
  }
  return `context-eh-${substitutionType.id}`;
}

export interface SubstitutionListProps {
  className?: string;
}

export function SubstitutionList(props: SubstitutionListProps) {
  const {
    substitutionType,
    substitution,
    setSubstitution,
    env,
    tryJump,
    focusControllerSub,
  } = useEhContext();
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    focusControllerSub?.setupFocusFn(() => {
      inputRef.current?.focus();
    });
  }, []);

  return (
    substitutionType && (
      <div className={props.className}>
        <label className="w-fit" id={'context-label'}>
          {substitutionType?.title}
        </label>
        <div className="flex shadow-sm border dark:border-0 dark:bg-black gap-0.5">
          <input
            aria-labelledby="context-label"
            data-testid="substitution-input"
            ref={inputRef}
            type="text"
            onFocus={() => {
              inputRef.current?.select();
            }}
            placeholder={`Enter ${substitutionType?.title}`}
            autoComplete={getAutoCompleteAttr(substitutionType, env)}
            name={getAutoCompleteName(substitutionType, env)}
            className="w-full h-10 text-gray-500 p-2 text-xl rounded"
            value={substitution?.value || ''}
            onChange={(e) =>
              setSubstitution({
                value: e.target.value,
                name: substitutionType?.id,
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
    )
  );
}
