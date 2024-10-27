import { queryOptions } from '@tanstack/react-query';
import { EhClientConfig, EhCustomization } from '@env-hopper/types';
import { apiGetConfig } from './apiGetConfig';
import { apiGetCustomization } from './apiGetCustomization';

export class ApiQueryMagazine {
  static getConfig() {
    return queryOptions<EhClientConfig, Error>({
      queryKey: ['config'],
      queryFn: apiGetConfig,
      staleTime: 0,
    });
  }

  static getCustomization() {
    return queryOptions<EhCustomization, Error>({
      queryKey: ['customization'],
      queryFn: apiGetCustomization,
      staleTime: 0,
    });
  }
}
