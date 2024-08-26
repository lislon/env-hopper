import { useEhContext } from '../../context/EhContext';
import React, { useMemo } from 'react';
import { findLastIndex, sortBy } from 'lodash';
import { EhAppId } from '@env-hopper/types';
import { InternalCommonBar, MAX_ITEMS_IN_BAR } from './InternalCommonBar';

export function AppFavoriteBar() {
  const { listFavoriteApps, recentJumps, setApp, getAppById, app } =
    useEhContext();

  const sorted = useMemo(() => {
    const collection = listFavoriteApps.map((appId) => {
      const lastJumpIndex = findLastIndex(
        recentJumps,
        (jump) => jump.app === appId,
      );
      const foundApp = getAppById(appId);
      return {
        id: appId,
        title: foundApp?.title || '',
        lastJumpIndex: -lastJumpIndex,
      };
    });
    const topRecent = sortBy(collection, 'lastJumpIndex')
      .filter((a) => a.title !== '')
      .slice(0, MAX_ITEMS_IN_BAR);
    return sortBy(topRecent, 'title');
  }, [listFavoriteApps, recentJumps, getAppById]);

  const onClick = (appId: EhAppId) => {
    setApp(getAppById(appId));
  };

  return (
    <InternalCommonBar activeId={app?.id} sorted={sorted} onClick={onClick} />
  );
}
