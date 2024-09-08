import { queryOptions } from '@tanstack/react-query';
import { EhClientConfig, EhCustomization } from '@env-hopper/types';
import { apiGetConfig } from './apiGetConfig';
import { apiGetCustomization } from './apiGetCustomization';

export class ApiQueryMagazine {
  static getConfig() {
    return queryOptions<EhClientConfig, Error>({
      queryKey: ['config'],
      queryFn: apiGetConfig,
      staleTime: 1000 * 60 * 60 * 5,
    });
  }

  static getCustomization() {
    return queryOptions<EhCustomization, Error>({
      queryKey: ['customization'],
      queryFn: apiGetCustomization,
      staleTime: Infinity,
    });
  }
}
