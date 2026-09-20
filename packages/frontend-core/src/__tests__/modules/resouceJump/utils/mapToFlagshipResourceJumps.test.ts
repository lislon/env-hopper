import { describe, expect, it } from 'vitest'
import type { ResourceJumpsData } from '@env-hopper/backend-core'
import {
  tmResourceJump,
  tmResourceJumpGroup,
} from '~/__tests__/util/TestMagazine.js'
import { mapToFlagshipResourceJumps } from '~/modules/resourceJump/utils/mapToFlagshipResourceJumps'

describe('grouping helpers', () => {
  it('should be grouped', () => {
    const input: Pick<ResourceJumpsData, 'resourceJumps' | 'groups'> = {
      resourceJumps: [
        tmResourceJump('single'),
        tmResourceJump('grouped-a'),
        tmResourceJump('grouped-b'),
      ],
      groups: [tmResourceJumpGroup('grouped', ['grouped-a', 'grouped-b'])],
    }

    const actual = mapToFlagshipResourceJumps(input)

    // `toMatchObject`, not `toMatchInlineSnapshot`: the array below was being
    // passed as that matcher's first argument, where it is read as property
    // matchers rather than as the expected value. With no snapshot string nothing
    // was ever recorded, so a local run silently wrote one and passed while CI,
    // which refuses to write new snapshots, failed.
    //
    // `toMatchObject` rather than `toEqual` because each resource jump also
    // carries a `flagship` back-reference to its group, which is circular and
    // which the UI relies on. The grouping this test is about — which jumps end up
    // under which flagship, and in what order — is asserted in full.
    expect(actual).toMatchObject([
      {
        slug: 'grouped',
        displayName: 'grouped',
        resourceJumps: [
          {
            displayName: 'grouped-a',
            slug: 'grouped-a',
            urlTemplate: {
              default: '',
            },
          },
          {
            displayName: 'grouped-b',
            slug: 'grouped-b',
            urlTemplate: {
              default: '',
            },
          },
        ],
      },
      {
        displayName: 'single',
        slug: 'single',
        resourceJumps: [
          {
            displayName: 'single',
            slug: 'single',
            urlTemplate: {
              default: '',
            },
          },
        ],
      },
    ])
  })
})
