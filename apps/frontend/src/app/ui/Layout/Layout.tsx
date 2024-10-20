import React, { Suspense } from 'react';
import { Header } from '../Header';
import { ThemeContextProvider } from '../../context/ThemeContext';

export interface LayoutProps {
  children: React.ReactNode;
  headerButtons?: React.ReactNode;
  footer?: React.ReactNode;
  modalsAndAnalytics?: React.ReactNode;
}

export function Layout({
  children,
  footer,
  headerButtons,
  modalsAndAnalytics,
}: LayoutProps) {
  return (
    <ThemeContextProvider>
      <div className="flex min-h-screen flex-col sm:items-center w-full transition">
        <div className="absolute top-0 left-0 right-0 p-2 flex justify-end gap-2">
          {headerButtons}
        </div>
        <Header />
        <Suspense
          fallback={<span className="loading loading-ball loading-lg"></span>}
        >
          {children}
        </Suspense>
        <footer className="mt-8 w-full p-4 flex justify-end items-end gap-4 flex-grow">
          {footer}
        </footer>
      </div>
      {modalsAndAnalytics}
    </ThemeContextProvider>
  );
}
