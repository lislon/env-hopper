import { EH_HEADER_APP_VERSION, EH_HEADER_USER_ID } from '@env-hopper/types';
import {
  LOCAL_STORAGE_KEY_USER_ID,
  LOCAL_STORAGE_KEY_VERSION,
} from '../lib/local-storage-constants';

export function ehCommonDynamicHeaders() {
  return {
    [EH_HEADER_USER_ID]: JSON.parse(
      localStorage.getItem(LOCAL_STORAGE_KEY_USER_ID) || '""',
    ),
    [EH_HEADER_APP_VERSION]: JSON.parse(
      localStorage.getItem(LOCAL_STORAGE_KEY_VERSION) || '""',
    ),

    'Content-Type': 'application/json',
  };
}
