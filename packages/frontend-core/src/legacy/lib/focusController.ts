import { useCallback, useEffect, useState } from 'react'
import type { EhApp, EhEnv, EhSubstitutionType } from '../types'

export interface FocusControllerEh {
  focusControllerEnv: FocusController
  focusControllerApp: FocusController
  focusControllerSub: FocusController
}

type FocusFn = () => void

export interface FocusController {
  setupFocusFn: (focus: FocusFn) => void
}

export interface FocusControllerProps {
  app: EhApp | undefined
  env: EhEnv | undefined
  substitutionType: EhSubstitutionType | undefined
}

export function useFocusController({
  app,
  env,
  substitutionType,
}: FocusControllerProps): FocusControllerEh {
  const [, setFocusEnv] = useState<FocusFn | undefined>()
  const [, setFocusApp] = useState<FocusFn | undefined>()
  const [focusSub, setFocusSub] = useState<FocusFn | undefined>()

  /*
   * INTENTIONAL DIFF: the dependency list was `[app, env]` while the body also
   * reads `substitutionType` and `focusSub`. That made the caret land in the
   * value field only if the field had already registered itself — and it
   * registers on ITS mount, which happens after this effect has run, so the
   * first time an app with a value came into view the focus was simply lost.
   * Listing what the effect reads makes it fire once the field is there.
   */
  useEffect(() => {
    if (
      app !== undefined &&
      env !== undefined &&
      substitutionType !== undefined
    ) {
      focusSub?.()
    }
  }, [app, env, focusSub, substitutionType])

  return {
    focusControllerEnv: {
      setupFocusFn: useCallback((focusFn) => {
        setFocusEnv(() => focusFn)
      }, []),
    },
    focusControllerApp: {
      setupFocusFn: useCallback((focusFn) => {
        setFocusApp(() => focusFn)
      }, []),
    },
    focusControllerSub: {
      setupFocusFn: useCallback((focusFn) => {
        setFocusSub(() => focusFn)
      }, []),
    },
  }
}
