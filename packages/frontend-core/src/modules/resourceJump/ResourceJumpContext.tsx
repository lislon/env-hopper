import { useNavigate } from '@tanstack/react-router'
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useEnvironmentContext } from '../environment/EnvironmentContext'
import { usePluginManager } from '../pluginCore/PluginManagerContext'
import { buildJumpUrl } from './buildJumpUrl'
import type { EhUrlParams } from '~/types/ehTypes'
import type { ReactNode } from 'react'
import type { EnvSlug, JumpResourceSlug } from '@env-hopper/backend-core'
import type { ResourceJumpItem, ResourceJumpLoaderReturn } from './types'
import { getEhToOptions } from '~/util/route-utils'
import { useBootstrapConfig } from '~/modules/config/BootstrapConfigContext'

export interface ResourceJumpContextIface {
  setCurrentResourceJumpSlug: (slug: JumpResourceSlug | undefined) => void
  currentResourceJump: ResourceJumpItem | undefined
  jumpResources: Array<ResourceJumpItem>
  getJumpUrl: (
    jumpResourceSlug: JumpResourceSlug | undefined,
    envSlug: EnvSlug | undefined,
  ) => string
}

export const ResourceJumpContext = createContext<ResourceJumpContextIface | undefined>(
  undefined,
)

interface ResourceJumpProviderProps {
  children: ReactNode
  initialJumpLinkSlug?: string
  resourceJumpLoader: ResourceJumpLoaderReturn
}

export function ResourceJumpProvider({
  children,
  resourceJumpLoader,
}: ResourceJumpProviderProps) {
  const { autocompleteFactoryItems } = usePluginManager()
  const indexData = useBootstrapConfig()
  const { currentEnv } = useEnvironmentContext()
  const navigate = useNavigate()
  const [currentResourceJumpSlug, setCurrentResourceJumpSlug] = useState<
    string | undefined
  >(resourceJumpLoader.resourceSlug)

  const [jumpResources, setJumpResources] = useState<Array<ResourceJumpItem>>(
    () =>
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
    // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
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
  }, [
    currentResourceJump,
    currentEnv,
    resourceJumpLoader,
    fixUrlBasedOnSelection,
  ])

  const getJumpUrl = useCallback(
    (
      jumpResourceSlug: JumpResourceSlug | undefined,
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

  const value: ResourceJumpContextIface = useMemo(
    () => ({
      currentResourceJump,
      setCurrentResourceJumpSlug,
      jumpResources,
      getJumpUrl,
    }),
    [currentResourceJump, jumpResources, getJumpUrl],
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
