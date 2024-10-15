import { useEhContext } from '../../context/EhContext';
import React, { useMemo } from 'react';
import { EhAppId } from '@env-hopper/types';
import { BarElement, InternalCommonBar } from './InternalCommonBar';
import { MAX_RECENTLY_USED_ITEMS_COMBO } from '../../lib/constants';
import { uniq } from 'lodash';
import { getEhUrl } from '../../lib/utils';

export function AppQuickBar() {
  const {
    listFavoriteApps,
    setApp,
    getAppById,
    app,
    recentJumps,
    env,
    substitution,
  } = useEhContext();

  const favorites = useMemo<BarElement<string>[]>(() => {
    return listFavoriteApps.map((appId) => {
      return {
        id: appId,
        title: getAppById(appId)?.title || '',
      };
    });
  }, [listFavoriteApps, getAppById]);

  const recent = useMemo<BarElement<string>[]>(() => {
    return uniq(
      recentJumps.map((recent) => recent.app).filter((id) => id !== undefined),
    )
      .slice(0, MAX_RECENTLY_USED_ITEMS_COMBO)
      .map((id) => {
        return {
          id: id,
          title: getAppById(id)?.title || '',
        };
      });
  }, [recentJumps, getAppById]);

  const onClick = (appId: EhAppId) => {
    setApp(getAppById(appId));
  };

  return (
    <>
      <InternalCommonBar
        activeId={app?.id}
        list={recent}
        onClick={onClick}
        comboboxType={'applications'}
        favoriteOrRecent={'recent'}
        getEhLink={(id) => getEhUrl(env?.id, id, substitution?.value)}
      />
      <InternalCommonBar
        activeId={app?.id}
        list={favorites}
        onClick={onClick}
        comboboxType={'applications'}
        favoriteOrRecent={'favorite'}
        getEhLink={(id) => getEhUrl(env?.id, id, substitution?.value)}
      />
    </>
  );
}
