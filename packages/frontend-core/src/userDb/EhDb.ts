import Dexie from 'dexie'
import type { Table } from 'dexie'
import type { BootstrapConfigData } from '@env-hopper/backend-core'
import type { EnvironmentHistoryItem } from '~/modules/environment/types'

export class EhDb extends Dexie {
  bootstrap!: Table<BootstrapConfigData>
  environmentHistory!: Table<EnvironmentHistoryItem>

  constructor() {
    super('envhopper')
    this.version(4).stores({
      bootstrap: '',
      environmentHistory: '++id', // Recreate with new schema
    })
  }

  /**
   * Resets the entire database by deleting and recreating it
   * This clears all data and resets version tracking to fix migration issues
   */
  async resetDatabase(): Promise<void> {
    const dbName = this.name
    this.close()
    await Dexie.delete(dbName)
    await this.open()
  }
}

export enum dbCacheDbKeys {
  Bootstrap = 'bootstrap',
  EnvironmentHistory = 'environmentHistory',
}
