import { EhStatJump } from '@env-hopper/types';
import { ehCommonDynamicHeaders } from './apiCommon';

export async function apiPostStatsJump(jump: EhStatJump): Promise<void> {
  return fetch(`/api/stats/jump`, {
    method: 'POST',
    body: JSON.stringify(jump),
    headers: { ...ehCommonDynamicHeaders() },
  }).then(async (res) => {
    if (res.ok) {
      return res.json();
    }
  });
}
