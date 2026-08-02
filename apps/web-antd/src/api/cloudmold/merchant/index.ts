import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

/**
 * CloudMold 规范商家 / 店铺只读查询 API。
 * 仅读取 cloudmold_merchant_account / cloudmold_merchant_shop 权威表。
 */
export namespace CloudMoldMerchantApi {
  export interface Merchant {
    legalEntityId: string;
    legalName?: string;
    merchantCode: string;
    merchantId: string;
    status: string;
    updatedAt: string;
    version: number;
  }

  export interface Shop {
    channelCode: string;
    externalShopId?: string;
    merchantCode?: string;
    merchantId: string;
    shopId: string;
    status: string;
    updatedAt: string;
    version: number;
  }

  export interface MerchantPageParams extends PageParam {
    legalName?: string;
    merchantCode?: string;
    status?: string;
  }

  export interface ShopPageParams extends PageParam {
    channelCode?: string;
    merchantId?: string;
    status?: string;
  }

  export interface ManagedAdmissionArtifact {
    id: string;
    label: string;
    status: string;
    type: string;
    version?: number;
  }

  /** 托管商家准入、验厂及成长评审的只读业务事实。 */
  export interface ManagedAdmissionWorkflow {
    actionRequired: boolean;
    aggregateVersion: number;
    artifacts: ManagedAdmissionArtifact[];
    blockers: string[];
    buyerAssignmentStatus?: string;
    buyerPrincipalId?: string;
    buyerTlPrincipalId?: string;
    exitDecisionStatus?: string;
    exitReasonType?: string;
    gradeCode?: string;
    gradeDecisionStatus?: string;
    invitationStatus?: string;
    nextActions: string[];
    phase: string;
    probationAssessmentStatus?: string;
    scorecardMonth?: string;
    scorecardStatus?: string;
    status: 'FAILED' | 'PREPARE' | 'RUNNING' | 'SUCCEEDED' | 'WAITING';
    summary: string;
    terminal: boolean;
  }
}

export function getCloudMoldMerchantPage(
  params: CloudMoldMerchantApi.MerchantPageParams,
) {
  return requestClient.get<PageResult<CloudMoldMerchantApi.Merchant>>(
    '/cloudmold/merchant/merchants/page',
    { params },
  );
}

export function getCloudMoldMerchantShopPage(
  params: CloudMoldMerchantApi.ShopPageParams,
) {
  return requestClient.get<PageResult<CloudMoldMerchantApi.Shop>>(
    '/cloudmold/merchant/shops/page',
    { params },
  );
}

export function getCloudMoldManagedAdmissionWorkflowByMerchant(
  merchantId: string,
) {
  return requestClient.get<CloudMoldMerchantApi.ManagedAdmissionWorkflow>(
    '/cloudmold/merchant/managed-admission/workflow-by-merchant',
    { params: { merchantId } },
  );
}
