'use client';
import React, { useMemo } from 'react';
import { useEhContext } from '../context/EhContext';
import { EhAutoComplete } from './AutoComplete/EhAutoComplete';
import { makeAutoCompleteFilter } from '../lib/autoComplete/autoCompleteFilter';
import { EhApp, EhAppId } from '@env-hopper/types';
import { Item } from './AutoComplete/common';
import { useAutoFocusHelper } from '../hooks/useAutoFocusHelper';
import { MAX_RECENTLY_USED_ITEMS_COMBO } from '../lib/constants';
import { HomeFavoriteButton } from './HomeFavoriteButton';
import { formatAppTitle, getEhUrl } from '../lib/utils';
import cn from 'classnames';

function mapToAutoCompleteItemApp(
  app: EhApp,
  favorites: Set<EhAppId>,
  recents: Set<EhAppId>,
): Item {
  return {
    id: app.id,
    title: formatAppTitle(app),
    favorite: favorites.has(app.id),
    recent: recents.has(app.id),
  };
}

export interface AppListProps {
  onOpenChange?: (isOpen: boolean) => void;
  className?: string;
}

export function AppList({ onOpenChange, className }: AppListProps) {
  const {
    app,
    env,
    substitution,
    listApps,
    setApp,
    listFavoriteApps,
    recentJumps,
    toggleFavoriteApp,
    getAppById,
    tryJump,
    highlightAutoComplete,
  } = useEhContext();

  const autoFocusOn = useAutoFocusHelper();

  const items = useMemo(() => {
    const favSet = new Set(listFavoriteApps);
    const recentSet = new Set(
      recentJumps
        .slice(0, MAX_RECENTLY_USED_ITEMS_COMBO)
        .map((jump) => jump.app || '')
        .filter(Boolean),
    );
    return listApps.map((env) =>
      mapToAutoCompleteItemApp(env, favSet, recentSet),
    );
  }, [listApps, listFavoriteApps, recentJumps]);

  const autoCompleteFilter = useMemo(
    () => makeAutoCompleteFilter(items),
    [items],
  );

  const isFavorite = listFavoriteApps.includes(app?.id || '');
  return (
    <EhAutoComplete
      itemsAll={items}
      filter={autoCompleteFilter}
      label="Application"
      placeholder="Select application"
      onOpenChange={onOpenChange}
      selectedItem={items.find((i) => i.id === app?.id) || null}
      onTryJump={tryJump}
      onSelectedItemChange={(appId) => setApp(getAppById(appId))}
      onFavoriteToggle={(app, isOn) => toggleFavoriteApp(app.id, isOn)}
      autoFocus={autoFocusOn === 'applications'}
      favoriteButton={
        app ? (
          <HomeFavoriteButton
            isFavorite={isFavorite}
            onClick={() => toggleFavoriteApp(app.id, !isFavorite)}
            title={`${isFavorite ? `Remove from` : `Add to`} favorites`}
          />
        ) : undefined
      }
      getEhUrl={(id) => getEhUrl(env?.id, id, substitution?.value)}
      className={className}
      inputClassName={cn({
        ['border-4 border-accent animate-bounce']:
          highlightAutoComplete === 'applications',
      })}
    />
  );
}
