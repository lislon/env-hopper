// @vitest-environment node
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { EhDatabaseManager } from '../../middleware/database'
import { createCatalog } from '../../catalog'
import { getTestCatalogClient, resetCatalog } from './testDb'

const prisma = getTestCatalogClient()

describe.skipIf(!prisma)('EhDatabaseManager', () => {
  let manager: EhDatabaseManager | undefined

  beforeEach(() => resetCatalog(prisma!))
  afterAll(() => manager?.disconnect())

  it('writes into the schema named in the url, not public', async () => {
    // given
    const url = process.env.EH_CORE_TEST_DATABASE_URL!
    const schema = new URL(url).searchParams.get('schema')
    manager = new EhDatabaseManager({ url })
    expect(schema).not.toBe('public')
    const catalog = createCatalog(manager.getClient())
    // act
    await catalog.upsertApps([{ slug: 'schema-probe', displayName: 'Probe' }])
    // assert
    const [row] = await prisma!.$queryRawUnsafe<Array<{ inSchema: bigint }>>(
      `select count(*) as "inSchema" from "${schema}"."CatalogApp" where slug = 'schema-probe'`,
    )
    expect(row).toEqual({ inSchema: 1n })
  })
})
