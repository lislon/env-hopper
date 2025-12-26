import type { EhRouterContext } from '~/types/types'

export interface AppCatalogLoaderReturn {
  // App catalog doesn't need pre-loading, just return empty object
}

export interface RouteLoaderCtx {
  context: EhRouterContext
}

export async function appCatalogRouteLoader({
  context,
}: RouteLoaderCtx): Promise<AppCatalogLoaderReturn> {
  // Catalog mode doesn't require pre-loading data like hopper mode
  // The AppCatalogLayout handles fetching and caching
  return {}
}
