import type {PluginPageUrlAutoCompletableParent,
  PluginPageUrlAutocompleteItem} from './pageUrlTypes';
import type {EhPluginResouceJumpFactoryCtx, EhPluginResourceJumpable} from '~/modules/pluginCore/types';

export class PageUrlJumpPlugin implements EhPluginResourceJumpable {
  public readonly name = 'pageUrl'

  factoryPageJumpAutocompleteItems({
    bootstrapConfig,
  }: EhPluginResouceJumpFactoryCtx): Array<PluginPageUrlAutocompleteItem> {
    return Object.values(bootstrapConfig.apps).flatMap((app) => {
      const parent: PluginPageUrlAutoCompletableParent = {
        type: 'pageUrlParent',
        displayName: app.displayName,
        hasSingleChild: app.ui?.pages.length === 1,
      }
      return (
        app.ui?.pages.map((page) => {
          return {
            type: 'pageUrl',
            displayName: page.displayName || page.slug,
            parent: parent,
            slug: `${app.slug}-${page.slug}`,
          }
        }) || []
      )
    })
  }
}

export function formatPageTitleForMainJumpButton() {}
