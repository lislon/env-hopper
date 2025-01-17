import React, { useMemo } from 'react';
import { EhEnvId } from '@env-hopper/types';
import {
  BarElement,
  InternalCommonBar,
  QuickBarSharedProps,
} from './InternalCommonBar';
import { MAX_RECENT_ENVS_IN_QUICK_ACCESS } from '../../lib/constants';
import { uniq } from 'lodash';
import cn from 'classnames';
import { useMainAppFormContext } from '../../context/MainFormContextProvider';

export function EnvQuickBar(props: QuickBarSharedProps) {
  const { listFavoriteEnvs, recentJumps, setEnv, getEnvById, env } =
    useMainAppFormContext();

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
    const newEnv = getEnvById(envId);
    setEnv(newEnv);
  };

  return (
    <div className={cn(props.className, 'flex flex-col gap-2')}>
      <InternalCommonBar
        activeId={env?.id}
        list={recent}
        onClick={onClick}
        comboboxType={'environments'}
        favoriteOrRecent={'recent'}
      />
      <InternalCommonBar
        activeId={env?.id}
        list={favorites}
        onClick={onClick}
        comboboxType={'environments'}
        favoriteOrRecent={'favorite'}
      />
    </div>
  );
}
