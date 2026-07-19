import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace CloudMoldPromotionApi {
  export interface Campaign {
    aggregateVersion: number;
    campaignCode: string;
    campaignId: string;
    campaignKind: string;
    createdAt: string;
    endsAt: string;
    name: string;
    startsAt: string;
    status: string;
    updatedAt: string;
  }

  export interface CampaignPageParams extends PageParam {
    campaignCode?: string;
    campaignId?: string;
    campaignKind?: string;
    createdAtFrom?: string;
    createdAtTo?: string;
    name?: string;
    status?: string;
  }
}

export function getCloudMoldPromotionCampaignPage(
  params: CloudMoldPromotionApi.CampaignPageParams,
) {
  return requestClient.get<PageResult<CloudMoldPromotionApi.Campaign>>(
    '/cloudmold/promotion/campaign/page',
    { params },
  );
}
