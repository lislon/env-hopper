import { ReadonlyCopyField } from '../../ReadonlyCopyField';
import React from 'react';
import UiCredsIcon from './ui-creds.svg?react';
import { useEhContext } from '../../../context/EhContext';
import cn from 'classnames';

export interface UiCredentialsProps {
  className?: string;
}

export function UiCredentials({ className }: UiCredentialsProps) {
  const { app } = useEhContext();

  return (
    app?.meta?.ui && (
      <div
        className={cn('flex tooltip tooltip-left items-start', className)}
        data-tip="Credentials for the app UI"
      >
        <div className="py-1 pr-2 flex flex-col">
          <div className="w-4 h-4">
            <UiCredsIcon />
          </div>
        </div>
        <div className="border-l-2 border-gray-300 dark:border-gray-500 pl-2">
          <div className="grid text-sm grid-rows-2 gap-1 items-center">
            <div>
              <ReadonlyCopyField value={app.meta.ui.username} />
            </div>
            <div>
              <ReadonlyCopyField value={app.meta.ui.password} />
            </div>
          </div>
        </div>
      </div>
    )
  );
}
