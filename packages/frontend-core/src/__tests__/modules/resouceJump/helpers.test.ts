import { describe, expect, it } from 'vitest'
import { mapDisplayedItems } from '../../../modules/resourceJump/utils/helpers.js'
import type { PluginPageUrlAutocompleteItem } from '~/plugins/builtin/pageUrl/pageUrlTypes.js'

describe('mapDisplayedItems', () => {
  it('should not mark ungrouped items as children', () => {
    const items: Array<PluginPageUrlAutocompleteItem> = [
      {
        type: 'pageUrl',
        slug: 'app-a-home',
        displayName: 'App A',
        parent: undefined,
      },
      {
        type: 'pageUrl',
        slug: 'app-b-home',
        displayName: 'App B',
        parent: undefined,
      },
    ]

    const result = Array.from(mapDisplayedItems(items))

    expect(result).toMatchInlineSnapshot(`
      [
        {
          "isChild": false,
          "item": {
            "displayName": "App A",
            "slug": "app-a-home",
            "type": "pageUrl",
          },
          "itemRenderData": {
            "displayName": "App A",
            "isDefaultGroupItem": true,
            "parentDisplayName": undefined,
          },
        },
        {
          "isChild": false,
          "item": {
            "displayName": "App B",
            "slug": "app-b-home",
            "type": "pageUrl",
          },
          "itemRenderData": {
            "displayName": "App B",
            "isDefaultGroupItem": true,
            "parentDisplayName": undefined,
          },
        },
      ]
    `)
  })
})
