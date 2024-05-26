'use client';
import React from 'react';
import cn from 'classnames';
import { useEhContext } from '../context/EhContext';
import { EhAutoComplete } from './EhAutoComplete';
import { autoCompleteFilter } from '../lib/autoCompleteFilter';
import { findSubstitutionInApp } from '../lib/utils';
import { EhAppId, EhEnv } from '@env-hopper/types';
import { jump } from '../lib/jump';

export function formatUrl(env: EhEnv, urlPattern: string) {
  return urlPattern.replace('{env}', env.name);
}


function mapToAutoCompleteItemApp(app: EhAppId) {
  return { id: app, title: app };
}

export function AppList() {
  const {
    activeEnv,
    activeApp,
    apps,
    setActiveApp,
    favoriteApps,
    substitutions,
    setActiveSubstitution,
    getAppById,
    getSubstitutionById,
    recordJump
  } = useEhContext();

  return <div>
    <EhAutoComplete items={apps.map(app => mapToAutoCompleteItemApp(app.name))} filter={autoCompleteFilter}
                    label="What app to hop on?"
                    selectedItem={activeApp ? mapToAutoCompleteItemApp(activeApp.name) : null}
                    itemMetaGenerator={appId => {
                      const app = apps.find(app => app.name === appId);
                      if (app === undefined) {
                        throw new Error(`Cant find app by ${appId}`);
                      }
                      if (activeEnv === null) {
                        return null;
                      }
                      const urlVar = findSubstitutionInApp(app, substitutions);

                      return {
                        link: formatUrl(activeEnv, app.url), urlVar, onClick: urlVar ? () => {
                          setActiveSubstitution(getSubstitutionById(app.name));
                        } : undefined
                      };
                    }}
                    onClick={(appId) => {
                      if (activeEnv !== null) {
                        recordJump({
                          app: appId,
                          env: activeEnv?.name
                        });
                      }
                    }}
                    onSelectedItemChange={(appId) => {
                      const selectedApp = getAppById(appId);
                      const substitution = findSubstitutionInApp(selectedApp, substitutions);
                      setActiveApp(selectedApp);
                      setActiveSubstitution(substitution);
                      const app = apps.find(app => app.name === appId);
                      if (activeEnv !== null && app !== undefined) {
                        jump({
                          app, env: activeEnv, substitution: substitution ? {
                            id: substitution.name,
                            value: ''
                          } : undefined
                        });
                      }
                    }} />
    <div className="flex gap-2 my-2">
      <span aria-label="Favorites">⭐</span>
      <ul className="inline-flex gap-2">
        {favoriteApps.map(appId => <li key={appId}
                                       className={cn('border px-2 rounded-lg hover:bg-gray-500 hover:cursor-pointer hover:border-solid',
                                         appId === activeApp?.name ? 'border-solid border-amber-300 text-amber-300' : 'border-dashed border-gray-300 ')}
                                       onClick={() => setActiveApp(getAppById(appId === activeApp?.name ? null : appId))}>{appId}</li>)}
      </ul>
    </div>
  </div>;
}
