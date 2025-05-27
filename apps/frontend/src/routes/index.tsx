import { createFileRoute } from '@tanstack/react-router';
import React from 'react';
import { Header } from '@/ui/layout/Header';
import { Footer } from '@/ui/layout/Footer';
import { MainLayout } from '@/ui/layout/MainLayout';
import { Content } from '@/ui/layout/Content';
import { SideColumn } from '@/ui/layout/SideColumn';

export const Route = createFileRoute('/')({
  component: IndexRoute,
});

export function IndexRoute() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 container mx-auto p-4 w-full">
        <MainLayout content={<Content />} side={<SideColumn />} />
      </div>
      <Footer />
    </div>
  );
} 