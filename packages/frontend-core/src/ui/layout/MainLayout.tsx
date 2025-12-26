import React from 'react'
import { Header } from '../components/header/Header'

import { Footer } from '../components/footer/Footer'

export interface MainLayoutProps {
  children: React.ReactNode
  headerMiddle?: React.ReactNode
  breadcrumbs?: React.ReactNode
}

export function MainLayout({ children, headerMiddle, breadcrumbs }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex">
        <main className="flex-1 w-full flex justify-center font-sans p-6">
          <div className="w-full space-y-6">
            <Header middle={headerMiddle} />
            {breadcrumbs}
            {children}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}
