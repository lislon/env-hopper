import React from 'react'
import { Header } from '../components/header/Header'

export interface MainLayoutProps {
  children: React.ReactNode
  headerMiddle?: React.ReactNode
  breadcrumbs?: React.ReactNode
}

export function MainLayout({
  children,
  headerMiddle,
  breadcrumbs,
}: MainLayoutProps) {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex-1 flex min-h-0">
        <main className="flex-1 w-full flex justify-center font-sans p-6">
          <div className="w-full flex flex-col flex-1 min-h-0">
            <Header middle={headerMiddle} />
            {breadcrumbs}
            <div className="flex-1 min-h-0 flex flex-col">{children}</div>
          </div>
        </main>
      </div>
    </div>
  )
}
