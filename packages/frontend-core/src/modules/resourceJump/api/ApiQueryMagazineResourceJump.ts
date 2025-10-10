import { queryOptions } from '@tanstack/react-query'
import type {
  AvailabilityMatrixData,
  RenameRule,
  RenameRuleParams,
  ResourceJumpsData,
} from '@env-hopper/backend-core'
import type { DbAware } from '~/types/ehTypes'
import type { ResourceJumpHistoryItem } from './types'
import {
  quickJumpFetcher,
  quickSlotsQueryKey,
} from '~/api/unsorted/quickJumpFetcher'
import { resourceJumpsFetcher } from '~/api/unsorted/resourceJumpsFetcher'
import { getTrpcFromMeta } from '~/util/reactQueryUtils'

export class ApiQueryMagazineResourceJump {
  static getNameMigration(params: RenameRuleParams) {
    return queryOptions<RenameRule | false, Error>({
      queryKey: ['nameMigrations'],
      queryFn: (ctx) => getTrpcFromMeta(ctx).tryFindRenameRule.query(params),
    })
  }

  static getAvailabilityMatrix() {
    return queryOptions<AvailabilityMatrixData, Error>({
      queryKey: ['availabilityMatrix'],
      queryFn: (ctx) => getTrpcFromMeta(ctx).availabilityMatrix.query(),
    })
  }

  static getResourceJumps() {
    const queryFn = resourceJumpsFetcher()
    return queryOptions<ResourceJumpsData | undefined, Error>({
      queryKey: ['resourceJumps'],
      queryFn,
    })
  }

  static getQuickSlots() {
    const queryFn = quickJumpFetcher()
    return queryOptions<
      {
        envSlots: Array<string | undefined>
        appSlots: Array<string | undefined>
      },
      Error
    >({
      queryKey: quickSlotsQueryKey,
      queryFn,
    })
  }

  static getResourceJumpHistory({ db }: DbAware) {
    return queryOptions<Array<ResourceJumpHistoryItem>, Error>({
      queryKey: ['resourceJumpHistory'],
      queryFn: () => db.resourceJumpHistory.toArray(),
    })
  }
}
