import React, { Suspense } from 'react';
import { UiCredentials } from './UiCredentials/UiCredentials';
import cn from 'classnames';
import { ErrorBoundary } from 'react-error-boundary';
import { DbCredentialsWidget } from './DbCredentials/DbCredentialsWidget';
import { UnstableCustomWidget } from './UnstableCustomWidget/UnstableCustomWidget';
import { useMainAppFormContext } from '../../context/MainFormContextProvider';
import { ConfigServerWidget } from '../../plugins/configserver/ui/ConfigServerWidget';

export interface AppWidgetsPanelProps {
  className?: string;
}

export function AppLoginPassWidgetsPanel({ className }: AppWidgetsPanelProps) {

  const { app, env } = useMainAppFormContext();

  return (
    <div className={cn('flex justify-center', className)}>
      <div className={'flex flex-col gap-4'}>
        <ErrorBoundary fallback={<div>Something went wrong</div>}>
          <UiCredentials />
        </ErrorBoundary>
        <ErrorBoundary fallback={<div>Something went wrong</div>}>
          <DbCredentialsWidget />
        </ErrorBoundary>

        <div className={cn('flex flex-col gap-4 items-start')}>
          <ErrorBoundary fallback={<div>Something went wrong</div>}>
            <Suspense fallback={<>Loading widget...</>}>
              <UnstableCustomWidget />
            </Suspense>
          </ErrorBoundary>
        </div>

        {app && env && <div className={cn('flex flex-col gap-4 items-center')}>
          <ErrorBoundary fallback={<div>Something went wrong</div>}>
            <ConfigServerWidget appId={app.id} envId={env.id} />
          </ErrorBoundary>
        </div>
        }
      </div>
    </div>
  );
}
