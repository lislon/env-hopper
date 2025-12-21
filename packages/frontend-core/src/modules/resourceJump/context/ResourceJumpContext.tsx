import type {
  EnvSlug,
  JumpResourceSlug,
  LateResolvableParam,
} from '@env-hopper/backend-core'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { mapValues } from 'radashi'
import type { ReactNode } from 'react'
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useCrossCuttingParamsContext } from '~/modules/crossCuttingParams/CrossCuttingParamsContext'
import { useEnvironmentContext } from '~/modules/environment/context/EnvironmentContext'
import { useResourceJumpHistory } from '~/modules/resourceJump/context/useResouceJumpHistory'
import { getFlashipResource } from '~/modules/resourceJump/utils/helpers'
import { mapToResouceJumpUis } from '~/modules/resourceJump/utils/mapToResouceJumpUis'
import type { EhUrlParams } from '~/types/ehTypes'
import { useDb } from '~/userDb/DbContext'
import { getEhToOptions } from '~/util/route-utils'
import { ApiQueryMagazineResourceJump } from '../api/ApiQueryMagazineResourceJump'
import type {
  ResourceJumpHistoryItem,
  ResourceJumpLoaderReturn,
  ResourceJumpUI,
} from '../types'
import { buildJumpUrl } from '../utils/buildJumpUrl'
import type { FlagshipResourceJumpUi } from '../utils/mapToFlagshipResourceJumps'
import { mapToFlagshipResourceJumps } from '../utils/mapToFlagshipResourceJumps'

export interface ResourceJumpContextIface {
  setCurrentResourceJumpSlug: (slug: JumpResourceSlug | undefined) => void
  currentResourceJump: ResourceJumpUI | undefined
  flagshipJumpResources: Array<FlagshipResourceJumpUi>
  isLoadingResourceJumps: boolean
  getJumpUrl: (
    jumpResourceSlug: JumpResourceSlug | undefined,
    envSlug: EnvSlug | undefined,
  ) => string | undefined
  initialResourceSlug: string | undefined
  currentLateResolvableParams: Array<LateResolvableParam>
  currentLateResolvableParamsValue: Array<{ slug: string; value: string }>
  currentFlagship: FlagshipResourceJumpUi | undefined
  setCurrentFlagship: (slug: string | undefined) => void
  setLateResolvableParamValue: (slug: string, value: string) => void
  setLateResolvableParamValues: (values: Record<string, string>) => void
  quickEnvSlots: Array<string | undefined>
  quickAppSlots: Array<string | undefined>
  leftEnvSelectorValue: string
  setLeftEnvSelectorValue: (value: string) => void
  history: Array<ResourceJumpHistoryItem>
}

export const ResourceJumpContext = createContext<
  ResourceJumpContextIface | undefined
>(undefined)

interface ResourceJumpProviderProps {
  children: ReactNode
  initialJumpLinkSlug?: string
  resourceJumpLoader: ResourceJumpLoaderReturn
}

export function ResourceJumpProvider({
  children,
  resourceJumpLoader,
}: ResourceJumpProviderProps) {
  const { currentEnv } = useEnvironmentContext()
  const navigate = useNavigate()

  // Fetch ResourceJumpsData using React Query
  const { data: resourceJumpsData, isLoading: isLoadingResourceJumps } =
    useQuery(ApiQueryMagazineResourceJump.getResourceJumps())

  const [flagshipJumpResources] = useState<Array<FlagshipResourceJumpUi>>(() =>
    resourceJumpsData ? mapToFlagshipResourceJumps(resourceJumpsData) : [],
  )
  const [resourceJumps] = useState<Array<ResourceJumpUI>>(() =>
    resourceJumpsData
      ? mapToResouceJumpUis(resourceJumpsData, flagshipJumpResources)
      : [],
  )

  // const [currentFlagshipResourceJumpSlug, setCurrentFlagshipResourceJumpSlug] = useState<
  //   string | undefined
  // >(resourceJumpLoader.resourceSlug)

  // const [currentResourceJumpSlug2, setCurrentResourceJumpSlug] = useState<
  //   string | undefined
  // >(resourceJumpLoader.resourceSlug)

  const {
    history,
    setHistory,
    historySaveEnvSwitch,
    historySaveFlagmanSwitch,
  } = useResourceJumpHistory()

  // Global state for all late resolvable param values across all resources
  const [allLateResolvableParamValues, setAllLateResolvableParamValues] =
    useState<Record<string, string>>({})

  // Quick slot memories (global per user)
  const { data: quickSlots } = useQuery(
    ApiQueryMagazineResourceJump.getQuickSlots(),
  )
  const quickEnvSlots: Array<string | undefined> = useMemo(
    () => quickSlots?.envSlots ?? Array(7).fill(undefined),
    [quickSlots],
  )
  const quickAppSlots: Array<string | undefined> = useMemo(
    () => quickSlots?.appSlots ?? Array(8).fill(undefined),
    [quickSlots],
  )

  // No local loading effect; quick slots are sourced via React Query

  // Sync currentResourceJumpSlug with URL changes
  // When the URL changes externally, update our state to match
  // useEffect(() => {
  //   setCurrentResourceJumpSlug(resourceJumpLoader.resourceSlug)
  // }, [resourceJumpLoader.resourceSlug])

  const currentResourceJumpSlug = resourceJumpLoader.resourceSlug

  const fixUrlBasedOnSelection = useCallback(
    async (state: EhUrlParams, replace = false) => {
      const newLocal = getEhToOptions(state)
      // await navigate({
      //   ...newLocal,
      //   replace,
      // })
    },
    [navigate],
  )

  // Wrapped setter that saves to history
  const setCurrentResourceJumpSlugWithHistory = useCallback(
    (slug: string | undefined) => {
      // setCurrentResourceJumpSlug(slug)

      const newLocal = getEhToOptions({
        appId: slug,
        envId: currentEnv?.slug,
        subValue: resourceJumpLoader.subValue,
      })
      void navigate({
        ...newLocal,
        replace: true
      })


      const timestamp = Date.now()
      // if (slug !== undefined && currentEnv?.slug !== undefined) {
      //   const historyItem = {
      //     resourceSlug: slug,
      //     envSlug: currentEnv.slug,
      //     timestamp,
      //   }
      //   setHistory((prev) => [...prev, historyItem])
      //   db.resourceJumpHistory.add(historyItem)
      // }

      // Insert into quick app slots if room and not duplicate
      // Save group slug if resource is in a group, otherwise save resource slug
    },
    [],
  )

  const currentResourceJump = useMemo<ResourceJumpUI | undefined>(() => {
    const found: ResourceJumpUI | undefined = resourceJumps.find(
      (item) => item.slug === currentResourceJumpSlug,
    )
    return found
  }, [currentResourceJumpSlug, resourceJumps])
  

  const { setCrossCuttingParamsDefs } = useCrossCuttingParamsContext()
  useEffect(() => {
    setCrossCuttingParamsDefs(resourceJumpsData?.lateResolvableParams || [])
  }, [resourceJumpsData, setCrossCuttingParamsDefs])

  // Derive current late resolvable params for the selected resource
  const currentLateResolvableParams = useMemo(() => {
    if (!resourceJumpsData || !currentResourceJumpSlug) {
      return []
    }
    const resourceJump = resourceJumpsData.resourceJumps.find(
      (rj) => rj.slug === currentResourceJumpSlug,
    )
    if (!resourceJump?.lateResolvableParamSlugs) {
      return []
    }
    const paramMap = new Map(
      resourceJumpsData.lateResolvableParams.map((p) => [p.slug, p]),
    )
    return resourceJump.lateResolvableParamSlugs
      .map((slug) => paramMap.get(slug))
      .filter((p): p is LateResolvableParam => p !== undefined)
  }, [currentResourceJumpSlug, resourceJumpsData])

  // Derive current late resolvable param values for the selected resource
  const currentLateResolvableParamsValue = useMemo(() => {
    return currentLateResolvableParams.map((p) => ({
      slug: p.slug,
      value: allLateResolvableParamValues[p.slug] ?? '',
    }))
  }, [currentLateResolvableParams, allLateResolvableParamValues])

  // Setters for late resolvable params
  const setLateResolvableParamValue = useCallback(
    (slug: string, value: string) => {
      setAllLateResolvableParamValues((prev) => ({
        ...prev,
        [slug]: value,
      }))
    },
    [],
  )

  const setLateResolvableParamValues = useCallback(
    (values: Record<string, string>) => {
      setAllLateResolvableParamValues((prev) => ({
        ...prev,
        ...values,
      }))
    },
    [],
  )

  // Initialize late resolvable param value from URL only when env matches initialEnvSlug
  // This runs once and does not establish ongoing URL->context sync
  const didInitLateParamFromUrlRef = useRef(false)
  useEffect(() => {
    if (didInitLateParamFromUrlRef.current) {
      return
    }
    if (isLoadingResourceJumps) {
      return
    }
    const firstParam = currentLateResolvableParams[0]
    if (!firstParam) {
      return
    }
    const urlValue = resourceJumpLoader.subValue ?? ''
    const currentVal = allLateResolvableParamValues[firstParam.slug] ?? ''
    if (urlValue !== '' && currentVal === '') {
      setAllLateResolvableParamValues((prev) => ({
        ...prev,
        [firstParam.slug]: urlValue,
      }))
      didInitLateParamFromUrlRef.current = true
    }
  }, [
    isLoadingResourceJumps,
    currentLateResolvableParams,
    allLateResolvableParamValues,
    resourceJumpLoader.subValue,
  ])

  useEffect(() => {
    if (isLoadingResourceJumps) {
      return
    }
    const firstParam = currentLateResolvableParams[0]
    const localValue =
      allLateResolvableParamValues[firstParam?.slug || ''] ?? ''

    const params: EhUrlParams = {
      envId: currentEnv?.slug,
      appId: currentResourceJumpSlug,
      subValue: localValue || undefined,
    }

    // Only navigate if we have at least env and resource
    void fixUrlBasedOnSelection(params, true)
  }, [
    allLateResolvableParamValues,
    currentLateResolvableParams,
    currentEnv?.slug,
    currentResourceJumpSlug,
    fixUrlBasedOnSelection,
    isLoadingResourceJumps,
  ])

  // Handle navigation when environment or resource selection changes
  // This effect runs when the user makes a selection (not when syncing from URL)
  useEffect(() => {
    // Skip if we're still loading
    if (isLoadingResourceJumps) {
      return
    }

    // Skip if state matches URL - this means we just synced from URL, don't navigate
    const stateMatchesUrl =
      currentEnv?.slug === resourceJumpLoader.envSlug &&
      currentResourceJumpSlug === resourceJumpLoader.resourceSlug

    if (stateMatchesUrl) {
      return
    }

    const firstParam = currentLateResolvableParams[0]
    const subValue =
      firstParam && allLateResolvableParamValues[firstParam.slug]
        ? allLateResolvableParamValues[firstParam.slug]
        : undefined

    // If we have both env and resource selected, navigate to full URL
    if (currentEnv?.slug && currentResourceJumpSlug) {
      void fixUrlBasedOnSelection(
        { envId: currentEnv.slug, appId: currentResourceJumpSlug, subValue },
        true,
      )
    }
    // If we only have env selected (no resource), navigate to env-only URL
    else if (currentEnv?.slug && !currentResourceJumpSlug) {
      void fixUrlBasedOnSelection({ envId: currentEnv.slug }, true)
    }
  }, [
    currentEnv,
    currentResourceJumpSlug,
    resourceJumpLoader.envSlug,
    resourceJumpLoader.resourceSlug,
    allLateResolvableParamValues,
    currentLateResolvableParams,
    fixUrlBasedOnSelection,
    isLoadingResourceJumps,
  ])

  const { crossCuttingParams } = useCrossCuttingParamsContext()

  const getJumpUrl = useCallback(
    (
      jumpResourceSlug: JumpResourceSlug | undefined,
      envSlug: EnvSlug | undefined,
    ) => {
      return buildJumpUrl(
        jumpResourceSlug,
        envSlug,
        resourceJumpsData,
        mapValues(crossCuttingParams, (v) => v.stringValue),
      )
    },
    [resourceJumpsData, crossCuttingParams],
  )

  const currentFlagship = useMemo(() => {
    return currentResourceJump?.flagship
  }, [currentResourceJump])

  const setCurrentFlagship = useCallback(
    (slug: string | undefined) => {
      const flagship = flagshipJumpResources.find((rj) => rj.slug === slug)

      if (flagship) {
        const resouceJump = getFlashipResource(flagship).slug
        setCurrentResourceJumpSlugWithHistory(resouceJump)
        if (slug) {
          historySaveFlagmanSwitch(slug)
        }
      }
    },
    [flagshipJumpResources, historySaveFlagmanSwitch, setCurrentResourceJumpSlugWithHistory],
  )

  const [leftEnvSelectorValue, setLeftEnvSelectorValue] = useState<string>('')

  const value: ResourceJumpContextIface = useMemo(
    () => ({
      currentResourceJump,
      setCurrentResourceJumpSlug: setCurrentResourceJumpSlugWithHistory,
      isLoadingResourceJumps,
      getJumpUrl,
      initialResourceSlug: resourceJumpLoader.resourceSlug,
      currentLateResolvableParams,
      currentLateResolvableParamsValue,
      setLateResolvableParamValue,
      setLateResolvableParamValues,
      quickEnvSlots,
      quickAppSlots,
      flagshipJumpResources,
      currentFlagship,
      setCurrentFlagship,
      leftEnvSelectorValue,
      setLeftEnvSelectorValue,
      history,
    }),
    [
      currentResourceJump,
      setCurrentResourceJumpSlugWithHistory,
      isLoadingResourceJumps,
      getJumpUrl,
      resourceJumpLoader.resourceSlug,
      currentLateResolvableParams,
      currentLateResolvableParamsValue,
      setLateResolvableParamValue,
      setLateResolvableParamValues,
      quickEnvSlots,
      quickAppSlots,
      flagshipJumpResources,
      currentFlagship,
      setCurrentFlagship,
      leftEnvSelectorValue,
      history,
    ],
  )

  return <ResourceJumpContext value={value}>{children}</ResourceJumpContext>
}

export function useResourceJumpContext(): ResourceJumpContextIface {
  const context = use(ResourceJumpContext)
  if (context === undefined) {
    throw new Error(
      'useResourceJumpContext must be used within an ResourceJumpContext',
    )
  }
  return context
}
