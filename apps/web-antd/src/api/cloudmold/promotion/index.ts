import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

import { buildCommandEnvelope } from '../command-helpers';

/** 营销活动命令 operation（对齐后端 PromotionOperation 枚举） */
export const PromotionCampaignOperation = {
  ACTIVATE_CAMPAIGN: 'ACTIVATE_CAMPAIGN',
  CANCEL_CAMPAIGN: 'CANCEL_CAMPAIGN',
  COMPLETE_CAMPAIGN: 'COMPLETE_CAMPAIGN',
  CREATE_CAMPAIGN: 'CREATE_CAMPAIGN',
  PAUSE_CAMPAIGN: 'PAUSE_CAMPAIGN',
  UPDATE_CAMPAIGN: 'UPDATE_CAMPAIGN',
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
    campaign: CampaignDefinition;
    correlationId: string;
    idempotencyKey: string;
    occurredAt: string;
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

  export interface CampaignCreateInput {
    campaignCode: string;
    campaignKind: string;
    endsAt: string;
    name: string;
    startsAt: string;
  }

  export interface CampaignDefinition {
    campaignCode?: string;
    campaignId?: string;
    campaignKind?: string;
    endsAt?: string;
    expectedVersion?: number;
    name?: string;
    startsAt?: string;
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

  export interface CampaignUpdateInput {
    campaignId: string;
    campaignKind: string;
    endsAt: string;
    expectedVersion: number;
    name: string;
    startsAt: string;
  }
}

/** 激活活动：DRAFT/PAUSED → ACTIVE */
export function activateCampaign(campaignId: string, expectedVersion: number) {
  return sendPromotionCampaignCommand(
    buildPromotionCommand(PromotionCampaignOperation.ACTIVATE_CAMPAIGN, {
      campaignId,
      expectedVersion,
    }),
  );
}

/** 取消活动：DRAFT/ACTIVE/PAUSED → CANCELLED（不可恢复） */
export function cancelCampaign(campaignId: string, expectedVersion: number) {
  return sendPromotionCampaignCommand(
    buildPromotionCommand(PromotionCampaignOperation.CANCEL_CAMPAIGN, {
      campaignId,
      expectedVersion,
    }),
  );
}

/** 完成活动：ACTIVE/PAUSED → COMPLETED */
export function completeCampaign(campaignId: string, expectedVersion: number) {
  return sendPromotionCampaignCommand(
    buildPromotionCommand(PromotionCampaignOperation.COMPLETE_CAMPAIGN, {
      campaignId,
      expectedVersion,
    }),
  );
}

/** 新建活动：创建为 DRAFT（version=1，campaignId 由后端生成） */
export function createCampaign(
  input: CloudMoldPromotionApi.CampaignCreateInput,
) {
  return sendPromotionCampaignCommand(
    buildPromotionCommand(PromotionCampaignOperation.CREATE_CAMPAIGN, input),
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
    buildPromotionCommand(PromotionCampaignOperation.PAUSE_CAMPAIGN, {
      campaignId,
      expectedVersion,
    }),
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

/** 编辑活动：仅 DRAFT/PAUSED 可改 name/campaignKind/起止时间（campaignCode 业务键不可改，status 不变） */
export function updateCampaign(
  input: CloudMoldPromotionApi.CampaignUpdateInput,
) {
  return sendPromotionCampaignCommand(
    buildPromotionCommand(PromotionCampaignOperation.UPDATE_CAMPAIGN, {
      campaignId: input.campaignId,
      campaignKind: input.campaignKind,
      endsAt: input.endsAt,
      expectedVersion: input.expectedVersion,
      name: input.name,
      startsAt: input.startsAt,
    }),
  );
}

/** 组装命令：补全幂等键 + envelope（correlationId/occurredAt 后端 validateEnvelope 强制要求） */
function buildPromotionCommand(
  operation: (typeof PromotionCampaignOperation)[keyof typeof PromotionCampaignOperation],
  campaign: CloudMoldPromotionApi.CampaignDefinition,
): CloudMoldPromotionApi.CampaignCommandRequest {
  const { correlationId, idempotencyKey, occurredAt } = buildCommandEnvelope();
  return {
    campaign,
    correlationId,
    idempotencyKey,
    occurredAt,
    operation,
  };
}
