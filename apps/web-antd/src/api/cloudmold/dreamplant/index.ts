import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace CloudMoldDreamPlantApi {
  export interface Exploration {
    aggregateVersion: number;
    completedAt: string;
    createdAt: string;
    explorationRunId: string;
    intent: string;
    mapKey: string;
    requestedByPrincipalId: string;
    startedAt: string;
    status: string;
    updatedAt: string;
  }

  export interface ExplorationPageParams extends PageParam {
    createdAtFrom?: string;
    createdAtTo?: string;
    explorationRunId?: string;
    mapKey?: string;
    requestedByPrincipalId?: string;
    status?: string;
  }
}

export function getCloudMoldDreamPlantExplorationPage(
  params: CloudMoldDreamPlantApi.ExplorationPageParams,
) {
  return requestClient.get<PageResult<CloudMoldDreamPlantApi.Exploration>>(
    '/cloudmold/dreamplant/explorations/page',
    { params },
  );
}
