import { objectify } from 'radashi'
import { createContext, use, useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type {
  CrossCuttingParamDef,
  CrossCuttingParamValue,
} from '~/modules/crossCuttingParams/types'

export interface CrossCuttingParamsContext {
  setCrossCuttingParams: (
    params: Record<string, CrossCuttingParamValue>,
  ) => void
  crossCuttingParams: Record<string, CrossCuttingParamValue>
  setCrossCuttingParamsDefs: (param: Array<CrossCuttingParamDef>) => void
  getParamDefBySlug: (slug: string) => CrossCuttingParamDef | undefined
}

export const CrossCuttingParamsContext = createContext<
  CrossCuttingParamsContext | undefined
>(undefined)

interface CrossCuttingParamsProviderProps {
  children: ReactNode
  initialCrossCuttingParams?: Array<CrossCuttingParamValue>
}

export function CrossCuttingParamsProvider({
  children,
  initialCrossCuttingParams,
}: CrossCuttingParamsProviderProps) {
  const [crossCuttingParams, setCrossCuttingParams] = useState<
    Record<string, CrossCuttingParamValue>
  >(() =>
    initialCrossCuttingParams
      ? objectify(initialCrossCuttingParams, (k) => k.slug)
      : {},
  )

  const [crossCuttingParamDefs, setCrossCuttingParamsDefs] = useState<
    Array<CrossCuttingParamDef>
  >([])

  const getParamDefBySlug = useCallback(
    (slug: string): CrossCuttingParamDef | undefined => {
      return crossCuttingParamDefs.find((param) => param.slug === slug)
    },
    [crossCuttingParamDefs],
  )

  const value: CrossCuttingParamsContext = useMemo(
    () => ({
      setCrossCuttingParams,
      crossCuttingParams,
      setCrossCuttingParamsDefs,
      getParamDefBySlug,
    }),
    [crossCuttingParams, getParamDefBySlug],
  )

  return (
    <CrossCuttingParamsContext value={value}>
      {children}
    </CrossCuttingParamsContext>
  )
}

export function useCrossCuttingParamsContext(): CrossCuttingParamsContext {
  const context = use(CrossCuttingParamsContext)
  if (context === undefined) {
    throw new Error(
      'useCrossCuttingParamsContext must be used within a CrossCuttingParamsProvider',
    )
  }
  return context
}
