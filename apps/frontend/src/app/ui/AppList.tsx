'use client';
import React from 'react';
import cn from 'classnames';
import { useEhContext } from '../context/EhContext';
import { EhAutoComplete, ShortcutAction } from './EhAutoComplete';
import { autoCompleteFilter } from '../lib/autoCompleteFilter';
import { findSubstitutionTypeInApp, getJumpUrl } from '../lib/utils';
import { EhApp, EhAppId, EhEnv, EhSubstitutionType } from '@env-hopper/types';
import { EhSubstitutionValue } from '../types';

export function formatUrl(env: EhEnv, urlPattern: string) {
  return urlPattern.replace('{env}', env.name);
}


function mapToAutoCompleteItemApp(app: EhAppId) {
  return { id: app, title: app };
}

interface ShortcutUniversalParams {
  app?: EhApp;
  env?: EhEnv;
  substitution?: EhSubstitutionValue;
  listSubstitutions: EhSubstitutionType[];
}

function shortcutUniversal({
                             app,
                             env,
                             substitution,
                             listSubstitutions
                           }: ShortcutUniversalParams): ShortcutAction | undefined {
  if (app === undefined || env === undefined) {
    return undefined;
  }
  const link = getJumpUrl({ app: app, env: env, substitution });

  if (link !== undefined) {
    return { link };
  }
  const substitutionType = findSubstitutionTypeInApp(app, listSubstitutions);
  if (substitutionType !== undefined) {
    return {
      substitutionTitle: substitutionType?.title
    };
  }
}


export function AppList() {
  const {
    env,
    app,
    substitution,
    listApps,
    setApp,
    listFavoriteApps,
    listSubstitutions,
    getAppById,
    recordJump
  } = useEhContext();


  const shortcutActionForApp = (appId: EhAppId) => {
    const app = listApps.find(app => app.name === appId);
    return shortcutUniversal({ app, env, substitution, listSubstitutions });
  };
  return <div>
    <EhAutoComplete items={listApps.map(app => mapToAutoCompleteItemApp(app.name))} filter={autoCompleteFilter}
                    label="What app to hop on?"
                    selectedItem={app ? mapToAutoCompleteItemApp(app.name) : undefined}
                    shortcutAction={shortcutActionForApp}
                    onClick={(appId) => {
                    }}
                    onSelectedItemChange={(appId) => {
                      setApp(getAppById(appId));
                      recordJump({
                        app: getAppById(appId),
                        env,
                        substitution
                      });

                      // const app = listApps.find(app => app.name === appId);
                      // if (env !== undefined && app !== undefined) {
                      //   jump({
                      //     app, env: env, substitution: substitution ? {
                      //       name: substitution.name,
                      //       value: ''
                      //     } : undefined
                      //   });
                      // }
                    }} />
    <div className="flex gap-2 my-2">
      <span aria-label="Favorites">⭐</span>
      <ul className="inline-flex gap-2">
        {listFavoriteApps.map(appId => <li key={appId}
                                           className={cn('border px-2 rounded-lg hover:bg-gray-500 hover:cursor-pointer hover:border-solid',
                                             appId === app?.name ? 'border-solid border-amber-300 text-amber-300' : 'border-dashed border-gray-300 ')}
                                           onClick={() => setApp(getAppById(appId === app?.name ? undefined : appId))}>{appId}</li>)}
      </ul>
    </div>
  </div>;
}
