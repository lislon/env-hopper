import { useEhContext } from '../../context/EhContext';
import React, { useMemo } from 'react';
import { EhAppId } from '@env-hopper/types';
import {
  BarElement,
  InternalCommonBar,
  QuickBarSharedProps,
} from './InternalCommonBar';
import { MAX_RECENTLY_USED_ITEMS_COMBO } from '../../lib/constants';
import { uniq } from 'lodash';
import { getEhUrl } from '../../lib/utils';
import cn from 'classnames';
import { formatAppTitleShort } from '../../lib/format/FormatAppTitleShort';

export function AppQuickBar(props: QuickBarSharedProps) {
  const { listFavoriteApps, setApp, getAppById, app, recentJumps, env } =
    useEhContext();

  const favorites = useMemo<BarElement<string>[]>(() => {
    return listFavoriteApps
      .map((appId) => getAppById(appId))
      .filter((app) => app !== undefined)
      .map((app) => ({
        id: app.id,
        title: formatAppTitleShort(app),
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
          title: formatAppTitleShort(getAppById(id)),
        };
      });
  }, [recentJumps, getAppById]);

  const onClick = (appId: EhAppId) => {
    const appById = getAppById(appId);
    setApp(appById);
  };

  return (
    <div className={cn(props.className, 'flex flex-col gap-2')}>
      <InternalCommonBar
        activeId={app?.id}
        list={recent}
        onClick={onClick}
        comboboxType={'applications'}
        favoriteOrRecent={'recent'}
        getEhLink={(id) => getEhUrl(env?.id, id, undefined)}
      />
      <InternalCommonBar
        activeId={app?.id}
        list={favorites}
        onClick={onClick}
        comboboxType={'applications'}
        favoriteOrRecent={'favorite'}
        getEhLink={(id) => getEhUrl(env?.id, id, undefined)}
      />
    </div>
  );
}
