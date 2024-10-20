import { useEhContext } from '../context/EhContext';
import { useState } from 'react';
import { ComboBoxType } from '../types';

export function useAutoFocusHelper(): ComboBoxType {
  const { env, app, substitution, substitutionType } = useEhContext();

  const [ret] = useState<ComboBoxType>(() => {
    if (env === undefined) {
      return 'environments';
    }
    if (app === undefined) {
      return 'applications';
    }
    if (substitutionType !== undefined && substitution === undefined) {
      return 'substitutions';
    }
    return 'environments';
  });

  return ret;
}
