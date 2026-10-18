import type { Catalog } from '../catalog/catalogRead'

const SYNCS = [
  'syncEnvironments',
  'syncApps',
  'syncComponents',
  'syncTargets',
  'syncReleases',
  'syncArtifacts',
  'syncDeployments',
  'syncHealth',
] as const
type SyncName = (typeof SYNCS)[number]

/** A Catalog whose every sync runs alone, in a transaction of its own. */
export type CatalogWithOwnTransactions = Omit<Catalog, SyncName> & {
  [K in SyncName]: (
    scope: string,
    list: Parameters<Catalog[K]>[2],
  ) => ReturnType<Catalog[K]>
}

/** For tests that write one table at a time instead of a whole run. */
export function withOwnTransactions(
  catalog: Catalog,
): CatalogWithOwnTransactions {
  const out: Record<string, unknown> = { ...catalog }
  for (const name of SYNCS) {
    out[name] = (scope: string, list: never) =>
      catalog.transaction((tx) => catalog[name](tx, scope, list))
  }
  return out as CatalogWithOwnTransactions
}
