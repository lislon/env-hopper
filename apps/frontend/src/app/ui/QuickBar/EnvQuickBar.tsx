import { useEhContext } from '../../context/EhContext';
import React, { useMemo } from 'react';
import { EhEnvId } from '@env-hopper/types';
import { BarElement, InternalCommonBar } from './InternalCommonBar';
import { MAX_RECENT_ENVS_IN_QUICK_ACCESS } from '../../lib/constants';
import { getEhUrl } from '../../lib/utils';
import { uniq } from 'lodash';

export function EnvQuickBar() {
  const {
    listFavoriteEnvs,
    recentJumps,
    setEnv,
    getEnvById,
    env,
    app,
    substitution,
  } = useEhContext();

  const favorites = useMemo<BarElement<string>[]>(() => {
    return listFavoriteEnvs.map((envId) => {
      return {
        id: envId,
        title: envId,
      };
    });
  }, [listFavoriteEnvs]);

  const recent = useMemo<BarElement<string>[]>(() => {
    return uniq(
      recentJumps.map((recent) => recent.env).filter((id) => id !== undefined),
    )
      .slice(0, MAX_RECENT_ENVS_IN_QUICK_ACCESS)
      .map((envId) => {
        return {
          id: envId,
          title: envId,
        };
      });
  }, [recentJumps]);

  const onClick = (envId: EhEnvId) => {
    setEnv(getEnvById(envId));
  };

  return (
    <>
      <InternalCommonBar
        activeId={env?.id}
        list={recent}
        onClick={onClick}
        comboboxType={'environments'}
        favoriteOrRecent={'recent'}
        getEhLink={(id) => getEhUrl(id, app?.id, substitution?.value)}
      />
      <InternalCommonBar
        activeId={env?.id}
        list={favorites}
        onClick={onClick}
        comboboxType={'environments'}
        favoriteOrRecent={'favorite'}
        getEhLink={(id) => getEhUrl(id, app?.id, substitution?.value)}
      />
    </>
  );
}
