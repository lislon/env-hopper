import type { EhDb } from '~/userDb/EhDb'

export interface DbMagazineInstance {
  setup: (db: EhDb) => Promise<void> | void
}

export const DbMagazine = {
  default: (): DbMagazineInstance => {
    return {
      setup: async (_db: EhDb) => {},
    }
  },
}
