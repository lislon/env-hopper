import React, { Suspense } from 'react';
import { Header } from './Header';
import { Footer } from './Footer/Footer';
import { ThemeContextProvider } from '../context/ThemeContext';
import { ThemeSwitcher } from './ThemeSwitcher/ThemeSwitcher';
import { Analytics } from './Analytics';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContextProvider>
      <div className="flex min-h-screen flex-col items-center bg-[#fcfefe] dark:bg-gray-800 dark:text-white text-black w-full transition">
        <ThemeSwitcher className="absolute top-2 right-2 overflow-clip" />
        <Header />
        <Suspense fallback={'Loading...'}>{children}</Suspense>
        <Footer />
      </div>
      <Analytics />
    </ThemeContextProvider>
  );
}
