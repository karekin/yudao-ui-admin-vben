import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

import { buildCommandEnvelope } from '../command-helpers';

/** 通知活动来源三元组（create 用；transition 从 row 回填，保证 immutable 一致） */
const DEFAULT_CAMPAIGN_SOURCE = {
  sourceId: 'cloudmold-web-admin',
  sourceSystem: 'cloudmold-web-admin',
  sourceType: 'manual-ui',
};

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

  export interface CampaignCreateInput {
    campaignCode: string;
    campaignName: string;
    channel: string;
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

  export interface CampaignSaveCommandRequest {
    campaignCode: string;
    campaignId: string;
    campaignName: string;
    channel: string;
    correlationId: string;
    desiredStatus: string;
    expectedVersion?: number;
    idempotencyKey: string;
    occurredAt: string;
    runId: string;
    sourceId: string;
    sourceSystem: string;
    sourceType: string;
  }

  export interface EngagementCommandResult {
    aggregateId: string;
    aggregateType: string;
    aggregateVersion: number;
    duplicate: boolean;
    operationId: number;
    status: string;
  }
}

/** 激活通知活动：DRAFT/PAUSED → ACTIVE（immutable 字段从 row 回填） */
export function activateNotificationCampaign(
  row: CloudMoldEngagementApi.Campaign,
) {
  return saveNotificationCampaign(
    buildEngagementCampaignSaveCommand({
      campaignCode: row.campaignCode,
      campaignId: row.campaignId,
      campaignName: row.campaignName,
      channel: row.channel,
      desiredStatus: 'ACTIVE',
      expectedVersion: row.aggregateVersion,
      sourceId: row.sourceId,
      sourceSystem: row.sourceSystem,
      sourceType: row.sourceType,
    }),
  );
}

/** 完成通知活动：ACTIVE/PAUSED → COMPLETED */
export function completeNotificationCampaign(
  row: CloudMoldEngagementApi.Campaign,
) {
  return saveNotificationCampaign(
    buildEngagementCampaignSaveCommand({
      campaignCode: row.campaignCode,
      campaignId: row.campaignId,
      campaignName: row.campaignName,
      channel: row.channel,
      desiredStatus: 'COMPLETED',
      expectedVersion: row.aggregateVersion,
      sourceId: row.sourceId,
      sourceSystem: row.sourceSystem,
      sourceType: row.sourceType,
    }),
  );
}

/** 新建通知活动：创建为 DRAFT（campaignId 前端生成，source 用默认三元组） */
export function createNotificationCampaign(
  input: CloudMoldEngagementApi.CampaignCreateInput,
) {
  return saveNotificationCampaign(
    buildEngagementCampaignSaveCommand({
      ...DEFAULT_CAMPAIGN_SOURCE,
      campaignCode: input.campaignCode,
      campaignId: crypto.randomUUID(),
      campaignName: input.campaignName,
      channel: input.channel,
      desiredStatus: 'DRAFT',
    }),
  );
}

export function getCloudMoldEngagementCampaignPage(
  params: CloudMoldEngagementApi.CampaignPageParams,
) {
  return requestClient.get<PageResult<CloudMoldEngagementApi.Campaign>>(
    '/cloudmold/engagement/notifications/campaigns/page',
    { params },
  );
}

/** 暂停通知活动：ACTIVE → PAUSED */
export function pauseNotificationCampaign(
  row: CloudMoldEngagementApi.Campaign,
) {
  return saveNotificationCampaign(
    buildEngagementCampaignSaveCommand({
      campaignCode: row.campaignCode,
      campaignId: row.campaignId,
      campaignName: row.campaignName,
      channel: row.channel,
      desiredStatus: 'PAUSED',
      expectedVersion: row.aggregateVersion,
      sourceId: row.sourceId,
      sourceSystem: row.sourceSystem,
      sourceType: row.sourceType,
    }),
  );
}

/** 统一保存入口：POST /cloudmold/engagement/notifications/campaigns/save */
export function saveNotificationCampaign(
  params: CloudMoldEngagementApi.CampaignSaveCommandRequest,
) {
  return requestClient.post<CloudMoldEngagementApi.EngagementCommandResult>(
    '/cloudmold/engagement/notifications/campaigns/save',
    params,
  );
}

/** 组装保存命令：扁平字段 + envelope（含 engagement 独有 runId） */
function buildEngagementCampaignSaveCommand(
  fields: Omit<
    CloudMoldEngagementApi.CampaignSaveCommandRequest,
    'correlationId' | 'idempotencyKey' | 'occurredAt' | 'runId'
  >,
): CloudMoldEngagementApi.CampaignSaveCommandRequest {
  const { correlationId, idempotencyKey, occurredAt } = buildCommandEnvelope();
  return {
    ...fields,
    correlationId,
    idempotencyKey,
    occurredAt,
    runId: crypto.randomUUID(),
  };
}
