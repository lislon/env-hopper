import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

export const persister = createSyncStoragePersister({
  storage: window.localStorage,
});
