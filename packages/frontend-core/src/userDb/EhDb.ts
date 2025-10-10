import Dexie from 'dexie'
import type {
  AppCatalogData,
  BootstrapConfigData,
  ResourceJumpsData,
  ResourceJumpsExtendedData,
} from '@env-hopper/backend-core'
import type { Table } from 'dexie'
import type { EnvironmentHistoryItem } from '~/modules/environment/types'
import type { ResourceJumpHistoryItem } from '~/modules/resourceJump/types'

export class EhDb extends Dexie {
  bootstrap!: Table<BootstrapConfigData>
  resourceJumps!: Table<ResourceJumpsData>
  resourceJumpsExtended!: Table<ResourceJumpsExtendedData>
  appCatalog!: Table<AppCatalogData>
  environmentHistory!: Table<EnvironmentHistoryItem>
  resourceJumpHistory!: Table<ResourceJumpHistoryItem>

  constructor() {
    super('envhopper')
    // Bump version when adding new tables to ensure Dexie upgrades schema
    this.version(15)
      .stores({
        bootstrap: '',
        resourceJumps: '',
        resourceJumpsExtended: '',
        appCatalog: '',
        environmentHistory: '++id, timestamp',
        resourceJumpHistory: '++id, timestamp',
      })
      .upgrade(async (tx) => {
        console.log('migration....')
        await tx
          .table('resourceJumpHistory')
          .toCollection()
          .modify((item) => {
            if (!item.type) {
              item.type = 'switch-selector'
              delete item.envSlug
            }
          })
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
  ResourceJumps = 'resourceJumps',
  ResourceJumpsExtended = 'resourceJumpsExtended',
  AppCatalog = 'appCatalog',
  EnvironmentHistory = 'environmentHistory',
  ResourceJumpHistory = 'resourceJumpHistory',
}
