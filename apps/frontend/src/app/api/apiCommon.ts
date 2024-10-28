import { EH_HEADER_APP_VERSION, EH_HEADER_USER_ID } from '@env-hopper/types';
import { LOCAL_STORAGE_KEY_USER_ID } from '../context/EhContext';

export const EH_COMMON_STATIC_HEADERS = {
  [EH_HEADER_APP_VERSION]: import.meta.env.VITE_APP_VERSION,
};

export function ehCommonDynamicHeaders() {
  return {
    [EH_HEADER_USER_ID]: JSON.parse(
      localStorage.getItem(LOCAL_STORAGE_KEY_USER_ID) || '""',
    ),
    'Content-Type': 'application/json',
  };
}
