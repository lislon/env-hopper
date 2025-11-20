import { ReadonlyCopyField } from '../../ReadonlyCopyField';
import React, { useEffect, useState } from 'react';
import UiCredsIcon from './ui-creds.svg?react';
import cn from 'classnames';
import {
  EhApp,
  EhAppWidgetUiCredsMany,
  EhAppWidgetUiCredsOne,
} from '@env-hopper/types';
import { isArray } from 'lodash';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { LOCAL_STORAGE_KEY_UI_PASS_TABS_POSITIONS } from '../../../lib/local-storage-constants';
import { useMainAppFormContext } from '../../../context/MainFormContextProvider';
import { interpolateWidgetStr } from '../../../lib/utils';
import { WidgetLeftBorder } from '../WidgetLeftBorder';
import { HideSensitiveDataToggle } from '../../HideSensitiveDataToggle';

export interface UiCredentialsProps {
  className?: string;
}

function isMultiPass(
  ui: EhAppWidgetUiCredsOne | EhAppWidgetUiCredsMany | undefined,
): ui is EhAppWidgetUiCredsMany {
  return isArray(ui);
}

interface UiPassTab {
  appTitle: string;
  tabNo: number;
}

function getInitialSelectedTab(
  uiPassTabs: UiPassTab[],
  app: EhApp | undefined,
  uis: unknown[],
): number {
  const tabNo = uiPassTabs.find((p) => p.appTitle === app?.appTitle)?.tabNo;
  if (tabNo && tabNo > uis.length) {
    return tabNo;
  }
  return 0;
}

export function UiCredentials({ className }: UiCredentialsProps) {
  const { listApps, env, app, isHideSensitiveInfo } = useMainAppFormContext();

  const ui = app?.widgets?.ui;
  const uis = isMultiPass(ui) ? ui : [ui];

  const [uiPassTabs, setPassTabs] = useLocalStorage<UiPassTab[]>(
    LOCAL_STORAGE_KEY_UI_PASS_TABS_POSITIONS,
    () => [],
  );
  const [tabNo, setTabNo] = useState(() =>
    getInitialSelectedTab(uiPassTabs, app, uis),
  );

  useEffect(() => {
    if (app !== undefined) {
      const newUiTabs = uiPassTabs
        .filter((p) => p.appTitle !== app.appTitle)
        .filter(
          (p) => listApps.find((a) => a.appTitle === p.appTitle) !== undefined,
        );
      if (tabNo !== 0) {
        newUiTabs.push({ appTitle: app.appTitle, tabNo });
      }
      setPassTabs(newUiTabs);
    }
  }, [tabNo, app, listApps]);

  useEffect(() => {
    getInitialSelectedTab(uiPassTabs, app, uis);
  }, [uiPassTabs, app?.appTitle, ui]);

  const tabContent = uis[tabNo];

  if (!tabContent) {
    return null;
  }

  return (
    <div
      className={cn('flex tooltip tooltip-left items-start w-full', className)}
      data-tip={
        `Credentials for the app UI` +
        `${tabContent.desc ? `: ${tabContent.desc}` : ''}`
      }
    >
      <WidgetLeftBorder>
        <div className="w-4 h-4">
          <UiCredsIcon />
        </div>
        <HideSensitiveDataToggle />
      </WidgetLeftBorder>
      <div className="border-l-2 border-gray-300 dark:border-gray-500 pl-2 w-full">
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
            <ReadonlyCopyField
              value={interpolateWidgetStr(tabContent.username, env, app)}
            />
          </div>
          <div>
            <ReadonlyCopyField
              value={interpolateWidgetStr(tabContent.password, env, app)}
              isHideSensitiveInfo={isHideSensitiveInfo}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
