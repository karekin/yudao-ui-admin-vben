import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace CloudMoldGamificationApi {
  export interface Account {
    accountId: string;
    aggregateVersion: number;
    assetClass: string;
    balanceMicrounits: number;
    createdAt: string;
    currencyCode: string;
    gameId: string;
    ownerRef: string;
    ownerType: string;
    status: string;
    updatedAt: string;
  }

  export interface AccountPageParams extends PageParam {
    accountId?: string;
    createdAtFrom?: string;
    createdAtTo?: string;
    currencyCode?: string;
    gameId?: string;
    ownerRef?: string;
    ownerType?: string;
    status?: string;
  }
}

export function getCloudMoldGamificationAccountPage(
  params: CloudMoldGamificationApi.AccountPageParams,
) {
  return requestClient.get<PageResult<CloudMoldGamificationApi.Account>>(
    '/cloudmold/gamification/account/page',
    { params },
  );
}
