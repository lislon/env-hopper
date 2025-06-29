import { EhIndexData } from '@env-hopper/backend-core';
import Dexie, { Table } from 'dexie';

class EnvHopperCacheDb extends Dexie {
  indexData!: Table<EhIndexData>;

  constructor() {
    super('envhopper');
    this.version(1).stores({
      indexData: ''
    });
  }
}

export const cacheDb = new EnvHopperCacheDb();

export enum CacheDbKeys {
  IndexData = 'indexData',
}
