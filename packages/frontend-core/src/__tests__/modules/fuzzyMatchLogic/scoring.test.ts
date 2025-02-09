// import { describe, expect, it } from 'vitest'
// import { makeInputEntry } from './testUtils'
// import type { FuzzySearchInputEntry } from '~/modules/fuzzyMatchLogic/types'
// import { score } from '~/modules/fuzzyMatchLogic/scoring'
// import { tokenize } from '~/modules/fuzzyMatchLogic/tokenize'

// describe('scoring', () => {
//   let db: Array<FuzzySearchInputEntry> = []

//   function doScore(needle: string) {
//     const result = score(db, needle, tokenize(needle))
//     return result
//   }

//   function given(strings: Array<string>) {
//     db = strings.map((title) => makeInputEntry(title))
//   }

//   describe('prefixFrac', () => {
//     it('prefix wins 1', () => {
//       given(['abc-dec', 'dec-abc'])
//       expect(doScore('dec')).toMatchInlineSnapshot(`
//         [
//           "dec-abc",
//           "abc-dec",
//         ]
//       `)
//     })

//     it('prefix wins 2', () => {
//       given(['x abcdev', 'abc-dev'])
//       expect(doScore('abcdev')).toMatchInlineSnapshot(`
//         [
//           "abc-dev",
//           "x abcdev",
//         ]
//       `)
//     })

//     it('prefix wins zero leads', () => {
//       given(['env-001', 'env-1'])
//       expect(doScore('1')).toMatchInlineSnapshot(`
//         [
//           "env-1",
//           "env-001",
//         ]
//       `)
//     })
//   })

//   describe('tokenCoverage', () => {
//     it('covers all tokens', () => {
//       given(['env-xxxx-33', 'env-xxx-33', 'env-xxx-3'])
//       expect(doScore('env-xxx-3')).toMatchInlineSnapshot(`
//         [
//           "env-xxx-3",
//           "env-xxx-33",
//           "env-xxxx-33",
//         ]
//       `)
//     })
//   })
// })
