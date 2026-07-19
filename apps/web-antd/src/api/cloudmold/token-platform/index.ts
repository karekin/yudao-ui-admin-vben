import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace CloudMoldTokenPlatformApi {
  export interface Account {
    accountId: string;
    aggregateVersion: number;
    balanceMicrounits: number;
    createdAt: string;
    principalId: string;
    status: string;
    updatedAt: string;
  }

  export interface AccountPageParams extends PageParam {
    accountId?: string;
    createdAtFrom?: string;
    createdAtTo?: string;
    principalId?: string;
    status?: string;
  }
}

export function getCloudMoldTokenPlatformAccountPage(
  params: CloudMoldTokenPlatformApi.AccountPageParams,
) {
  return requestClient.get<PageResult<CloudMoldTokenPlatformApi.Account>>(
    '/cloudmold/token-platform/page',
    { params },
  );
}
