import type { EnvBaseInfo } from '@env-hopper/backend-core'
import { AppWindow, ExternalLinkIcon, HomeIcon } from 'lucide-react'
import { alphabetical, debounce } from 'radashi'
import { useMemo, useRef } from 'react'
import { Input } from '~/components/ui/input'
import { useCrossCuttingParamsContext } from '~/modules/crossCuttingParams/CrossCuttingParamsContext'
import { CROSS_CUTTING_SINGLE_SLUG } from '~/modules/crossCuttingParams/types'
import { useEnvironmentContext } from '~/modules/environment/context/EnvironmentContext'
import { useResourceJumpContext } from '~/modules/resourceJump/context/ResourceJumpContext'
import type { ResourceJumpUI } from '~/modules/resourceJump/types'
import { AppPageFlagship } from '~/modules/resourceJump/ui/pages/AppPageFlagship'
import { AppPageRegular } from '~/modules/resourceJump/ui/pages/AppPageRegular'

function isFlagshipPage(currentResourceJump: ResourceJumpUI | undefined) {
  return currentResourceJump?.slug === currentResourceJump?.flagship?.resourceJumps[0]?.slug;
}

export function AppPage() {
  const { currentResourceJump} = useResourceJumpContext()

  if (isFlagshipPage(currentResourceJump)) {
    return <AppPageFlagship />
  } else {
    return <AppPageRegular />
  }
}