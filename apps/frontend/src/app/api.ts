import { EhClientConfig } from '@env-hopper/types';

export async function getConfig(): Promise<EhClientConfig> {
  const response = await fetch(`/api/config`);
  return response.json();
}
