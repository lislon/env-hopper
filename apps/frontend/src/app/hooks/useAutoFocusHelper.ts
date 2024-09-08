import { useEhContext } from '../context/EhContext';
import { useState } from 'react';


export interface AutofocusHelperReturn {
  autoFocusEnv: boolean;
  autoFocusApp: boolean;
  autoFocusSubstitution: boolean;
}

export function useAutoFocusHelper(): AutofocusHelperReturn {
  const { env, app, substitution } = useEhContext();

  const [ret] = useState<AutofocusHelperReturn>({
    autoFocusEnv: env === undefined,
    autoFocusApp: env !== undefined && app === undefined,
    autoFocusSubstitution: env !== undefined && app !== undefined && substitution === undefined
  });

  return ret;
}
