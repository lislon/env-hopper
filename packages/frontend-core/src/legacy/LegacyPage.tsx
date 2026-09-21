import { EhContextProvider } from './context/EhContext'
import { MainForm } from './ui/MainForm'
import type { EhEnvAppSubSelectedState } from './types'

export interface LegacyPageProps {
  selection: EhEnvAppSubSelectedState
}

/**
 * The previous UI's page body: one form, whatever the url shape.
 *
 * The previous UI had no per-shape pages. Every route rendered this same form and
 * the url only decided what came in preselected, so there is one component here
 * and the route hands it the three values it may carry. Keeping that shape is
 * what makes the chrome removal a single edit rather than one per route.
 */
export function LegacyPage({ selection }: LegacyPageProps) {
  return (
    <EhContextProvider>
      <MainForm envAppSubState={selection} />
    </EhContextProvider>
  )
}
