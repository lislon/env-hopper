import React from 'react'
import { Header } from '../Header'
import { ThemeContextProvider } from '../../context/ThemeContext'

export interface LayoutProps {
  children: React.ReactNode
  headerButtons?: React.ReactNode
  footer?: React.ReactNode
  modalsAndAnalytics?: React.ReactNode
}

/**
 * The outer chrome, ported unchanged. Every class name below is copied verbatim:
 * the skin is a vendored stylesheet of the previous UI's compiled CSS, scoped to
 * `.eh-legacy`, using the same unprefixed selectors the markup already carries.
 * Editing a class name here is how the skin stops applying.
 *
 * `.eh-legacy` wraps EVERYTHING, including `modalsAndAnalytics` — the previous UI
 * has no portals, its `<dialog>` included, so anything it renders has to sit
 * inside the scope to be styled. Do not narrow the wrapper to `children`.
 *
 * INTENTIONAL DIFF: the `<ReactQueryDevtools/>` mount is dropped — the current
 * provider tree already mounts one, and two of them stack their toggles.
 */
export function Layout({
  children,
  footer,
  headerButtons,
  modalsAndAnalytics,
}: LayoutProps) {
  return (
    <ThemeContextProvider>
      <div className="eh-legacy">
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
      </div>
    </ThemeContextProvider>
  )
}
