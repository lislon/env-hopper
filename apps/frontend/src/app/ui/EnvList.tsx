'use client';
import React from 'react';
import cn from 'classnames';
import { useEhContext } from '../context/EhContext';
import { EhAutoComplete } from './EhAutoComplete';
import { autoCompleteFilter } from '../lib/autoCompleteFilter';
import { EhEnv } from '@env-hopper/types';


function mapToAutoCompleteItem(env: EhEnv) {
  return { id: env.name, title: env.name };
}

export function EnvList() {
  const { setActiveEnv, envs, favoriteEnvs, activeEnv, getEnvById } = useEhContext();

  return <div>
    <EhAutoComplete items={envs.map(env => mapToAutoCompleteItem(env))} filter={autoCompleteFilter}
                    label="What env to hop on?"
                    selectedItem={activeEnv ? mapToAutoCompleteItem(activeEnv) : null}
                    onSelectedItemChange={(envId) => setActiveEnv(getEnvById(envId))} />
    <div className="flex gap-2 my-2">
      <span aria-label="Favorites">⭐</span>
      <ul className="inline-flex gap-2">
        {favoriteEnvs.map(envId => <li key={envId}
                                     className={cn('border px-2 rounded-lg hover:bg-gray-500 hover:cursor-pointer hover:border-solid',
                                       envId === activeEnv?.name ? 'border-solid border-amber-300 text-amber-300' : 'border-dashed border-gray-300 ')}
                                     onClick={() => setActiveEnv(getEnvById(envId === activeEnv?.name ? null : envId))}>{envId}</li>)}
      </ul>
    </div>
  </div>;

}
