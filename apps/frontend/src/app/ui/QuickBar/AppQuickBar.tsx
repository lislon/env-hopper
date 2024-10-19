import { useEhContext } from '../../context/EhContext';
import React, { useMemo } from 'react';
import { EhApp, EhAppId } from '@env-hopper/types';
import {
  BarElement,
  InternalCommonBar,
  QuickBarSharedProps,
} from './InternalCommonBar';
import { MAX_RECENTLY_USED_ITEMS_COMBO } from '../../lib/constants';
import { uniq } from 'lodash';
import { getEhUrl } from '../../lib/utils';
import cn from 'classnames';

function getTitle(appById: EhApp) {
  return appById.title || '';
}

export function AppQuickBar(props: QuickBarSharedProps) {
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
    return listFavoriteApps
      .map((appId) => getAppById(appId))
      .filter((app) => app !== undefined)
      .map((app) => ({
        id: app.id,
        title: getTitle(app),
      }));
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
    const appById = getAppById(appId);
    setApp(app?.id !== appId ? appById : undefined);
  };

  return (
    <div className={cn(props.className)}>
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
    </div>
  );
}
