import type {
  EnvSlug,
  JumpResourceSlug,
  LateResolvableParam
} from '@env-hopper/backend-core'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
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
import { mapToResouceJumpUis } from '~/modules/resourceJump/utils/mapToResouceJumpUis'
import type { EhUrlParams } from '~/types/ehTypes'
import { useDb } from '~/userDb/DbContext'
import { getEhToOptions } from '~/util/route-utils'
import { useEnvironmentContext } from '../environment/EnvironmentContext'
import { ApiQueryMagazineResourceJump } from './api/ApiQueryMagazineResourceJump'
import type {
  ResourceJumpHistoryItem,
  ResourceJumpLoaderReturn,
  ResourceJumpUI
} from './types'
import { buildJumpUrl } from './utils/buildJumpUrl'
import type { FlagshipResourceJumpUi } from './utils/mapToFlagshipResourceJumps'
import { mapToFlagshipResourceJumps } from './utils/mapToFlagshipResourceJumps'
import { addAppQuickSlot, addEnvQuickSlot } from './utils/quickSlotsHelpers'

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
  getHistory: () => Array<ResourceJumpHistoryItem>
  currentLateResolvableParams: Array<LateResolvableParam>
  currentLateResolvableParamsValue: Array<{ slug: string; value: string }>
  currentFlagship: FlagshipResourceJumpUi|undefined;
  setCurrentFlagship: (slug: string | undefined) => void;
  setLateResolvableParamValue: (slug: string, value: string) => void
  setLateResolvableParamValues: (values: Record<string, string>) => void
  quickEnvSlots: Array<string | undefined>
  quickAppSlots: Array<string | undefined>
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
  const db = useDb()
  const queryClient = useQueryClient()

  // Fetch ResourceJumpsData using React Query
  const { data: resourceJumpsData, isLoading: isLoadingResourceJumps } =
    useQuery(ApiQueryMagazineResourceJump.getResourceJumps())

  const [flagshipJumpResources] = useState<Array<FlagshipResourceJumpUi>>(
    () => resourceJumpsData ? mapToFlagshipResourceJumps(resourceJumpsData) : []
  )

  const [resourceJumps] = useState<Array<ResourceJumpUI>>(
    () => resourceJumpsData ? mapToResouceJumpUis(resourceJumpsData, flagshipJumpResources): []);

  // const [currentFlagshipResourceJumpSlug, setCurrentFlagshipResourceJumpSlug] = useState<
  //   string | undefined
  // >(resourceJumpLoader.resourceSlug)

  const [currentResourceJumpSlug, setCurrentResourceJumpSlug] = useState<
    string | undefined
  >(resourceJumpLoader.resourceSlug)


  const [history, setHistory] = useState<Array<ResourceJumpHistoryItem>>([])

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

  // Load history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      const historyItems = await db.resourceJumpHistory
        .toCollection()
        .sortBy('timestamp')
      setHistory(historyItems)
    }
    fetchHistory()
  }, [db.resourceJumpHistory])

  // No local loading effect; quick slots are sourced via React Query

  // Sync currentResourceJumpSlug with URL changes
  // When the URL changes externally, update our state to match
  useEffect(() => {
    setCurrentResourceJumpSlug(resourceJumpLoader.resourceSlug)
  }, [resourceJumpLoader.resourceSlug])

  const fixUrlBasedOnSelection = useCallback(
    async (state: EhUrlParams, replace = false) => {
      await navigate({
        ...getEhToOptions(state),
        replace,
      })
    },
    [navigate],
  )

  // Wrapped setter that saves to history
  const setCurrentResourceJumpSlugWithHistory = useCallback(
    (slug: string | undefined) => {
      setCurrentResourceJumpSlug(slug)
      const timestamp = Date.now()
      if (slug !== undefined && currentEnv?.slug !== undefined) {
        const historyItem = {
          resourceSlug: slug,
          envSlug: currentEnv.slug,
          timestamp,
        }
        setHistory((prev) => [...prev, historyItem])
        db.resourceJumpHistory.add(historyItem)
      }

      // Insert into quick app slots if room and not duplicate
      // Save group slug if resource is in a group, otherwise save resource slug
      if (slug !== undefined) {
        void addAppQuickSlot(db, queryClient, slug, resourceJumpsData)
      }
    },
    [currentEnv?.slug, db, queryClient, resourceJumpsData],
  )


  const currentResourceJump = useMemo<ResourceJumpUI | undefined>(() => {
    const found: ResourceJumpUI|undefined = resourceJumps.find(
      (item) => item.slug === currentResourceJumpSlug,
    )
    if (found === undefined) {
      return undefined
    }

    return found
  }, [currentResourceJumpSlug, resourceJumps])

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

  // Auto-select last used resource jump when visiting environment without resource jump
  // DISABLED FOR NOW - requires more sophisticated logic to distinguish URL navigation from user selection
  // TODO: Re-enable when we can detect initial page load vs user interaction
  // useEffect(() => {
  //   // Skip if we're still loading or if resource jump is already in URL
  //   if (isLoadingResourceJumps || resourceJumpLoader.resourceSlug !== undefined) {
  //     return
  //   }

  //   // Only run when we have an environment from URL (not user selection) but no resource jump
  //   if (resourceJumpLoader.envSlug && !currentResourceJumpSlug && history.length > 0) {
  //     // Find the most recent history entry for this environment
  //     const recentForEnv = history
  //       .filter((item) => item.envSlug === resourceJumpLoader.envSlug)
  //       .sort((a, b) => b.timestamp - a.timestamp)[0]

  //     if (recentForEnv) {
  //       setCurrentResourceJumpSlug(recentForEnv.resourceSlug)
  //     }
  //   }
  // }, [
  //   isLoadingResourceJumps,
  //   resourceJumpLoader.envSlug,
  //   resourceJumpLoader.resourceSlug,
  //   currentResourceJumpSlug,
  //   history,
  // ])

  useEffect(() => {
    if (isLoadingResourceJumps) {
      return
    }
    const firstParam = currentLateResolvableParams[0]
    const localValue = allLateResolvableParamValues[firstParam?.slug || ''] ?? ''

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

  const getJumpUrl = useCallback(
    (
      jumpResourceSlug: JumpResourceSlug | undefined,
      envSlug: EnvSlug | undefined,
    ) => {
      return buildJumpUrl(
        jumpResourceSlug,
        envSlug,
        resourceJumpsData,
        allLateResolvableParamValues,
      )
    },
    [resourceJumpsData, allLateResolvableParamValues],
  )

  // On environment change, insert into quick env slots if room and not duplicate
  useEffect(() => {
    const slug = currentEnv?.slug
    if (!slug) {
      return
    }
    void addEnvQuickSlot(db, queryClient, slug)
  }, [currentEnv?.slug, db, queryClient])

  const getHistoryCallback = useCallback(() => history, [history])

  const currentFlagship = useMemo(() => {
    if (!currentResourceJump) {
      return undefined;
    }
    return flagshipJumpResources.find(fr => fr.resourceJumps.some(rj => rj.slug === currentResourceJump.slug));
  }, [currentResourceJump, flagshipJumpResources]);

  const setCurrentFlagship = useCallback(
    (slug: string | undefined) => {
      const flagship = flagshipJumpResources.find(rj => rj.slug === slug);
      setCurrentResourceJumpSlug(flagship?.resourceJumps[0]?.slug);
    },
    [flagshipJumpResources],
  )

  const value: ResourceJumpContextIface = useMemo(
    () => ({
      currentResourceJump,
      setCurrentResourceJumpSlug: setCurrentResourceJumpSlugWithHistory,
      isLoadingResourceJumps,
      getJumpUrl,
      initialResourceSlug: resourceJumpLoader.resourceSlug,
      getHistory: getHistoryCallback,
      currentLateResolvableParams,
      currentLateResolvableParamsValue,
      setLateResolvableParamValue,
      setLateResolvableParamValues,
      quickEnvSlots,
      quickAppSlots,
      flagshipJumpResources,
      currentFlagship,
      setCurrentFlagship,
    }),
    [
      currentResourceJump,
      setCurrentResourceJumpSlugWithHistory,
      flagshipJumpResources,
      currentFlagship,
      isLoadingResourceJumps,
      getJumpUrl,
      resourceJumpLoader.resourceSlug,
      getHistoryCallback,
      currentLateResolvableParams,
      currentLateResolvableParamsValue,
      setLateResolvableParamValue,
      setLateResolvableParamValues,
      quickEnvSlots,
      quickAppSlots,
      setCurrentFlagship
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


