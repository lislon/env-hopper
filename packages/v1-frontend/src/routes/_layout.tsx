import * as React from 'react';
import { createFileRoute, Outlet } from '@tanstack/react-router';
import { MainLayout } from '../app/ui/MainLayout';

export const Route = createFileRoute('/_layout')({
  component: LayoutComponent,
});

function LayoutComponent() {
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
}
