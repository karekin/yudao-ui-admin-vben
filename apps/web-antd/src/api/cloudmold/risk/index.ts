import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

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
}

export function getCloudMoldRiskReviewPage(
  params: CloudMoldRiskApi.ReviewCasePageParams,
) {
  return requestClient.get<PageResult<CloudMoldRiskApi.ReviewCase>>(
    '/cloudmold/risk/review/page',
    { params },
  );
}
