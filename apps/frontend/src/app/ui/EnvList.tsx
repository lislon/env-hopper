'use client';
import React, { useMemo } from 'react';
import cn from 'classnames';
import { useEhContext } from '../context/EhContext';
import { EhAutoComplete, Item } from './EhAutoComplete';
import { autoCompleteFilter } from '../lib/autoCompleteFilter';
import { EhEnv, EhEnvId } from '@env-hopper/types';


function mapToAutoCompleteItem(env: EhEnv, favorites: Set<EhEnvId>, recents: Set<EhEnvId>): Item {
  return { id: env.name, title: env.name, favorite: favorites.has(env.name), recent: recents.has(env.name) };
}

export interface EnvListProps {
  onOpenChange?: (isOpen: boolean) => void;
}
export function EnvList({ onOpenChange }: EnvListProps) {
  const { setEnv, listEnvs, listFavoriteEnvs, env, getEnvById, toggleFavoriteEnv, recentJumps } = useEhContext();

  const items = useMemo(() => {
    const favSet = new Set(listFavoriteEnvs);
    const recentSet = new Set(recentJumps.slice(0, 2).map(jump => jump.env || '').filter(Boolean));
    return listEnvs.map(env => mapToAutoCompleteItem(env, favSet, recentSet))
  }, [listEnvs, listFavoriteEnvs, recentJumps])

  return <EhAutoComplete itemsAll={items} filter={autoCompleteFilter}
                         onOpenChange={onOpenChange}
                         selectedItem={env ? mapToAutoCompleteItem(env, new Set(), new Set()) : undefined}
                         onSelectedItemChange={(envId) => setEnv(getEnvById(envId))}
                         onFavoriteToggle={(env, isOn) => toggleFavoriteEnv(env.id, isOn)}
  />
    {/*<div className="flex gap-2 my-2">*/}
    {/*  <span aria-label="Favorites">⭐</span>*/}
    {/*  <ul className="inline-flex gap-2">*/}
    {/*    {listFavoriteEnvs.map(envId => <li key={envId}*/}
    {/*                                       className={cn('border px-2 rounded-lg hover:bg-gray-500 hover:cursor-pointer hover:border-solid',*/}
    {/*                                   envId === env?.name ? 'border-solid border-amber-300 text-amber-300' : 'border-dashed border-gray-300 ')}*/}
    {/*                                       onClick={() => setEnv(getEnvById(envId === env?.name ? undefined : envId))}>{envId}</li>)}*/}
    {/*  </ul>*/}
    {/*</div>*/}

}
