import { EhClientConfig } from '@env-hopper/types';
import { EH_COMMON_STATIC_HEADERS, ehCommonDynamicHeaders } from './apiCommon';

export async function apiGetConfig(): Promise<EhClientConfig> {
  return fetch(`/api/config`, {
    headers: { ...EH_COMMON_STATIC_HEADERS, ...ehCommonDynamicHeaders() },
  }).then(async (res) => {
    if (res.ok) {
      return res.json();
    }
    throw new Error('Failed to load config from server ' + res.statusText);
  });
}