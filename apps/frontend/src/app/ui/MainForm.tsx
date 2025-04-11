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

const gridTemplateColumns = {
  '2xl': 'minmax(250px, 1fr) minmax(auto, 800px) minmax(250px, 1fr)',
  'md': '1fr minmax(auto, 800px) 1fr',
  'sm': '1fr'
};

export function MainForm({ envAppSubState }: MainFormProps) {
  return (
    <MainFormContextProvider urlParams={envAppSubState}>
      <div className={'flex flex-col gap-3 w-full'}>
        <div className={"grid " +
          `[grid-template-areas:'e-input''e-bar''a-input''a-bar''s-input''jump''ui-widget''history'] [grid-template-columns:${gridTemplateColumns['sm']}] ` +
          `md:[grid-template-areas:'._e-input_ui-widget''._e-bar_ui-widget''._a-input_ui-widget''._a-bar_ui-widget''._s-input_ui-widget''._jump_ui-widget''history_history_history'] md:[grid-template-columns:${gridTemplateColumns['md']}]` +
          `2xl:[grid-template-columns:${gridTemplateColumns['2xl']}]` +
          "grid-rows-layout w-full gap-4 p-4"}>
          <EnvList className={'[grid-area:e-input]'} />
          <EnvQuickBar className={'[grid-area:e-bar]'} />
          <AppList className={'[grid-area:a-input] mt-4'} />
          <AppQuickBar className={'[grid-area:a-bar]'} />
          <SubstitutionList className={'[grid-area:s-input] mt-4'} />
          <JumpMainButton className="[grid-area:jump] px-8 py-4 w-full max-w-[1000px] justify-self-center mt-4" />
          <ErrorBoundary fallback={<div></div>}>
            <AppLoginPassWidgetsPanel className={'[grid-area:ui-widget]'} />
          </ErrorBoundary>
          <History className={'[grid-area:history] mt-4 w-full'} />
          {/*<AppProfileWidgetPanel className={'grid-in-a-widgets'} />*/}
        </div>
      </div>
    </MainFormContextProvider>
  );
}
