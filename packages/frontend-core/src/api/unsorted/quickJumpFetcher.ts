import type { QueryFunctionContext, QueryKey } from '@tanstack/react-query'
import {
  APP_SLOTS_COUNT,
  ENV_SLOTS_COUNT,
} from '~/modules/resourceJump/utils/quickSlotsHelpers'
import { getDbFromMeta } from '~/util/reactQueryUtils'

export interface QuickSlotsData {
  envSlots: Array<string | undefined>
  appSlots: Array<string | undefined>
}

export const quickSlotsQueryKey: QueryKey = ['quickSlots']

export function quickJumpFetcher() {
  return async (ctx: QueryFunctionContext): Promise<QuickSlotsData> => {
    const database = getDbFromMeta(ctx)
    const envRows = await database.quickEnvSlots.orderBy('slot').toArray()
    const appRows = await database.quickAppSlots.orderBy('slot').toArray()

    const envSlots: Array<string | undefined> =
      Array(ENV_SLOTS_COUNT).fill(undefined)
    for (const row of envRows) {
      if (row.slot >= 0 && row.slot < envSlots.length) {
        envSlots[row.slot] = row.envSlug
      }
    }

    const appSlots: Array<string | undefined> =
      Array(APP_SLOTS_COUNT).fill(undefined)
    for (const row of appRows) {
      if (row.slot >= 0 && row.slot < appSlots.length) {
        appSlots[row.slot] = row.appSlug
      }
    }

    return { envSlots, appSlots }
  }
}
