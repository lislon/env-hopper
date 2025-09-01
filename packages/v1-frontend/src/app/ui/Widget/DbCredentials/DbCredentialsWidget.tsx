import React from 'react';
import { ReadonlyCopyField } from '../../ReadonlyCopyField';
import DbCredsIcon from './db-creds.svg?react';
import cn from 'classnames';
import { useMainAppFormContext } from '../../../context/MainFormContextProvider';
import { interpolateWidgetStr } from '../../../lib/utils';

export interface DbCredentialsWidgetProps {
  className?: string;
}

export function DbCredentialsWidget({ className }: DbCredentialsWidgetProps) {
  const { app, env } = useMainAppFormContext();

  return (
    app?.widgets?.db &&
    env && (
      <div
        className={cn('flex tooltip tooltip-left', className)}
        data-tip="Credentials for the app DB"
      >
        <div className="py-1 pr-2">
          <div className="w-4 h-4">
            <DbCredsIcon />
          </div>
        </div>
        <div className="border-l-2 border-gray-300 dark:border-gray-500 pl-2">
          <div className="grid text-sm grid-rows-2 gap-1 items-center">
            <div>
              <ReadonlyCopyField
                value={interpolateWidgetStr(app.widgets.db.url, env, app)}
              />
            </div>
            <div>
              <ReadonlyCopyField
                value={interpolateWidgetStr(app.widgets.db.username, env, app)}
              />
            </div>
            <div>
              <ReadonlyCopyField
                value={interpolateWidgetStr(app.widgets.db.password, env, app)}
              />
            </div>
          </div>
        </div>
      </div>
    )
  );
}
