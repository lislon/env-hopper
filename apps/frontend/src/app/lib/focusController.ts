import { useCallback, useEffect, useState } from 'react';
import { EhApp, EhEnv, EhSubstitutionType } from '@env-hopper/types';

export interface FocusControllerEh {
  focusControllerEnv: FocusController;
  focusControllerApp: FocusController;
  focusControllerSub: FocusController;
}

type FocusFn = () => void;

export interface FocusController {
  setupFocusFn(focus: FocusFn): void;
}

export interface FocusControllerProps {
  app: EhApp | undefined;
  env: EhEnv | undefined;
  substitutionType: EhSubstitutionType | undefined;
}

export function useFocusController({
  app,
  env,
  substitutionType,
}: FocusControllerProps): FocusControllerEh {
  const [, setFocusEnv] = useState<FocusFn | undefined>();
  const [, setFocusApp] = useState<FocusFn | undefined>();
  const [focusSub, setFocusSub] = useState<FocusFn | undefined>();

  useEffect(() => {
    if (
      app !== undefined &&
      env !== undefined &&
      substitutionType !== undefined
    ) {
      focusSub?.();
    }
  }, [app, env]);

  return {
    focusControllerEnv: {
      setupFocusFn: useCallback((focusFn) => {
        setFocusEnv(() => focusFn);
      }, []),
    },
    focusControllerApp: {
      setupFocusFn: useCallback((focusFn) => {
        setFocusApp(() => focusFn);
      }, []),
    },
    focusControllerSub: {
      setupFocusFn: useCallback((focusFn) => {
        setFocusSub(() => focusFn);
      }, []),
    },
  };
}
