import { debounce } from 'radashi'
import { useMemo, useRef } from 'react'
import { useCrossCuttingParamsContext } from '~/modules/crossCuttingParams/CrossCuttingParamsContext'
import { CROSS_CUTTING_SINGLE_SLUG } from '~/modules/crossCuttingParams/types'
import { useEnvironmentContext } from '~/modules/environment/context/EnvironmentContext'
import { Input } from '~/ui/input'

export function LateResolvableParamInput({ paramSlug }: { paramSlug: string }) {
  const { getParamDefBySlug, crossCuttingParams, setCrossCuttingParams } =
    useCrossCuttingParamsContext()
  const { currentEnv } = useEnvironmentContext()

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
      // The field is uncontrolled, so it has to remount to pick up a value
      // dropped because it was scoped to the environment we just left.
      key={`${paramSlug}:${currentEnv?.slug ?? ''}`}
      onChange={(v) => {
        debouncedUpdate(v.target.value)
      }}
    />
  )
}
