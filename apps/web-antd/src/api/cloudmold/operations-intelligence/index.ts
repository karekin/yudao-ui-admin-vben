import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace CloudMoldOperationsIntelligenceApi {
  export interface Alert {
    aggregateVersion: number;
    alertCode: string;
    alertId: string;
    category: string;
    createdAt: string;
    currentActorPrincipalId: string;
    openedAt: string;
    severity: string;
    sourceRef: string;
    sourceType: string;
    status: string;
    subcategory: string;
    terminalAt?: string;
    updatedAt: string;
  }

  export interface AlertPageParams extends PageParam {
    alertCode?: string;
    alertId?: string;
    category?: string;
    createdAtFrom?: string;
    createdAtTo?: string;
    currentActorPrincipalId?: string;
    severity?: string;
    sourceType?: string;
    status?: string;
  }
}

export function getCloudMoldOperationsAlertPage(
  params: CloudMoldOperationsIntelligenceApi.AlertPageParams,
) {
  return requestClient.get<
    PageResult<CloudMoldOperationsIntelligenceApi.Alert>
  >('/cloudmold/operations-intelligence/alert/page', { params });
}
