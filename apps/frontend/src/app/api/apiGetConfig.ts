import { EhClientConfig } from '@env-hopper/types';

export async function apiGetConfig(): Promise<EhClientConfig> {
  return fetch(`/api/config`).then(async (res) => {
    if (res.ok) {
      return res.json();
    }
    throw new Error('Failed to load config from server ' + res.statusText);
  });
}
