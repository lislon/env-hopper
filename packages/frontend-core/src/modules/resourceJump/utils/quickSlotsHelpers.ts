import type { ResourceJumpsData } from '@env-hopper/backend-core'
import type { QueryClient } from '@tanstack/react-query'
import type { EhDb } from '~/userDb/EhDb'

export const ENV_SLOTS_COUNT = 7
export const APP_SLOTS_COUNT = 8

export type QuickSlotsData = {
  envSlots: Array<string | undefined>
  appSlots: Array<string | undefined>
}

function getQuickSlots(queryClient: QueryClient): QuickSlotsData {
  const prev = queryClient.getQueryData<QuickSlotsData>(['quickSlots'])
  return {
    envSlots: prev?.envSlots ?? Array(ENV_SLOTS_COUNT).fill(undefined),
    appSlots: prev?.appSlots ?? Array(APP_SLOTS_COUNT).fill(undefined),
  }
}

export async function addAppQuickSlot(
  db: EhDb,
  queryClient: QueryClient,
  resourceSlug: string,
  resourceJumpsData?: ResourceJumpsData,
): Promise<void> {
  const { envSlots, appSlots } = getQuickSlots(queryClient)

  // If resource is in a group, save the group slug instead of the resource slug
  // Otherwise, save the resource slug
  const group = resourceJumpsData?.groups?.find((g) =>
    g.resourceSlugs.includes(resourceSlug),
  )
  const slugToSave = group ? group.slug : resourceSlug

  if (appSlots.includes(slugToSave)) {
    return
  }
  const emptyIdx = appSlots.findIndex((s) => s === undefined)
  if (emptyIdx === -1) {
    return
  }
  await db.quickAppSlots.put({
    slot: emptyIdx,
    appSlug: slugToSave,
    createdAt: Date.now(),
  })
  const nextApp = [...appSlots]
  nextApp[emptyIdx] = slugToSave
  queryClient.setQueryData(['quickSlots'], { envSlots, appSlots: nextApp })
}

export async function addEnvQuickSlot(
  db: EhDb,
  queryClient: QueryClient,
  slug: string,
): Promise<void> {
  const { envSlots, appSlots } = getQuickSlots(queryClient)
  if (envSlots.includes(slug)) {
    return
  }
  const emptyIdx = envSlots.findIndex((s) => s === undefined)
  if (emptyIdx === -1) {
    return
  }
  await db.quickEnvSlots.put({
    slot: emptyIdx,
    envSlug: slug,
    createdAt: Date.now(),
  })
  const nextEnv = [...envSlots]
  nextEnv[emptyIdx] = slug
  queryClient.setQueryData(['quickSlots'], { envSlots: nextEnv, appSlots })
}
