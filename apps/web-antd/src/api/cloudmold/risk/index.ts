import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

import { buildCommandEnvelope } from '../command-helpers';

/** 风控审核命令 operation（对齐后端 RiskOperation，本次覆盖流转三操作） */
export const RiskReviewOperation = {
  CLOSE_REVIEW: 'CLOSE_REVIEW',
  DECIDE_REVIEW: 'DECIDE_REVIEW',
  START_REVIEW: 'START_REVIEW',
} as const;

export namespace CloudMoldRiskApi {
  export interface ReviewCase {
    aggregateVersion: number;
    caseId: string;
    clusterId: string;
    createdAt: string;
    reviewerPrincipalId: string;
    status: string;
    updatedAt: string;
  }

  export interface ReviewCasePageParams extends PageParam {
    caseId?: string;
    clusterId?: string;
    createdAtFrom?: string;
    createdAtTo?: string;
    reviewerPrincipalId?: string;
    status?: string;
  }

  export interface ReviewCommandRequest {
    caseId?: string;
    decidedByPrincipalId?: string;
    decisionType?: string;
    expectedVersion?: number;
    idempotencyKey: string;
    occurredAt: string;
    operation: string;
    reasonCode?: string;
  }

  export interface ReviewCommandResult {
    caseId: string;
    caseVersion: number;
    decisionId?: string;
    duplicate: boolean;
    operationId: number;
    reviewStatus: string;
  }
}

/** 关闭审核：DECIDED → CLOSED */
export function closeReview(caseId: string, expectedVersion: number) {
  return sendRiskReviewCommand(RiskReviewOperation.CLOSE_REVIEW, {
    caseId,
    expectedVersion,
  });
}

/** 决策审核：IN_REVIEW → DECIDED（decidedByPrincipalId 必须为指派审核员） */
export function decideReview(
  caseId: string,
  expectedVersion: number,
  decidedByPrincipalId: string,
  decisionType: string,
  reasonCode: string,
) {
  return sendRiskReviewCommand(RiskReviewOperation.DECIDE_REVIEW, {
    caseId,
    decidedByPrincipalId,
    decisionType,
    expectedVersion,
    reasonCode,
  });
}

export function getCloudMoldRiskReviewPage(
  params: CloudMoldRiskApi.ReviewCasePageParams,
) {
  return requestClient.get<PageResult<CloudMoldRiskApi.ReviewCase>>(
    '/cloudmold/risk/review/page',
    { params },
  );
}

/** 开始审核：OPEN → IN_REVIEW */
export function startReview(caseId: string, expectedVersion: number) {
  return sendRiskReviewCommand(RiskReviewOperation.START_REVIEW, {
    caseId,
    expectedVersion,
  });
}

/** 统一命令入口：POST /cloudmold/risk/command（envelope 较宽松：仅 idempotencyKey 强制） */
export function sendRiskReviewCommand(
  operation: (typeof RiskReviewOperation)[keyof typeof RiskReviewOperation],
  fields: Omit<
    CloudMoldRiskApi.ReviewCommandRequest,
    'idempotencyKey' | 'occurredAt' | 'operation'
  >,
) {
  const { idempotencyKey, occurredAt } = buildCommandEnvelope();
  const params: CloudMoldRiskApi.ReviewCommandRequest = {
    ...fields,
    idempotencyKey,
    occurredAt,
    operation,
  };
  return requestClient.post<CloudMoldRiskApi.ReviewCommandResult>(
    '/cloudmold/risk/command',
    params,
  );
}
