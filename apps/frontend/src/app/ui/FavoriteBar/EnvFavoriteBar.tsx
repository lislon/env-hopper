import { useEhContext } from '../../context/EhContext';
import React, { useMemo } from 'react';
import { findLastIndex, sortBy } from 'lodash';
import { EhEnvId } from '@env-hopper/types';
import { InternalCommonBar } from './InternalCommonBar';
import { MAX_QUICK_LINKS } from '../../lib/constants';

export function EnvFavoriteBar() {
  const { listFavoriteEnvs, recentJumps, setEnv, getEnvById, env } =
    useEhContext();

  const sorted = useMemo(() => {
    const collection = listFavoriteEnvs.map((envId) => {
      const lastJumpIndex = findLastIndex(
        recentJumps,
        (jump) => jump.env === envId,
      );
      return {
        id: envId,
        title: envId.toLowerCase(),
        lastJumpIndex: -lastJumpIndex,
      };
    });
    const topRecent = sortBy(collection, 'lastJumpIndex')
      .filter((env) => getEnvById(env.id) !== undefined)
      .slice(0, MAX_QUICK_LINKS);
    return sortBy(topRecent, 'title');
  }, [listFavoriteEnvs, recentJumps, getEnvById]);

  const onClick = (envId: EhEnvId) => {
    setEnv(getEnvById(envId));
  };

  return (
    <InternalCommonBar activeId={env?.id} sorted={sorted} onClick={onClick} />
  );
}
