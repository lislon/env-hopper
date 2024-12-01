import { EhClientConfig } from '@env-hopper/types';
import { ehCommonDynamicHeaders } from './apiCommon';

export async function apiGetConfig(): Promise<EhClientConfig> {
  const url = `${import.meta.env.VITE_API_BASE_URL}api/config`;
  return fetch(url, {
    headers: ehCommonDynamicHeaders(),
  }).then(async (res) => {
    if (res.ok) {
      return res.json();
    }
    throw new Error('Failed to load config from server ' + res.statusText);
  });
}
