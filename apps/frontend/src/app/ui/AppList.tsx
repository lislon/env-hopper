'use client';
import React, { useMemo } from 'react';
import { useEhContext } from '../context/EhContext';
import { EhAutoComplete, Item, ShortcutAction } from './EhAutoComplete';
import { autoCompleteFilter } from '../lib/autoCompleteFilter';
import { findSubstitutionTypeInApp, getJumpUrl } from '../lib/utils';
import { EhApp, EhAppId, EhEnv, EhSubstitutionType } from '@env-hopper/types';
import { EhSubstitutionValue } from '../types';

export function formatUrl(env: EhEnv, urlPattern: string) {
  return urlPattern.replace('{env}', env.name);
}

function mapToAutoCompleteItemApp(
  app: EhApp,
  favorites: Set<EhAppId>,
  recents: Set<EhAppId>
): Item {
  return {
    id: app.name,
    title: app.name,
    favorite: favorites.has(app.name),
    recent: recents.has(app.name),
  };
}

interface ShortcutUniversalParams {
  app?: EhApp;
  env?: EhEnv;
  substitution?: EhSubstitutionValue;
  listSubstitutions: EhSubstitutionType[];
}

function shortcutUniversal({
  app,
  env,
  substitution,
  listSubstitutions,
}: ShortcutUniversalParams): ShortcutAction | undefined {
  if (app === undefined || env === undefined) {
    return undefined;
  }
  const link = getJumpUrl({ app: app, env: env, substitution });

  if (link !== undefined) {
    return { link };
  }
  const substitutionType = findSubstitutionTypeInApp(
    app,
    env,
    listSubstitutions
  );
  if (substitutionType !== undefined) {
    return {
      substitutionTitle: substitutionType?.title,
    };
  }
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
      filter={autoCompleteFilter}
      label="Application"
      placeholder="Select application"
      onOpenChange={onOpenChange}
      selectedItem={
        app ? mapToAutoCompleteItemApp(app, new Set(), new Set()) : null
      }
      onSelectedItemChange={(envId) => setApp(getAppById(envId))}
      onFavoriteToggle={(env, isOn) => toggleFavoriteApp(env.id, isOn)}
    />
  );
}
