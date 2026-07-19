import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace CloudMoldCommerceBehaviorApi {
  export interface BehaviorEvent {
    behaviorId: string;
    behaviorType: string;
    canonicalSpuId?: string;
    channelCode?: string;
    checkoutToken?: string;
    createdAt: string;
    listingId?: string;
    merchantId?: string;
    occurredAt: string;
    principalId?: string;
    quantity?: number;
    sessionId: string;
    shopId?: string;
    sourceId: string;
    sourceSystem: string;
    sourceType: string;
  }

  export interface BehaviorEventPageParams extends PageParam {
    behaviorId?: string;
    behaviorType?: string;
    canonicalSpuId?: string;
    channelCode?: string;
    merchantId?: string;
    occurredAtFrom?: string;
    occurredAtTo?: string;
    principalId?: string;
    sessionId?: string;
    shopId?: string;
  }
}

export function getCloudMoldCommerceBehaviorEventPage(
  params: CloudMoldCommerceBehaviorApi.BehaviorEventPageParams,
) {
  return requestClient.get<
    PageResult<CloudMoldCommerceBehaviorApi.BehaviorEvent>
  >('/cloudmold/commerce-behavior/event/page', { params });
}
