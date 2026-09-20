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

  // A stable name is what lets the browser recognise the field across visits
  // and offer the values this user typed before. Off unless the param asks for
  // it — otherwise the browser would remember single-use or sensitive values.
  const autoComplete = paramDef?.isBrowserAutocomplete ? 'on' : 'off'

  return (
    <Input
      placeholder={paramDef?.displayName || 'undef ' + paramDef}
      className="w-fit"
      name={`eh-param-${paramSlug}`}
      autoComplete={autoComplete}
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
