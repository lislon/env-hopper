'use client';
import React, { useEffect, useRef } from 'react';
import { useEhContext } from '../../context/EhContext';
import { EhEnv, EhSubstitutionType } from '@env-hopper/types';
import { useAutoFocusHelper } from '../../hooks/useAutoFocusHelper';

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

  const autoFocusOn = useAutoFocusHelper();

  useEffect(() => {
    focusControllerSub?.setupFocusFn(() => {
      inputRef.current?.focus();
    });
  }, []);

  return (
    substitutionType && (
      <div className={props.className}>
        <label className="form-control w-full relative p-1">
          <div className="label prose">
            <h4>{substitutionType?.title}</h4>
          </div>

          <input
            aria-labelledby="context-label"
            data-testid="substitution-input"
            ref={inputRef}
            type="text"
            onFocus={() => {
              inputRef.current?.select();
            }}
            autoFocus={autoFocusOn === 'substitutions'}
            placeholder={`Enter ${substitutionType?.title}`}
            autoComplete={getAutoCompleteAttr(substitutionType, env)}
            name={getAutoCompleteName(substitutionType, env)}
            className="input input-bordered"
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
        </label>
      </div>
    )
  );
}
