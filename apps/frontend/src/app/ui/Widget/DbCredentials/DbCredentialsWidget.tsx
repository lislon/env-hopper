import { EhAppWidgetDbCreds, EhEnv } from '@env-hopper/types';
import React from 'react';
import { ReadonlyCopyField } from '../../ReadonlyCopyField';
import DbCredsIcon from './db-creds.svg?react';
import { replaceSubstitutionsFromMeta } from '../../../lib/utils';

export function DbCredentialsWidget({ meta, env }: { meta: EhAppWidgetDbCreds, env?: EhEnv }) {
  return (
    <div className="flex">
      <div className="py-1 pr-2" title="Credentials for the db">
        <div className="w-4 h-4">
          <DbCredsIcon />
        </div>
      </div>
      <div className="border-l-2 border-gray-300 dark:border-gray-500 pl-2">
        <div className="grid text-sm grid-rows-2 gap-1 items-center">
          <div>
            <ReadonlyCopyField value={replaceSubstitutionsFromMeta(meta.url, env)} />
          </div>
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
