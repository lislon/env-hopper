import { ConfigServerPluginQueryParams } from '@env-hopper/types';


export async function apiConfigServerPluginGetLabels(params: ConfigServerPluginQueryParams): Promise<string[]> {
  const searchParams = new URLSearchParams({
    ...params,
  });

  return fetch(`/api/plugins/configserver/labels?${searchParams}`).then(async (res) => {
    if (res.ok) {
      return res.json();
    }
    throw new Error('Failed to load config from server ' + res.statusText);
  });
}
