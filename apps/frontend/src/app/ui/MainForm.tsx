import React from 'react';
import { EnvList } from './Lists/EnvList';
import { AppList } from './Lists/AppList';
import { SubstitutionList } from './Lists/SubstitutionList';
import { EnvQuickBar } from './QuickBar/EnvQuickBar';
import { AppQuickBar } from './QuickBar/AppQuickBar';
import { JumpMainButton } from './JumpButton/JumpMainButton';
import { AppLoginPassWidgetsPanel } from './Widget/AppLoginPassWidgetsPanel';
import { History } from './History';
import { ErrorBoundary } from 'react-error-boundary';
import { MainFormContextProvider } from '../context/MainFormContextProvider';
import { EhEnvAppSubSelectedState } from '../types';

export interface MainFormProps {
  envAppSubState: EhEnvAppSubSelectedState;
}
export function MainForm({ envAppSubState }: MainFormProps) {
  return (
    <MainFormContextProvider urlParams={envAppSubState}>
      <div className={'flex flex-col gap-3 w-full'}>
        <div className="grid grid-areas-layout-sm md:grid-areas-layout-md grid-cols-layout-sm md:grid-cols-layout-md  2xl:grid-cols-layout-2xl grid-rows-layout w-full gap-4 p-4">
          <EnvList className={'grid-in-e-input'} />
          <EnvQuickBar className={'grid-in-e-bar'} />
          <AppList className={'grid-in-a-input mt-4'} />
          <AppQuickBar className={'grid-in-a-bar'} />
          <SubstitutionList className={'grid-in-s-input mt-4'} />
          <JumpMainButton className="grid-in-jump px-8 py-4 w-full max-w-[1000px] justify-self-center mt-4" />
          <ErrorBoundary fallback={<div></div>}>
            <AppLoginPassWidgetsPanel className={'grid-in-ui-widget'} />
          </ErrorBoundary>
          <History className={'grid-in-history mt-4 w-full'} />
          {/*<AppProfileWidgetPanel className={'grid-in-a-widgets'} />*/}
        </div>
      </div>
    </MainFormContextProvider>
  );
}
