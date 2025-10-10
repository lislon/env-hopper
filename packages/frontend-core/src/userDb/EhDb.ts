import Dexie from 'dexie'
import type {
  BootstrapConfigData,
  ResourceJumpsData,
} from '@env-hopper/backend-core'
import type { Table } from 'dexie'
import type { EnvironmentHistoryItem } from '~/modules/environment/types'
import type { ResourceJumpHistoryItem } from '~/modules/resourceJump/types'

export class EhDb extends Dexie {
  bootstrap!: Table<BootstrapConfigData>
  resourceJumps!: Table<ResourceJumpsData>
  environmentHistory!: Table<EnvironmentHistoryItem>
  resourceJumpHistory!: Table<ResourceJumpHistoryItem>
  quickEnvSlots!: Table<{ slot: number; envSlug: string; createdAt: number }>
  quickAppSlots!: Table<{ slot: number; appSlug: string; createdAt: number }>

  constructor() {
    super('envhopper')
    // Bump version when adding new tables to ensure Dexie upgrades schema
    this.version(7).stores({
      bootstrap: '',
      resourceJumps: '',
      environmentHistory: '++id',
      resourceJumpHistory: '++id',
      quickEnvSlots: 'slot',
      quickAppSlots: 'slot',
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
