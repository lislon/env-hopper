import { EhStatJump } from '@env-hopper/types';
import { EH_COMMON_STATIC_HEADERS, ehCommonDynamicHeaders } from './apiCommon';

export async function apiPostStatsJump(jump: EhStatJump): Promise<void> {
  return fetch(`/api/stats/jump`, {
    method: 'POST',
    body: JSON.stringify(jump),
    headers: { ...EH_COMMON_STATIC_HEADERS, ...ehCommonDynamicHeaders() },
  }).then(async (res) => {
    if (res.ok) {
      return res.json();
    }
  });
}
