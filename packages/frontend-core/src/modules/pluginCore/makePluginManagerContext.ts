import { objectify } from 'radashi'
import {  isEhPluginResourceJumpable } from './types'
import type {EhPlugin} from './types';
import type { BootstrapConfigData } from '@env-hopper/backend-core'
import type { ResourceJumpItem } from '../resourceJump/types'

export interface PluginInterfaceForCore {
  getResourceJumpsItems: (
    config: BootstrapConfigData,
  ) => Promise<Record<string, ResourceJumpItem>>
}

export function makePluginInterfaceForCore(
  plugins: Array<EhPlugin>,
): PluginInterfaceForCore {
  return {
    getResourceJumpsItems: async (bootstrapConfig: BootstrapConfigData) => {
      const items = await Promise.all(
        plugins.map((plugin) => {
          if (isEhPluginResourceJumpable(plugin)) {
            return plugin.factoryPageJumpAutocompleteItems({
              bootstrapConfig,
            })
          }
          return []
        }),
      )
      return objectify(
        items.flat(),
        (item) => item.slug,
        (item) => item,
      )
    },
  }
}
