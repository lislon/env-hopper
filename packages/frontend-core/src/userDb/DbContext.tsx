import { createContext, use } from 'react'
import type { ReactNode } from 'react'
import type { EhDb } from './EhDb'

const DbContext = createContext<EhDb | undefined>(undefined)

interface DbProviderProps {
  children: ReactNode
  db: EhDb
}

export function DbProvider({ children, db }: DbProviderProps) {
  return <DbContext value={db}>{children}</DbContext>
}

export function useDb(): EhDb {
  const context = use(DbContext)
  if (context === undefined) {
    throw new Error('useDb must be used within a DbProvider')
  }
  return context
}
