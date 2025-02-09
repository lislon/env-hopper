import { createContext, useContext } from 'react'
import type { ReactNode} from 'react';
import type { EhDb } from './EhDb'

const DbContext = createContext<EhDb | undefined>(undefined)

interface DbProviderProps {
  children: ReactNode
  db: EhDb
}

export function DbProvider({ children, db }: DbProviderProps) {
  return <DbContext.Provider value={db}>{children}</DbContext.Provider>
}

export function useDb(): EhDb {
  const context = useContext(DbContext)
  if (context === undefined) {
    throw new Error('useDb must be used within a DbProvider')
  }
  return context
}
