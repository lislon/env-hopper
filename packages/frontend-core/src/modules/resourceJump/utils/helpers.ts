import type { EhAppIndexed, EhEnvIndexed } from '@env-hopper/backend-core'
import type {
  BaseAppAutoCompletableParent,
  BaseAutoCompletableItem,
} from '~/modules/pluginCore/types'
import type { ResourceJumpUI } from '~/modules/resourceJump/types'
import type { FlagshipResourceJumpUi } from '~/modules/resourceJump/utils/mapToFlagshipResourceJumps'
import type { EhUrlParams } from '~/types/ehTypes'
import {
  getRenderData,
  isAutocompleteItem,
} from '~/plugins/builtin/pageUrl/pageUrlAutoCompletePlugin'

export function* mapDisplayedItems(
  displayedItems: Array<BaseAutoCompletableItem>,
) {
  let lastParent: BaseAppAutoCompletableParent | undefined = undefined

  for (const item of displayedItems) {
    if (isAutocompleteItem(item)) {
      const itemRenderData = getRenderData(item)
      // Only treat as child if both items have the same non-undefined parent
      const isChild = item.parent !== undefined && item.parent === lastParent
      yield {
        item,
        itemRenderData,
        isChild,
      }
    }
    lastParent = item.parent
  }
}

export function isFlagshipPageByName(
  resourceJump: ResourceJumpUI | undefined,
): boolean {
  return (
    !!resourceJump &&
    resourceJump.displayName === 'Home' &&
    !!resourceJump.flagship
  )
}

export function isFlagshipResource(
  resourceJump: ResourceJumpUI | undefined,
): boolean {
  if (!resourceJump?.flagship) return false
  return resourceJump.slug === resourceJump.flagship.resourceJumps[0]?.slug
}

export function getFlashipResource(
  flagship: FlagshipResourceJumpUi,
): ResourceJumpUI {
  return flagship.resourceJumps[0]!
}

export function formatResourceTitle(
  resourceJump: ResourceJumpUI | undefined,
  defaultTitle: string = '',
) {
  if (resourceJump === undefined) {
    return defaultTitle
  }
  if (isFlagshipPageByName(resourceJump)) {
    return resourceJump.flagship.displayName
  }
  if (resourceJump.flagship.displayName === resourceJump.displayName) {
    return resourceJump.displayName
  }
  return resourceJump.flagship.displayName + ' :: ' + resourceJump.displayName
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

export function loadEnvAndResourceByRawUrlParams({
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
