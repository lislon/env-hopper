import React from 'react';
import { Header } from '../Header';
import { ThemeContextProvider } from '../../context/ThemeContext';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

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
        <Header className={'z-20'} />
        <div className="absolute top-0 left-0 right-0 p-2 flex justify-end gap-2 z-10">
          {headerButtons}
        </div>
        {children}
        <footer className="mt-8 w-full p-4 flex justify-end items-end gap-4 flex-grow">
          {footer}
        </footer>
      </div>
      {modalsAndAnalytics}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </ThemeContextProvider>
  );
}
