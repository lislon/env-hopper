import { queryOptions } from '@tanstack/react-query'
import type {
  AvailiabilityMatrixData,
  RenameRule,
  RenameRuleParams,
  ResourceJumpsData,
} from '@env-hopper/backend-core'
import { getTrpcFromMeta } from '~/util/reactQueryUtils'

export class ApiQueryMagazineResouceJump {
  static getNameMigration(params: RenameRuleParams) {
    return queryOptions<RenameRule | false, Error>({
      queryKey: ['nameMigrations'],
      queryFn: (ctx) => getTrpcFromMeta(ctx).tryFindRenameRule.query(params),
    })
  }

  static getAvailabilityMatrix() {
    return queryOptions<AvailiabilityMatrixData, Error>({
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
