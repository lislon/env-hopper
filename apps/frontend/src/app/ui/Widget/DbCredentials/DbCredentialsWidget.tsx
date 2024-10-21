import React from 'react';
import { ReadonlyCopyField } from '../../ReadonlyCopyField';
import DbCredsIcon from './db-creds.svg?react';
import { replaceSubstitutionsFromMeta } from '../../../lib/utils';
import cn from 'classnames';
import { useEhContext } from '../../../context/EhContext';

export interface DbCredentialsWidgetProps {
  className?: string;
}

export function DbCredentialsWidget({ className }: DbCredentialsWidgetProps) {
  const { app, env } = useEhContext();

  return (
    app?.meta?.db &&
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
                value={replaceSubstitutionsFromMeta(app.meta.db.url, env)}
              />
            </div>
            <div>
              <ReadonlyCopyField value={app.meta.db.username} />
            </div>
            <div>
              <ReadonlyCopyField value={app.meta.db.password} />
            </div>
          </div>
        </div>
      </div>
    )
  );
}
