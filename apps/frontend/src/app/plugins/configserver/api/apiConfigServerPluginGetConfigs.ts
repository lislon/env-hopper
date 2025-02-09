import { ConfigServerPluginQueryParams } from '@env-hopper/types';


export async function apiConfigServerPluginGetConfigs(params: ConfigServerPluginQueryParams): Promise<string> {
  const searchParams = new URLSearchParams({
    ...params,
  });

  return fetch(`/api/plugins/configserver/config?${searchParams}`).then(async (res) => {
    if (res.ok) {
      return res.text();
    }
    throw new Error('Failed to load config from server ' + res.statusText);
  });
}
