import type {
  EhApp,
  EhAppId,
  EhClientConfig,
  EhEnv,
  EhEnvId,
  EhJumpHistory,
  EhJumpParams,
  EhSubstitutionType,
  EhSubstitutionValue,
} from '../types'
import React, { createContext, use, useCallback, useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import {
  findSubstitutionIdByUrl,
  getJumpUrl,
  maskSensitiveDataIfNeeded,
} from '../lib/utils'
import { MAX_HISTORY_JUMPS } from '../lib/constants'
import { migrateStoredAppIds } from '../lib/migrateStoredAppIds'
import { useLegacyConfig } from '../adapter/legacyApi'
import {
  LOCAL_STORAGE_HIDE_SENSITIVE_INFO,
  LOCAL_STORAGE_KEY_FAVORITE_APPS,
  LOCAL_STORAGE_KEY_FAVORITE_ENVS,
  LOCAL_STORAGE_KEY_RECENT_JUMPS,
  LOCAL_STORAGE_KEY_USER_ID,
} from '../lib/local-storage-constants'

export interface EhContextProps {
  listEnvs: Array<EhEnv>
  listApps: Array<EhApp>
  listSubstitutions: Array<EhSubstitutionType>
  listFavoriteEnvs: Array<EhEnvId>
  listFavoriteApps: Array<EhAppId>
  toggleFavoriteEnv: (envId: EhEnvId, isOn: boolean) => void
  toggleFavoriteApp: (appId: EhAppId, isOn: boolean) => void

  getAppById: (id: EhAppId | undefined) => EhApp | undefined
  getEnvById: (id: EhEnvId | undefined) => EhEnv | undefined

  getSubstitutionValueById: (
    envId: EhEnvId | undefined,
    appId: EhAppId | undefined,
    substitution: string | undefined,
  ) => EhSubstitutionValue | undefined

  recordJump: (jump: EhJumpParams) => void

  // add params?
  // tryJump(): void;

  // most recent in the beginning
  recentJumps: Array<EhJumpHistory>
  isHideSensitiveInfo: boolean
  setHideSensitiveInfo: (yesOrNo: boolean) => void
  config: EhClientConfig
}

//  createContext is not supported in Server Components
const EhContext = createContext<EhContextProps | undefined>(undefined)

export function useEhContext(): EhContextProps {
  const ctx = use(EhContext)
  if (ctx === undefined) {
    throw new Error('EhContext is not provided')
  }
  return ctx
}

export function doGetAppById(id: string | undefined, ehApps: Array<EhApp>) {
  return ehApps.find((app) => app.id === id) || undefined
}

export function doGetEnvById(id: string | undefined, ehEnvs: Array<EhEnv>) {
  return ehEnvs.find((env) => env.id === id) || undefined
}

export interface EhContextProviderProps {
  children: React.ReactNode
}

/**
 * `MainLayout` only renders its children once the config has resolved, so this
 * is a type-level fallback rather than a state users reach. Rendering the form
 * against empty lists is still the harmless outcome if that ever changes.
 */
const EMPTY_CONFIG: EhClientConfig = {
  envs: [],
  apps: [],
  substitutions: [],
}

export function EhContextProvider({ children }: EhContextProviderProps) {
  // First, before any stored value below is read: a returning user's app ids are
  // in the previous UI's form. See `migrateStoredAppIds`.
  useState(() => migrateStoredAppIds())
  /*
   * Was a suspense query straight onto `/api/config`. The adapter hook shapes
   * the current procedures into the same payload; `MainLayout` already holds the
   * loading and error branches, so by the time this renders the data is there.
   *
   * NOT PORTED, FOR WANT OF A SERVER: recording a jump used to also fire a
   * `POST /api/stats/jump` mutation carrying `{envId, appId, sub, date}` plus a
   * user-id and app-version header, which the previous backend wrote to a
   * `stats_jump` table and read back through a matching GET. The current router
   * exposes no equivalent — and no mutation of any kind — so there is nothing for a
   * client call to reach. Shipping the client half anyway would post into the SPA's
   * history fallback, which answers 200 with HTML and so fails silently.
   *
   * What the core needs before this can be a two-line change here:
   *   - a `stats` router with a `jump` mutation (the only new endpoint in this
   *     migration) taking that same input, and a matching method on the
   *     company-specific backend interface so a deployment decides where it lands;
   *   - the user id: the previous client sent a per-browser uuid header, and the
   *     uuid is still minted below into local storage, so only the transport is
   *     missing;
   *   - the app version, which does not exist anywhere yet (see the note on
   *     `ui/Error/DefaultErrorPage`).
   *
   * Nothing user-facing depends on it: the local history below is what feeds the
   * quick bars and the recent section. Only the server-side counter is missing.
   */
  const { data } = useLegacyConfig()
  const config: EhClientConfig = data ?? EMPTY_CONFIG

  useLocalStorage<string | undefined>(LOCAL_STORAGE_KEY_USER_ID, () =>
    crypto.randomUUID(),
  )

  const [recentJumps, setRecentJumps] = useLocalStorage<Array<EhJumpHistory>>(
    LOCAL_STORAGE_KEY_RECENT_JUMPS,
    [],
  )
  const [listFavoriteEnvs, setFavoriteEnvIds] = useLocalStorage<Array<EhEnvId>>(
    LOCAL_STORAGE_KEY_FAVORITE_ENVS,
    [],
  )
  const [listFavoriteApps, setFavoriteAppIds] = useLocalStorage<Array<EhAppId>>(
    LOCAL_STORAGE_KEY_FAVORITE_APPS,
    [],
  )

  const [isHideSensitiveInfo, setHideSensitiveInfo] = useLocalStorage<boolean>(
    LOCAL_STORAGE_HIDE_SENSITIVE_INFO,
    true,
  )

  const listEnvs = config.envs
  const listApps = config.apps

  const getAppById = useCallback(
    (id: EhAppId | undefined) => {
      return doGetAppById(id, listApps)
    },
    [listApps],
  )

  /*
   * INTENTIONAL DIFF: this memo was keyed on `listApps`, so an environment
   * lookup kept returning results from the first payload it ever saw. Same
   * copy-paste in `toggleFavoriteEnv` and `getSubstitutionValueById` below.
   */
  const getEnvById = useCallback(
    (id: EhEnvId | undefined) => {
      return doGetEnvById(id, listEnvs)
    },
    [listEnvs],
  )

  const recordJump = useCallback<EhContextProps['recordJump']>(
    ({ app, env, substitution }) => {
      const substitutionMasked = substitution
        ? {
            name: substitution.name,
            value: maskSensitiveDataIfNeeded(substitution.value, { env }),
          }
        : undefined
      const jumpUrl = getJumpUrl({
        app: app,
        env: env,
        substitution: substitutionMasked,
      })
      if (jumpUrl === undefined) {
        return
      }
      const newJump: EhJumpHistory = {
        app: app?.id,
        env: env?.id,
        substitution: substitutionMasked?.value,
        url: jumpUrl,
      }
      setRecentJumps((old) => {
        return [newJump, ...old.filter((h) => h.url !== jumpUrl)].slice(
          0,
          MAX_HISTORY_JUMPS,
        )
      })
    },
    [setRecentJumps],
  )

  const value: EhContextProps = {
    listFavoriteEnvs,
    listFavoriteApps,
    listEnvs: listEnvs,
    listApps: listApps,
    listSubstitutions: config.substitutions,
    getAppById,
    getEnvById,
    recordJump,
    toggleFavoriteEnv: useCallback<EhContextProps['toggleFavoriteEnv']>(
      (envId, isOn) => {
        setFavoriteEnvIds((old) => {
          return [...(isOn ? [envId] : []), ...old.filter((id) => id !== envId)]
        })
      },
      [setFavoriteEnvIds],
    ),
    toggleFavoriteApp: useCallback<EhContextProps['toggleFavoriteApp']>(
      (appId, isOn) => {
        setFavoriteAppIds((old) => {
          return [...(isOn ? [appId] : []), ...old.filter((id) => id !== appId)]
        })
      },
      [setFavoriteAppIds],
    ),
    getSubstitutionValueById: useCallback<
      EhContextProps['getSubstitutionValueById']
    >(
      (envId, appId, substitution) => {
        const substitutionIdByUrl = findSubstitutionIdByUrl({
          env: doGetEnvById(envId, listEnvs),
          app: doGetAppById(appId, listApps),
        })
        if (substitutionIdByUrl !== undefined && substitution !== undefined) {
          return {
            name: substitutionIdByUrl,
            value: substitution,
          }
        }
        return undefined
      },
      [listApps, listEnvs],
    ),
    recentJumps,
    isHideSensitiveInfo,
    setHideSensitiveInfo,
    config,
  }

  return <EhContext value={value}>{children}</EhContext>
}
