'use client';
import React, { useMemo } from 'react';
import { useEhContext } from '../context/EhContext';
import { EhAutoComplete } from './AutoComplete/EhAutoComplete';
import { makeAutoCompleteFilter } from '../lib/autoCompleteFilter';
import { EhApp, EhAppId } from '@env-hopper/types';
import { Item } from './AutoComplete/common';

function mapToAutoCompleteItemApp(
  app: EhApp,
  favorites: Set<EhAppId>,
  recents: Set<EhAppId>
): Item {
  return {
    id: app.id,
    title: app.title,
    favorite: favorites.has(app.id),
    recent: recents.has(app.id),
  };
}

export interface AppListProps {
  onOpenChange?: (isOpen: boolean) => void;
}

export function AppList({ onOpenChange }: AppListProps) {
  const {
    app,
    listApps,
    setApp,
    listFavoriteApps,
    recentJumps,
    toggleFavoriteApp,
    getAppById,
    tryJump,
  } = useEhContext();

  const items = useMemo(() => {
    const favSet = new Set(listFavoriteApps);
    const recentSet = new Set(
      recentJumps
        .slice(0, 2)
        .map((jump) => jump.app || '')
        .filter(Boolean)
    );
    return listApps.map((env) =>
      mapToAutoCompleteItemApp(env, favSet, recentSet)
    );
  }, [listApps, listFavoriteApps, recentJumps]);

  return (
    <EhAutoComplete
      itemsAll={items}
      filter={makeAutoCompleteFilter(items)}
      label="Application"
      placeholder="Select application"
      onOpenChange={onOpenChange}
      selectedItem={
        app ? mapToAutoCompleteItemApp(app, new Set(), new Set()) : null
      }
      onCtrlEnter={tryJump}
      onSelectedItemChange={(envId) => setApp(getAppById(envId))}
      onFavoriteToggle={(env, isOn) => toggleFavoriteApp(env.id, isOn)}
    />
  );
}
