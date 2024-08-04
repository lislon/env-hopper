'use client';
import React, { useMemo } from 'react';
import { useEhContext } from '../context/EhContext';
import { EhAutoComplete } from './AutoComplete/EhAutoComplete';
import { makeAutoCompleteFilter } from '../lib/autoCompleteFilter';
import { EhEnv, EhEnvId } from '@env-hopper/types';
import { Item } from './AutoComplete/common';

function mapToAutoCompleteItem(
  env: EhEnv,
  favorites: Set<EhEnvId>,
  recents: Set<EhEnvId>
): Item {
  return {
    id: env.name,
    title: env.name,
    favorite: favorites.has(env.name),
    recent: recents.has(env.name),
  };
}

export interface EnvListProps {
  onOpenChange?: (isOpen: boolean) => void;
}
export function EnvList({ onOpenChange }: EnvListProps) {
  const {
    setEnv,
    listEnvs,
    listFavoriteEnvs,
    env,
    getEnvById,
    toggleFavoriteEnv,
    recentJumps,
    tryJump,
  } = useEhContext();

  const items = useMemo(() => {
    const favSet = new Set(listFavoriteEnvs);
    const recentSet = new Set(
      recentJumps
        .slice(0, 2)
        .map((jump) => jump.env || '')
        .filter(Boolean)
    );
    return listEnvs.map((env) => mapToAutoCompleteItem(env, favSet, recentSet));
  }, [listEnvs, listFavoriteEnvs, recentJumps]);

  return (
    <EhAutoComplete
      itemsAll={items}
      filter={makeAutoCompleteFilter(items)}
      label="Environment"
      placeholder="Select environment"
      onOpenChange={onOpenChange}
      selectedItem={
        env ? mapToAutoCompleteItem(env, new Set(), new Set()) : null
      }
      onSelectedItemChange={(envId) => setEnv(getEnvById(envId))}
      onFavoriteToggle={(env, isOn) => toggleFavoriteEnv(env.id, isOn)}
      onCtrlEnter={tryJump}
    />
  );
}
