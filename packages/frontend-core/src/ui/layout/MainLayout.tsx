import React from 'react'
import { PlaygroundHeader } from '../components/header/PlaygroundHeader'

import ContextDebug from '../components/contextDebug'
import { Footer } from '../components/footer/Footer'

export interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex">
        {/* <LeftPanel className="h-screen" /> */}
        <main className="flex-1 w-full flex justify-center font-sans p-6">
          <div className="w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl space-y-6">
            <PlaygroundHeader />
            {children}
          </div>
        </main>
      </div>
      <ContextDebug />
      <Footer />
    </div>
  )
}
