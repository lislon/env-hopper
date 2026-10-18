import { describe, expect, it } from 'vitest'
import { tableSync } from './tableSync'

interface Row {
  id: number
  a: string
  b: string
  v: number
}

function memoryTable(rows: Array<Row>) {
  const writes: {
    create: Array<Omit<Row, 'id'>>
    update: Array<Partial<Row>>
    deleteIds: Array<number>
    deleteRows: Array<Row>
  } = { create: [], update: [], deleteIds: [], deleteRows: [] }
  let next = 100
  const sync = tableSync<Row, readonly ['a', 'b'], 'id'>({
    id: 'id',
    uniqColumns: ['a', 'b'],
    readAll: () => Promise.resolve(rows),
    writeAll: (create, update, deleteIds, deleteRows) => {
      writes.create = create
      writes.update = update.map((u) => u.data)
      writes.deleteIds = deleteIds
      writes.deleteRows = deleteRows
      return Promise.resolve(create.map((c) => ({ ...c, id: next++ })))
    },
  })
  return { sync, writes }
}

describe('tableSync', () => {
  it('keeps keys whose values contain the separator apart', async () => {
    const { sync, writes } = memoryTable([{ id: 1, a: 'x:y', b: 'z', v: 1 }])

    const result = await sync.sync([{ a: 'x', b: 'y:z', v: 1 }])

    expect(writes.create).toEqual([{ a: 'x', b: 'y:z', v: 1 }])
    expect(writes.deleteIds).toEqual([1])
    expect(result.counts).toEqual({
      created: 1,
      updated: 0,
      deleted: 1,
      unchanged: 0,
    })
  })

  it('finds no id for a row it deleted', async () => {
    const { sync } = memoryTable([
      { id: 1, a: 'keep', b: '', v: 1 },
      { id: 2, a: 'gone', b: '', v: 1 },
    ])

    const result = await sync.sync([{ a: 'keep', b: '', v: 1 }])

    expect(result.findIdMaybe({ a: 'keep', b: '' })).toBe(1)
    expect(result.findIdMaybe({ a: 'gone', b: '' })).toBeUndefined()
  })

  it('counts and hands over every kind of change', async () => {
    const { sync, writes } = memoryTable([
      { id: 1, a: 'same', b: '', v: 1 },
      { id: 2, a: 'changed', b: '', v: 1 },
      { id: 3, a: 'gone', b: '', v: 1 },
    ])

    const result = await sync.sync([
      { a: 'same', b: '', v: 1 },
      { a: 'changed', b: '', v: 2 },
      { a: 'new', b: '', v: 1 },
    ])

    expect(result.counts).toEqual({
      created: 1,
      updated: 1,
      deleted: 1,
      unchanged: 1,
    })
    expect(writes.update).toEqual([{ a: 'changed', b: '', v: 2 }])
    expect(writes.deleteRows).toEqual([{ id: 3, a: 'gone', b: '', v: 1 }])
    expect(result.deleted).toEqual([{ id: 3, a: 'gone', b: '', v: 1 }])
    expect(result.findIdOrThrow({ a: 'new', b: '' })).toBe(100)
  })

  it('works without an id column, keyed by the unique columns', async () => {
    let deleted: Array<{ a: string; v: number }> = []
    const sync = tableSync<{ a: string; v: number }, readonly ['a'], never>({
      uniqColumns: ['a'],
      readAll: () => Promise.resolve([{ a: 'gone', v: 1 }]),
      writeAll: (_create, _update, deleteIds, deleteRows) => {
        expect(deleteIds).toEqual([])
        deleted = deleteRows
        return Promise.resolve([])
      },
    })

    await sync.sync([{ a: 'new', v: 1 }])

    expect(deleted).toEqual([{ a: 'gone', v: 1 }])
  })
})
