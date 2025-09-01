import { createFileRoute } from '@tanstack/react-router';
import * as React from 'react';
import { MainForm } from '../../app/ui/MainForm';

export const Route = createFileRoute('/_layout/')({
  component: Index,
});

function Index() {
  return <MainForm envAppSubState={{}} />;
}
