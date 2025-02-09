import { objectify } from 'radashi';
import type {
  ReactNode
} from 'react';
import {
  createContext,
  use,
  useCallback,
  useMemo,
  useState,
} from 'react';
import type { PluginPageUrlAutocompleteItem } from '~/plugins/builtin/pageUrl/pageUrlTypes';
import type { PartialRecord } from '~/types/utilityTypes';
import type { ResourceJumpItem } from '../resourceJump/types';
import type { PluginInterfaceForCore } from './makePluginManagerContext';
import type {
  EhPlugin, EhPluginResouceJumpFactoryCtx,
  PluginName
} from './types';
import {
  isEhPluginResourceJumpable
} from './types';

export interface PluginManagerContext {
  plugins: Array<EhPlugin>
  interfaceForPlugins: PartialRecord<
    PluginName,
    PluginManagerInterfaceForPlugins
  >
  resouceJumpItems: PartialRecord<PluginName, Array<ResourceJumpItem>>
  autocompleteFactoryItems: (
    ctx: EhPluginResouceJumpFactoryCtx,
  ) => Array<PluginPageUrlAutocompleteItem>
}

export interface PluginManagerInterfaceForPlugins {
  setResouceJumps: (items: Array<ResourceJumpItem>) => void
}

const PluginManagerContextInstance = createContext<
  PluginManagerContext | undefined
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
  const [resouceJumpItems, setResouceJumpsItems] = useState<
    PartialRecord<PluginName, Array<ResourceJumpItem>>
  >({})

  const autocompleteFactoryItems = useCallback(
    (ctx: EhPluginResouceJumpFactoryCtx): Array<PluginPageUrlAutocompleteItem> => {
      return plugins
        .filter((p) => isEhPluginResourceJumpable(p))
        .flatMap((plugin) => plugin.factoryPageJumpAutocompleteItems(ctx))
    },
    [plugins],
  )

  const value: PluginManagerContext = useMemo(() => {
    return {
      plugins,
      interfaceForPlugins: objectify(
        plugins.map((p) => p.name),
        (pluginName) => pluginName,
        (pluginName) => ({
          setResouceJumps: (items: Array<ResourceJumpItem>) => {
            setResouceJumpsItems((old) => ({
              ...old,
              ...{ [pluginName]: items },
            }))
          },
        }),
      ),
      autocompleteFactoryItems,
      resouceJumpItems,
    }
  }, [plugins])

  return (
    <PluginManagerContextInstance value={value}>
      {children}
    </PluginManagerContextInstance>
  )
}

export function usePluginManager(): PluginManagerContext {
  const context = use(PluginManagerContextInstance)
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
