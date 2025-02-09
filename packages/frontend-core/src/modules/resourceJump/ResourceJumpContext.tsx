import type { EnvSlug, JumpResouceSlug } from '@env-hopper/backend-core'
import { useNavigate } from '@tanstack/react-router'
import type {
  ReactNode
} from 'react'
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useBootstrapConfig } from '~/modules/config/BootstrapConfigContext'
import type { EhUrlParams } from '~/types/ehTypes'
import { getEhToOptions } from '~/util/route-utils'
import { useEnvironmentContext } from '../environment/EnvironmentContext'
import { usePluginManager } from '../pluginCore/PluginManagerContext'
import { buildJumpUrl } from './buildJumpUrl'
import type { ResourceJumpItem, ResourceJumpLoaderReturn } from './types'

export interface ResourceJumpContext {
  setCurrentResourceJumpSlug: (slug: JumpResouceSlug | undefined) => void
  currentResourceJump: ResourceJumpItem | undefined
  jumpResources: Array<ResourceJumpItem>
  getJumpUrl: (
    jumpResourceSlug: JumpResouceSlug | undefined,
    envSlug: EnvSlug | undefined,
  ) => string
}

const ResourceJumpContextInstance = createContext<
  ResourceJumpContext | undefined
>(undefined)

interface ResouceJumpProviderProps {
  children: ReactNode
  initialJumpLinkSlug?: string
  resourceJumpLoader: ResourceJumpLoaderReturn
}

export function ResourceJumpProvider({
  children,
  resourceJumpLoader,
}: ResouceJumpProviderProps) {
  const { autocompleteFactoryItems } = usePluginManager()
  const indexData = useBootstrapConfig()
  const { currentEnv } = useEnvironmentContext()
  const navigate = useNavigate()
  const [currentResourceJumpSlug, setCurrentResourceJumpSlug] = useState<
    string | undefined
  >(resourceJumpLoader.resourceSlug)

  const [jumpResources, setJumpResources] = useState<Array<ResourceJumpItem>>(
    autocompleteFactoryItems({
      bootstrapConfig: indexData,
    }),
  )

  // const [initialEnvAppSubBased] = useState(() => {
  //   return parseUrlParams({
  //     rawUrlParams: urlParams,
  //     config: {
  //       envs: indexData.envs,
  //       apps: indexData.apps,
  //     },
  //     lastUsedAppSlug: undefined,
  //     lastUsedEnvSlug: undefined,
  //   })
  // })

  const fixUrlBasedOnSelection = useCallback(
    async (state: EhUrlParams, replace = false) => {
      await navigate({
        ...getEhToOptions(state),
        replace,
      })
    },
    [navigate],
  )

  useEffect(() => {
    setJumpResources(autocompleteFactoryItems({ bootstrapConfig: indexData }))
  }, [indexData, autocompleteFactoryItems])

  const currentResourceJump = useMemo(() => {
    return jumpResources.find((item) => item.slug === currentResourceJumpSlug)
  }, [currentResourceJumpSlug, jumpResources])

  useEffect(() => {
    if (
      resourceJumpLoader.envSlug !== currentEnv?.slug ||
      resourceJumpLoader.resourceSlug !== currentResourceJump?.slug
    ) {
      void fixUrlBasedOnSelection(
        { envId: currentEnv?.slug, appId: currentResourceJump?.slug },
        true,
      )
    }
  }, [currentResourceJump, currentEnv, resourceJumpLoader])

  const getJumpUrl = useCallback(
    (
      jumpResourceSlug: JumpResouceSlug | undefined,
      envSlug: EnvSlug | undefined,
    ) => {
      return buildJumpUrl(
        jumpResourceSlug,
        envSlug,
        resourceJumpLoader.resourceJumps,
      )
    },
    [resourceJumpLoader],
  )

  const value: ResourceJumpContext = useMemo(
    () => ({
      currentResourceJump,
      setCurrentResourceJumpSlug,
      jumpResources,
      getJumpUrl,
    }),
    [currentResourceJump, setCurrentResourceJumpSlug, jumpResources],
  )

  return (
    <ResourceJumpContextInstance value={value}>
      {children}
    </ResourceJumpContextInstance>
  )
}

export function useResourceJumpContext(): ResourceJumpContext {
  const context = use(ResourceJumpContextInstance)
  if (context === undefined) {
    throw new Error(
      'useResourceJumpContext must be used within an ResourceJumpContext',
    )
  }
  return context
}
