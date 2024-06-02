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
  const { setEnv, listEnvs, listFavoriteEnvs, env, getEnvById } = useEhContext();

  return <div>
    <EhAutoComplete items={listEnvs.map(env => mapToAutoCompleteItem(env))} filter={autoCompleteFilter}
                    label="What env to hop on?"
                    selectedItem={env ? mapToAutoCompleteItem(env) : undefined}
                    onSelectedItemChange={(envId) => setEnv(getEnvById(envId))} />
    <div className="flex gap-2 my-2">
      <span aria-label="Favorites">⭐</span>
      <ul className="inline-flex gap-2">
        {listFavoriteEnvs.map(envId => <li key={envId}
                                           className={cn('border px-2 rounded-lg hover:bg-gray-500 hover:cursor-pointer hover:border-solid',
                                       envId === env?.name ? 'border-solid border-amber-300 text-amber-300' : 'border-dashed border-gray-300 ')}
                                           onClick={() => setEnv(getEnvById(envId === env?.name ? undefined : envId))}>{envId}</li>)}
      </ul>
    </div>
  </div>;

}
