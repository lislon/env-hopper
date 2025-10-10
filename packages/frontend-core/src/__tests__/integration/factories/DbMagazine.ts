import type { EhDb } from '~/userDb/EhDb'

export interface DbMagazineInstance {
  setup: (db: EhDb) => Promise<void> | void
}

export const DbMagazine = {
  default: (): DbMagazineInstance => {
    return {
      setup: async (db: EhDb) => {
        // Prepopulate two env slots and two app slots
        await db.quickEnvSlots.clear()
        await db.quickAppSlots.clear()
        const now = Date.now()
        await db.quickEnvSlots.bulkPut([
          { slot: 0, envSlug: 'dev', createdAt: now },
          { slot: 1, envSlug: 'staging', createdAt: now },
        ])
        await db.quickAppSlots.bulkPut([
          { slot: 0, appSlug: 'app1', createdAt: now },
          { slot: 1, appSlug: 'app2', createdAt: now },
        ])
      },
    }
  },
}
