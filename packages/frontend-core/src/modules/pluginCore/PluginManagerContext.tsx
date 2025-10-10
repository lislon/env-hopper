import { objectify } from 'radashi'
import { createContext, use, useMemo } from 'react'
import type { ReactNode } from 'react'
import type { PartialRecord } from '~/types/utilityTypes'
import type { PluginInterfaceForCore } from './makePluginManagerContext'
import type {
  EhPlugin,
  PluginName,
} from './types'

export interface PluginManagerContextIface {
  plugins: Array<EhPlugin>
  interfaceForPlugins: PartialRecord<
    PluginName,
    PluginManagerInterfaceForPlugins
  >
}

export interface PluginManagerInterfaceForPlugins {
  // Future plugin interface methods can be added here
}

const PluginManagerContext = createContext<
  PluginManagerContextIface | undefined
>(undefined)

interface PluginManagerProviderProps {
  children: ReactNode
  plugins: Array<EhPlugin>
  pluginInterfaceForCore: PluginInterfaceForCore
}

export function PluginManagerContextProvider({
  children,
  plugins,
}: PluginManagerProviderProps) {
  const interfaceForPlugins = useMemo(() => {
    return objectify(
      plugins.map((p) => p.name),
      (pluginName) => pluginName,
      () => ({
        // Future plugin interface methods can be added here
      }),
    );
  }, [plugins])

  const value: PluginManagerContextIface = useMemo(() => {
    return {
      plugins,
      interfaceForPlugins,
    }
  }, [plugins, interfaceForPlugins])

  return <PluginManagerContext value={value}>{children}</PluginManagerContext>
}

export function usePluginManager(): PluginManagerContextIface {
  const context = use(PluginManagerContext)
  if (context === undefined) {
    throw new Error(
      'usePluginManager must be used within an PluginManagerContextProvider',
    )
  }
  return context
}

export function usePluginManagerForPlugin(
  pluginName: PluginName,
): PluginManagerInterfaceForPlugins {
  const context = usePluginManager()

  const interfaceForPlugins = context.interfaceForPlugins[pluginName]

  if (interfaceForPlugins === undefined) {
    throw new Error(
      `usePluginManagerForPlugin("${pluginName}") is not initialized.`,
    )
  }

  return interfaceForPlugins
}
