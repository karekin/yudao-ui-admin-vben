import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace CloudMoldEngagementApi {
  export interface Campaign {
    aggregateVersion: number;
    campaignCode: string;
    campaignId: string;
    campaignName: string;
    channel: string;
    createdAt: string;
    sourceId: string;
    sourceSystem: string;
    sourceType: string;
    status: string;
    updatedAt: string;
  }

  export interface CampaignPageParams extends PageParam {
    campaignCode?: string;
    campaignId?: string;
    campaignName?: string;
    channel?: string;
    createdAtFrom?: string;
    createdAtTo?: string;
    status?: string;
  }
}

export function getCloudMoldEngagementCampaignPage(
  params: CloudMoldEngagementApi.CampaignPageParams,
) {
  return requestClient.get<PageResult<CloudMoldEngagementApi.Campaign>>(
    '/cloudmold/engagement/notifications/campaigns/page',
    { params },
  );
}
