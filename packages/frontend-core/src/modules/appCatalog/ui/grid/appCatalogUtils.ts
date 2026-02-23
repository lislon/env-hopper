import type { AppForCatalog } from '@env-hopper/backend-core'

export function getAppUrl(app: AppForCatalog): string {
  return app.appUrl || '#'
}
