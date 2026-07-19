import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

/** 营销活动状态转换命令 operation（对齐后端 PromotionOperation 枚举） */
export const PromotionCampaignOperation = {
  ACTIVATE_CAMPAIGN: 'ACTIVATE_CAMPAIGN',
  CANCEL_CAMPAIGN: 'CANCEL_CAMPAIGN',
  COMPLETE_CAMPAIGN: 'COMPLETE_CAMPAIGN',
  PAUSE_CAMPAIGN: 'PAUSE_CAMPAIGN',
} as const;

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

  export interface CampaignCommandRequest {
    campaign: CampaignTransitionTarget;
    idempotencyKey: string;
    operation: string;
  }

  export interface CampaignCommandResult {
    aggregateId: string;
    aggregateType: string;
    aggregateVersion: number;
    duplicate: boolean;
    operationId: number;
    status: string;
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

  export interface CampaignTransitionTarget {
    campaignId: string;
    expectedVersion: number;
  }
}

/** 激活活动：DRAFT/PAUSED → ACTIVE */
export function activateCampaign(campaignId: string, expectedVersion: number) {
  return sendPromotionCampaignCommand(
    buildCampaignTransition(
      PromotionCampaignOperation.ACTIVATE_CAMPAIGN,
      campaignId,
      expectedVersion,
    ),
  );
}

/** 取消活动：DRAFT/ACTIVE/PAUSED → CANCELLED（不可恢复） */
export function cancelCampaign(campaignId: string, expectedVersion: number) {
  return sendPromotionCampaignCommand(
    buildCampaignTransition(
      PromotionCampaignOperation.CANCEL_CAMPAIGN,
      campaignId,
      expectedVersion,
    ),
  );
}

/** 完成活动：ACTIVE/PAUSED → COMPLETED */
export function completeCampaign(campaignId: string, expectedVersion: number) {
  return sendPromotionCampaignCommand(
    buildCampaignTransition(
      PromotionCampaignOperation.COMPLETE_CAMPAIGN,
      campaignId,
      expectedVersion,
    ),
  );
}

export function getCloudMoldPromotionCampaignPage(
  params: CloudMoldPromotionApi.CampaignPageParams,
) {
  return requestClient.get<PageResult<CloudMoldPromotionApi.Campaign>>(
    '/cloudmold/promotion/campaign/page',
    { params },
  );
}

/** 暂停活动：ACTIVE → PAUSED */
export function pauseCampaign(campaignId: string, expectedVersion: number) {
  return sendPromotionCampaignCommand(
    buildCampaignTransition(
      PromotionCampaignOperation.PAUSE_CAMPAIGN,
      campaignId,
      expectedVersion,
    ),
  );
}

/** 统一命令入口：POST /cloudmold/promotion/command */
export function sendPromotionCampaignCommand(
  params: CloudMoldPromotionApi.CampaignCommandRequest,
) {
  return requestClient.post<CloudMoldPromotionApi.CampaignCommandResult>(
    '/cloudmold/promotion/command',
    params,
  );
}

/** 组装状态转换命令：每次生成新幂等键，回传乐观版本号 */
function buildCampaignTransition(
  operation: (typeof PromotionCampaignOperation)[keyof typeof PromotionCampaignOperation],
  campaignId: string,
  expectedVersion: number,
): CloudMoldPromotionApi.CampaignCommandRequest {
  return {
    campaign: { campaignId, expectedVersion },
    idempotencyKey: crypto.randomUUID(),
    operation,
  };
}
