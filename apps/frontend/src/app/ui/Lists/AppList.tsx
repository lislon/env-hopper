'use client';
import React, { useMemo } from 'react';
import { useEhContext } from '../../context/EhContext';
import { EhAutoComplete } from '../AutoComplete/EhAutoComplete';
import { makeAutoCompleteFilter } from '../../lib/autoComplete/autoCompleteFilter';
import { EhApp, EhAppId, EhEnv } from '@env-hopper/types';
import { SourceItem } from '../AutoComplete/common';
import { useAutoFocusHelper } from '../../hooks/useAutoFocusHelper';
import { MAX_RECENTLY_USED_ITEMS_COMBO } from '../../lib/constants';
import { HomeFavoriteButton } from '../HomeFavoriteButton';
import {
  findSubstitutionIdByUrl,
  formatAppTitle,
  getEhUrl,
} from '../../lib/utils';
import cn from 'classnames';
import {
  AUTOCOMPLETE_ATTENTION_CLASSNAME,
  mapToSectionedItems,
} from './commonList';
import { first } from 'lodash';

function mapToAutoCompleteItemApp(
  app: EhApp,
  favorites: Set<EhAppId>,
  recents: Set<EhAppId>,
  env: EhEnv | undefined,
): SourceItem {
  return {
    id: app.id,
    title: formatAppTitle(app),
    favorite: favorites.has(app.id),
    recent: recents.has(app.id),
    substitutionId: findSubstitutionIdByUrl({ app, env }),
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
    listApps,
    listEnvs,
    setApp,
    listFavoriteApps,
    recentJumps,
    toggleFavoriteApp,
    getAppById,
    tryJump,
    highlightAutoComplete,
    substitutionType,
    substitution,
  } = useEhContext();

  const autoFocusOn = useAutoFocusHelper();

  const firstEnv = first(listEnvs);

  const items = useMemo(() => {
    const favSet = new Set(listFavoriteApps);
    const recentSet = new Set(
      recentJumps
        .slice(0, MAX_RECENTLY_USED_ITEMS_COMBO)
        .map((jump) => jump.app || '')
        .filter(Boolean),
    );
    return listApps.map((app) =>
      mapToAutoCompleteItemApp(app, favSet, recentSet, firstEnv),
    );
  }, [listApps, listFavoriteApps, recentJumps, firstEnv]);

  const autoCompleteFilter = useMemo(
    () => makeAutoCompleteFilter(items),
    [items],
  );

  const isFavorite = listFavoriteApps.includes(app?.id || '');

  const hasSubstitutionValue = !!substitution?.value;
  const allSectionedItems = useMemo(() => {
    return mapToSectionedItems(
      items,
      hasSubstitutionValue ? substitutionType?.id : undefined,
    );
  }, [items, substitutionType, hasSubstitutionValue]);

  return (
    <EhAutoComplete
      allSectionedItems={allSectionedItems}
      tmpSameSubstitutionTitle={
        substitutionType?.title
          ? `${substitutionType?.title}: ${substitution?.value}`
          : undefined
      }
      itemsAll={items}
      filter={autoCompleteFilter}
      label="Application"
      placeholder="Select application"
      onOpenChange={onOpenChange}
      selectedItem={items.find((i) => i.id === app?.id) || null}
      onPrimaryAction={tryJump}
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
      getEhUrl={(id) => getEhUrl(env?.id, id, undefined)}
      className={cn(
        className,
        highlightAutoComplete === 'applications' &&
          AUTOCOMPLETE_ATTENTION_CLASSNAME,
      )}
    />
  );
}
