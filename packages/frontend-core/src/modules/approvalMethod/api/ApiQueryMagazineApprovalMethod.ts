import { queryOptions } from '@tanstack/react-query'
import type { ApprovalMethod } from '@env-hopper/backend-core'
import { getTrpcFromMeta } from '~/util/reactQueryUtils'

export class ApiQueryMagazineApprovalMethod {
  static list() {
    return queryOptions<Array<ApprovalMethod>, Error>({
      queryKey: ['approvalMethod', 'list'],
      queryFn: async (ctx) => {
        const result = await getTrpcFromMeta(ctx).approvalMethod.list.query()
        return result as Array<ApprovalMethod>
      },
    })
  }

  static getById(id: string) {
    return queryOptions<ApprovalMethod | null, Error>({
      queryKey: ['approvalMethod', 'getById', id],
      queryFn: async (ctx) => {
        const result = await getTrpcFromMeta(ctx).approvalMethod.getById.query({
          id,
        })
        return result as ApprovalMethod | null
      },
    })
  }

  static listByType(type: 'service' | 'personTeam' | 'custom') {
    return queryOptions<Array<ApprovalMethod>, Error>({
      queryKey: ['approvalMethod', 'listByType', type],
      queryFn: async (ctx) => {
        const result = await getTrpcFromMeta(
          ctx,
        ).approvalMethod.listByType.query({ type })
        return result as Array<ApprovalMethod>
      },
    })
  }
}
