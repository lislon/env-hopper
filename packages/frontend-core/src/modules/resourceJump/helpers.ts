import type { EhAppIndexed, EhEnvIndexed } from '@env-hopper/backend-core'
import type {
  BaseAppAutoCompletableParent,
  BaseAutoCompletableItem
} from '~/modules/pluginCore/types'
import {
  getRenderData,
  isAutocompleteItem,
} from '~/plugins/builtin/pageUrl/pageUrlAutoCompletePlugin'
import type { EhUrlParams } from '~/types/ehTypes'
import type { ResourceJumpItem } from './types'

export function* mapDisplayedItems(displayedItems: Array<BaseAutoCompletableItem>) {
  let lastParent: BaseAppAutoCompletableParent | undefined = undefined

  for (const item of displayedItems) {
    if (isAutocompleteItem(item)) {
      const itemRenderData = getRenderData(item)
      yield {
        item,
        itemRenderData,
        isChild: item.parent === lastParent,
      }
    }
    lastParent = item.parent
  }
}

export function formatResourceTitle(resouceJump: ResourceJumpItem | undefined) {
  if (resouceJump === undefined) {
    return ''
  }
  return [resouceJump.parent?.displayName, resouceJump.slug]
    .filter(Boolean)
    .join(' :: ')
}

export function getByIdRelaxed<T extends { slug: string }>(
  primarySearch: (slug: string | undefined) => T | undefined,
  id: string | undefined,
): [T | undefined, boolean] {
  if (id !== undefined) {
    const exactMatchResult = primarySearch(id)
    if (exactMatchResult !== undefined) {
      return [exactMatchResult, true]
    }

    // const items: SourceItem[] = options.map((e) => ({ title: e.slug, slug: e.slug }));
    // const found = makeAutoCompleteFilter(items)(id.toLowerCase(), items);
    // if (found.length === 1) {
    //   return [primarySearch(found[0].id, options), false];
    // }
  }
  return [undefined, false]
}

export interface PreselectedBasedOnParams {
  rawUrlParams: EhUrlParams
  config: {
    envs: Record<string, EhEnvIndexed>
    apps: Record<string, EhAppIndexed>
  }
  lastUsedEnvSlug: string | undefined
  lastUsedAppSlug: string | undefined
}

export interface PreselectedBasedOnParamsReturn {
  urlWasFixed: boolean
  env: EhEnvIndexed | undefined
  app: EhAppIndexed | undefined
}

export function loadEnvAndResouceByRawUrlParams({
  rawUrlParams: urlParams,
  config,
  lastUsedEnvSlug: lastUsedEnvSlug,
  lastUsedAppSlug: lastUsedAppSlug,
}: PreselectedBasedOnParams): PreselectedBasedOnParamsReturn {
  let selectedEnv: EhEnvIndexed | undefined = undefined
  let selectedApp: EhAppIndexed | undefined = undefined
  let urlWasFixed = false

  const doGetEnvById = (envId: string | undefined) =>
    envId ? config.envs[envId] : undefined
  const doGetAppById = (appId: string | undefined) =>
    appId ? config.apps[appId] : undefined

  if (urlParams.envId !== undefined) {
    let strictMatch
    ;[selectedEnv, strictMatch] = getByIdRelaxed<EhEnvIndexed>(
      doGetEnvById,
      urlParams.envId,
    )
    if (!strictMatch) {
      urlWasFixed = true
    }
  } else if (lastUsedEnvSlug !== undefined) {
    ;[selectedEnv] = getByIdRelaxed(doGetEnvById, lastUsedEnvSlug)
  }

  if (urlParams.appId !== undefined) {
    let strictMatch
    ;[selectedApp, strictMatch] = getByIdRelaxed<EhAppIndexed>(
      (appId) => (appId ? config.apps[appId] : undefined),
      urlParams.appId,
    )
    if (!strictMatch) {
      urlWasFixed = true
    }
  } else if (lastUsedAppSlug !== undefined) {
    ;[selectedApp] = getByIdRelaxed(doGetAppById, lastUsedAppSlug)
  }

  return { urlWasFixed, env: selectedEnv, app: selectedApp }
}
