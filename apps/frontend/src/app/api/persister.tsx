import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import {
  PersistedClient,
  Persister,
  Promisable,
} from '@tanstack/react-query-persist-client';
import { QueryKey } from '@tanstack/react-query';
import { ApiQueryMagazine } from './ApiQueryMagazine';

function partialMatchKey(a: QueryKey, b: QueryKey): boolean {
  if (a === b) {
    return true;
  }

  if (typeof a !== typeof b) {
    return false;
  }

  if (a && b && typeof a === 'object' && typeof b === 'object') {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    return !Object.keys(b).some((key) => !partialMatchKey(a[key], b[key]));
  }

  return false;
}

export class EhPersister implements Persister {
  private delegate = createSyncStoragePersister({
    storage: window.localStorage,
  });

  constructor(readonly requiredQueries: QueryKey[]) {}

  persistClient(persistClient: PersistedClient): Promisable<void> {
    const requiredQueriesAreHealthy = this.requiredQueries.every(
      (queryKeyNeedle) => {
        return persistClient.clientState.queries.find(
          (query) =>
            partialMatchKey(queryKeyNeedle, query.queryKey) &&
            query.state.status === 'success',
        );
      },
    );
    if (requiredQueriesAreHealthy) {
      return this.delegate.persistClient(persistClient);
    }
  }

  restoreClient() {
    return this.delegate.restoreClient();
  }

  removeClient() {
    return this.delegate.removeClient();
  }
}

export const persister = new EhPersister([
  ApiQueryMagazine.getCustomization().queryKey,
  ApiQueryMagazine.getConfig().queryKey,
]);
