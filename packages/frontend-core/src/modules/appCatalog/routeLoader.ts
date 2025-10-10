export interface AppCatalogLoaderReturn {
  // App catalog doesn't need pre-loading, just return empty object
}

export async function appCatalogRouteLoader(): Promise<AppCatalogLoaderReturn> {
  // Catalog mode doesn't require pre-loading data like hopper mode
  // The AppCatalogLayout handles fetching and caching
  return {}
}
