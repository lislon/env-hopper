import { createContext, use } from 'react'
import type { ReactNode } from 'react'
import type { EhUiSettings } from '~/types/uiSettings'

const UiSettingsInternalContext = createContext<EhUiSettings | undefined>(
  undefined,
)

interface UiSettingsContextProps {
  children: ReactNode
  value?: EhUiSettings
}

export function UiSettingsContext({ children, value }: UiSettingsContextProps) {
  return (
    <UiSettingsInternalContext value={value}>
      {children}
    </UiSettingsInternalContext>
  )
}

export function useUiSettings(): EhUiSettings {
  const context = use(UiSettingsInternalContext)
  return context ?? {}
}
