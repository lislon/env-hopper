import * as React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { MainForm } from '../../../../../../../app/ui/MainForm';

export const Route = createFileRoute(
  '/_layout/env/$envId/app/$appId/sub/$subValue',
)({
  component: RouteComponent,
});

function RouteComponent() {
  const urlParams = Route.useParams();
  return <MainForm envAppSubState={urlParams} />;
}
