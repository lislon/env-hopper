import { EhBackendVersionsRequestParams, EhBackendVersionsReturn, EhBackendIndexDataReturn } from './returns';


export interface EhBackendCompanySpecificBackend {
  getIndexData: () => Promise<EhBackendIndexDataReturn>;
  getDeployments: (params: EhBackendVersionsRequestParams) => Promise<EhBackendVersionsReturn>;
}
