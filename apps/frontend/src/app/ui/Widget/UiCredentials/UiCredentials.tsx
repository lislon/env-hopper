import { EhAppWidgetUiCreds } from '@env-hopper/types';
import { ReadonlyCopyField } from '../../ReadonlyCopyField';
import React from 'react';
import UiCredsIcon from './ui-creds.svg?react';

export function UiCredentials({ meta }: { meta: EhAppWidgetUiCreds }) {
  return (
    <div className="flex">
      <div
        className="py-1 pr-2 flex flex-col"
        title="Credentials for the app UI"
      >
        <div className="w-4 h-4">
          <UiCredsIcon />
        </div>
      </div>
      <div className="border-l-2 border-gray-300 dark:border-gray-500 pl-2">
        <div className="grid text-sm grid-rows-2 gap-1 items-center">
          <div>
            <ReadonlyCopyField value={meta.username} />
          </div>
          <div>
            <ReadonlyCopyField value={meta.password} />
          </div>
        </div>
      </div>
    </div>
  );
}
