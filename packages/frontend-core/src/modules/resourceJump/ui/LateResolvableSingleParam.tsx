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


export function LateResolvableParamInput({
  paramSlug,
}: {
  paramSlug: string
}) {
  const { getParamDefBySlug, crossCuttingParams, setCrossCuttingParams } =
    useCrossCuttingParamsContext()

  const paramDef = getParamDefBySlug(paramSlug)

  const paramsObj = crossCuttingParams[paramSlug] || {
    stringValue: '',
    slug: CROSS_CUTTING_SINGLE_SLUG,
  }

  const paramsRef = useRef(crossCuttingParams)
  paramsRef.current = crossCuttingParams

  const debouncedUpdate = useMemo(
    () =>
      debounce({ delay: 100 }, (value: string) => {
        setCrossCuttingParams({
          ...paramsRef.current,
          [paramSlug]: { slug: paramSlug, stringValue: value },
        })
      }),
    [paramSlug, setCrossCuttingParams],
  )

  if (!paramSlug) {
    return null
  }

  return (
    <Input
      placeholder={paramDef?.displayName || 'undef ' + paramDef}
      className="w-fit"
      defaultValue={paramsObj.stringValue || ''}
      key={paramSlug}
      onChange={(v) => {
        debouncedUpdate(v.target.value)
      }}
    />
  )
}