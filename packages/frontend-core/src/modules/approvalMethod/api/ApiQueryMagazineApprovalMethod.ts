import { queryOptions } from '@tanstack/react-query'
import { getTrpcFromMeta } from '~/util/reactQueryUtils'

/**
 * Query options for ApprovalMethod data.
 *
 * Note: We let tRPC infer the return types directly rather than using
 * the backend's ApprovalMethod type, because tRPC serializes Date → string
 * over JSON. This ensures end-to-end type safety without manual casting.
 */
export class ApiQueryMagazineApprovalMethod {
  static list() {
    return queryOptions({
      queryKey: ['approvalMethod', 'list'] as const,
      queryFn: (ctx) => getTrpcFromMeta(ctx).approvalMethod.list.query(),
    })
  }

  static getById(id: string) {
    return queryOptions({
      queryKey: ['approvalMethod', 'getById', id] as const,
      queryFn: (ctx) =>
        getTrpcFromMeta(ctx).approvalMethod.getById.query({ id }),
    })
  }

  static listByType(type: 'service' | 'personTeam' | 'custom') {
    return queryOptions({
      queryKey: ['approvalMethod', 'listByType', type] as const,
      queryFn: (ctx) =>
        getTrpcFromMeta(ctx).approvalMethod.listByType.query({ type }),
    })
  }
}
