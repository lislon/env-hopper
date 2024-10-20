import { queryOptions } from '@tanstack/react-query';
import { EhClientConfig, EhCustomization } from '@env-hopper/types';
import { apiGetConfig } from './apiGetConfig';
import { apiGetCustomization } from './apiGetCustomization';
import { minutes } from '../lib/utils';

export class ApiQueryMagazine {
  static getConfig() {
    return queryOptions<EhClientConfig, Error>({
      queryKey: ['config'],
      queryFn: apiGetConfig,
      staleTime: minutes(5),
    });
  }

  static getCustomization() {
    return queryOptions<EhCustomization, Error>({
      queryKey: ['customization'],
      queryFn: apiGetCustomization,
      staleTime: minutes(5),
    });
  }
}
