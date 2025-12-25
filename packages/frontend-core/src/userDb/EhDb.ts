import type {
  BootstrapConfigData,
  ResourceJumpsData,
} from '@env-hopper/backend-core'
import type { Table } from 'dexie'
import Dexie from 'dexie'
import type { EnvironmentHistoryItem } from '~/modules/environment/types'
import type { ResourceJumpHistoryItem } from '~/modules/resourceJump/types'

export class EhDb extends Dexie {
  bootstrap!: Table<BootstrapConfigData>
  resourceJumps!: Table<ResourceJumpsData>
  environmentHistory!: Table<EnvironmentHistoryItem>
  resourceJumpHistory!: Table<ResourceJumpHistoryItem>

  constructor() {
    super('envhopper')
    // Bump version when adding new tables to ensure Dexie upgrades schema
    this.version(11)
      .stores({
        bootstrap: '',
        resourceJumps: '',
        environmentHistory: '++id',
        resourceJumpHistory: '++id',
      })
      .upgrade(async (tx) => {
        console.log('migration....')
        await tx
          .table('resourceJumpHistory')
          .toCollection()
          .modify((item) => {
            console.log('migration of ', item)

            if (!item.type) {
              item.type = 'switch-selector'
              delete item.envSlug
            }

            console.log('now is ', item)
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
  EnvironmentHistory = 'environmentHistory',
  ResourceJumpHistory = 'resourceJumpHistory',
}
