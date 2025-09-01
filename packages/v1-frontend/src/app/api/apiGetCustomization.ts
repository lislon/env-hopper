import { EhCustomization } from '@env-hopper/types';

export async function apiGetCustomization(): Promise<EhCustomization> {
  return fetch(`/api/customization`).then(async (res) => {
    if (res.ok) {
      return res.json();
    }
    throw new Error('Failed to load config from server ' + res.statusText);
  });
}
