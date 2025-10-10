import type { ResourceJumpsData } from '@env-hopper/backend-core'
import { describe, expect, it } from 'vitest'
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

    expect(actual).toMatchInlineSnapshot([
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
