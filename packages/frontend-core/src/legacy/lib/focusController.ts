import { useCallback, useEffect, useMemo, useState } from 'react'
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

/**
 * Lets a field hand this hook a way to focus itself, so choosing an application
 * can put the caret in the value field.
 *
 * INTENTIONAL DIFF, and the two halves only work together:
 *
 *  - Each controller is now memoized. It used to be a fresh object literal every
 *    render, so any field that listed its controller as a dependency re-registered
 *    on every render, and registering is a state update — an unbounded render loop.
 *    The original got away with it only because the field registered from an
 *    effect with an empty dependency list, which the lint rules here reject.
 *  - The focusing effect now lists everything it reads. It was keyed on
 *    `[app, env]` while also reading `substitutionType` and the registered
 *    function, so it fired before the value field had mounted and registered —
 *    and then never again. The caret was simply lost the first time an
 *    application needing a value came into view.
 */
export function useFocusController({
  app,
  env,
  substitutionType,
}: FocusControllerProps): FocusControllerEh {
  const [, setFocusEnv] = useState<FocusFn | undefined>()
  const [, setFocusApp] = useState<FocusFn | undefined>()
  const [focusSub, setFocusSub] = useState<FocusFn | undefined>()

  useEffect(() => {
    if (
      app !== undefined &&
      env !== undefined &&
      substitutionType !== undefined
    ) {
      focusSub?.()
    }
  }, [app, env, focusSub, substitutionType])

  const setupEnv = useCallback((focusFn: FocusFn) => {
    setFocusEnv(() => focusFn)
  }, [])
  const setupApp = useCallback((focusFn: FocusFn) => {
    setFocusApp(() => focusFn)
  }, [])
  const setupSub = useCallback((focusFn: FocusFn) => {
    setFocusSub(() => focusFn)
  }, [])

  return {
    focusControllerEnv: useMemo(() => ({ setupFocusFn: setupEnv }), [setupEnv]),
    focusControllerApp: useMemo(() => ({ setupFocusFn: setupApp }), [setupApp]),
    focusControllerSub: useMemo(() => ({ setupFocusFn: setupSub }), [setupSub]),
  }
}
