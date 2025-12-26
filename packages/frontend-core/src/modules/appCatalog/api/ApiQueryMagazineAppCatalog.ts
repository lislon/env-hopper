import type { AppCatalogData } from '@env-hopper/backend-core'
import { queryOptions } from '@tanstack/react-query'
import { appCatalogFetcher } from '~/api/unsorted/appCatalogFetcher'

export class ApiQueryMagazineAppCatalog {
  static getAppCatalog() {
    return queryOptions<AppCatalogData | undefined, Error>({
      queryKey: ['appCatalog'],
      queryFn: appCatalogFetcher(),
    })
  }
}
