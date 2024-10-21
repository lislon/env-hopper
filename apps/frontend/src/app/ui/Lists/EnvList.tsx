'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useEhContext } from '../../context/EhContext';
import {
  EhAutoComplete,
  EhAutoCompleteFilter,
} from '../AutoComplete/EhAutoComplete';
import { makeAutoCompleteFilter } from '../../lib/autoComplete/autoCompleteFilter';
import { EhEnv, EhEnvId } from '@env-hopper/types';
import { Item } from '../AutoComplete/common';
import { useAutoFocusHelper } from '../../hooks/useAutoFocusHelper';
import { MAX_RECENTLY_USED_ITEMS_COMBO } from '../../lib/constants';
import { HomeFavoriteButton } from '../HomeFavoriteButton';
import { getEhUrl } from '../../lib/utils';
import { tokenize } from '../../lib/autoComplete/tokenize';
import { shuffle, sortBy } from 'lodash';
import cn from 'classnames';
import { AUTOCOMPLETE_ATTENTION_CLASSNAME } from './commonList';

function mapToAutoCompleteItem(
  env: EhEnv,
  favorites: Set<EhEnvId>,
  recents: Set<EhEnvId>,
): Item {
  return {
    id: env.id,
    title: env.id,
    favorite: favorites.has(env.id),
    recent: recents.has(env.id),
  };
}

export interface EnvListProps {
  onOpenChange?: (isOpen: boolean) => void;
  className?: string;
}

function findGoodExample(
  envIds: EhEnvId[],
  autoCompleteFilter: EhAutoCompleteFilter,
  items: Item[],
): string | undefined {
  function getSearch(tokens: string[]) {
    if (tokens.length >= 2) {
      return tokens[0] + tokens[tokens.length - 1];
    }
    return tokens[0];
  }

  const envsLongestFirst = sortBy(envIds, (s) => -s.length);
  const candidates = shuffle(
    envsLongestFirst.map((env) => ({ env, tokens: tokenize(env) })),
  );
  const found = candidates.find(({ tokens }) => {
    return autoCompleteFilter(getSearch(tokens), items)?.length === 1;
  });
  if (found) {
    const [firstToken, ...restTokens] = found.tokens;
    const lastToken = restTokens.slice(-1)[0];
    let firstShortestToken = firstToken;
    for (let i = 3; i < firstToken.length; i++) {
      const search = getSearch([firstToken.slice(0, i), lastToken]);
      if (autoCompleteFilter(search, items)?.length === 1) {
        firstShortestToken = firstToken.slice(0, i);
        break;
      }
    }
    return getSearch([firstShortestToken, lastToken]);
  } else {
    return undefined;
  }
}

export function EnvList({ onOpenChange, className }: EnvListProps) {
  const {
    app,
    setEnv,
    listEnvs,
    listFavoriteEnvs,
    env,
    getEnvById,
    toggleFavoriteEnv,
    recentJumps,
    tryJump,
    highlightAutoComplete,
  } = useEhContext();

  const items = useMemo(() => {
    const favSet = new Set(listFavoriteEnvs);
    const recentSet = new Set(
      recentJumps
        .slice(0, MAX_RECENTLY_USED_ITEMS_COMBO)
        .map((jump) => jump.env || '')
        .filter(Boolean),
    );
    return listEnvs.map((env) => mapToAutoCompleteItem(env, favSet, recentSet));
  }, [listEnvs, listFavoriteEnvs, recentJumps]);

  const autoFocusOn = useAutoFocusHelper();

  const autoCompleteFilter = useMemo(
    () => makeAutoCompleteFilter(items),
    [items],
  );
  const isFavorite = listFavoriteEnvs.includes(env?.id || '');
  const selectedItem = items.find((i) => i.id === env?.id) || null;

  const [placeHolder, setPlaceHolder] = useState('');

  useEffect(() => {
    if (listEnvs.length > 0 && placeHolder === '') {
      const exampleFromRecents = findGoodExample(
        recentJumps.map((s) => s.env).filter((env) => env !== undefined),
        autoCompleteFilter,
        items,
      );
      const example =
        exampleFromRecents ||
        findGoodExample(
          listEnvs?.map((s) => s.id),
          autoCompleteFilter,
          items,
        );
      setPlaceHolder(
        example
          ? `Type or select environment, for example: ${example}`
          : 'Type or select environment',
      );
    }
  }, [recentJumps, listEnvs, autoCompleteFilter]);

  return (
    <EhAutoComplete
      itemsAll={items}
      filter={autoCompleteFilter}
      label="Environment"
      placeholder={placeHolder}
      onOpenChange={onOpenChange}
      selectedItem={selectedItem}
      onSelectedItemChange={(envId) => {
        setEnv(getEnvById(envId));
      }}
      onFavoriteToggle={(env, isOn) => toggleFavoriteEnv(env.id, isOn)}
      onTryJump={tryJump}
      autoFocus={autoFocusOn === 'environments'}
      favoriteButton={
        env ? (
          <HomeFavoriteButton
            isFavorite={isFavorite}
            onClick={() => toggleFavoriteEnv(env.id, !isFavorite)}
            title={`${isFavorite ? `Remove from` : `Add to`} favorites`}
          />
        ) : undefined
      }
      getEhUrl={(id) => getEhUrl(id, app?.id, undefined)}
      className={cn(
        className,
        highlightAutoComplete === 'environments' &&
          AUTOCOMPLETE_ATTENTION_CLASSNAME,
      )}
    />
  );
}
