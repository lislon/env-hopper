import { queryOptions } from '@tanstack/react-query'
import type {
  AvailabilityMatrixData,
  RenameRule,
  RenameRuleParams,
  ResourceJumpsData,
} from '@env-hopper/backend-core'
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
    return queryOptions<ResourceJumpsData, Error>({
      queryKey: ['resourceJumps'],
      queryFn: (ctx) => getTrpcFromMeta(ctx).resourceJumps.query(),
    })
  }
}
