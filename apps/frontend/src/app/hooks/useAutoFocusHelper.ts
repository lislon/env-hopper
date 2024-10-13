import { useEhContext } from '../context/EhContext';
import { useState } from 'react';
import { ComboBoxType } from '../types';

export type AutoFocusOn = ComboBoxType | 'substitution';

export function useAutoFocusHelper(): AutoFocusOn {
  const { env, app, substitution, substitutionType } = useEhContext();

  const [ret] = useState<AutoFocusOn>(() => {
    if (env === undefined) {
      return 'environments';
    }
    if (app === undefined) {
      return 'applications';
    }
    if (substitutionType !== undefined && substitution === undefined) {
      return 'substitution';
    }
    return 'environments';
  });

  return ret;
}
