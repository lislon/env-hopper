import { ReadonlyCopyField } from '../../ReadonlyCopyField';
import React, { useState } from 'react';
import UiCredsIcon from './ui-creds.svg?react';
import { useEhContext } from '../../../context/EhContext';
import cn from 'classnames';
import {
  EhAppWidgetUiCredsMany,
  EhAppWidgetUiCredsOne,
} from '@env-hopper/types';
import { isArray } from 'lodash';

export interface UiCredentialsProps {
  className?: string;
}

function isMultiPass(
  ui: EhAppWidgetUiCredsOne | EhAppWidgetUiCredsMany,
): ui is EhAppWidgetUiCredsMany {
  return isArray(ui);
}

export function UiCredentials({ className }: UiCredentialsProps) {
  const { app } = useEhContext();
  const ui = app?.meta?.ui;

  const [tabNo, setTabNo] = useState(0);
  if (!ui) {
    return null;
  }

  const uis = isMultiPass(ui) ? ui : [ui];
  console.log(uis);
  const tabContent = uis[tabNo];

  return (
    <div
      className={cn('flex tooltip tooltip-left items-start', className)}
      data-tip={
        `Credentials for the app UI` +
        `${tabContent.desc ? `: ${tabContent.desc}` : ''}`
      }
    >
      <div className="py-1 pr-2 flex flex-col">
        <div className="w-4 h-4">
          <UiCredsIcon />
        </div>
      </div>
      <div className="border-l-2 border-gray-300 dark:border-gray-500 pl-2">
        {isMultiPass(ui) && uis.length > 1 && (
          <ul role="tablist" className="tabs tabs-lifted tabs-xs p-1 ">
            {ui.map(({ label }, i) => (
              <li
                key={i}
                role="tab"
                className={cn('tab', [{ 'tab-active': tabNo === i }])}
                onClick={() => setTabNo(i)}
              >
                {label || `# ${i + 1}`}
              </li>
            ))}
          </ul>
        )}

        <div className="grid text-sm grid-rows-2 gap-1 items-center">
          <div>
            <ReadonlyCopyField value={tabContent.username} />
          </div>
          <div>
            <ReadonlyCopyField value={tabContent.password} />
          </div>
        </div>
      </div>
    </div>
  );
}
