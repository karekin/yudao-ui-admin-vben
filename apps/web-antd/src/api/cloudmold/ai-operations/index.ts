import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace CloudMoldAiOperationsApi {
  export interface WorkflowRun {
    aggregateVersion: number;
    applicationId: string;
    createdAt: string;
    errorCode: string;
    finishedAt: string;
    runId: string;
    runKey: string;
    startedAt: string;
    status: string;
    triggerType: string;
    updatedAt: string;
    workflowId: string;
    workflowVersion: string;
  }

  export interface WorkflowRunPageParams extends PageParam {
    applicationId?: string;
    createdAtFrom?: string;
    createdAtTo?: string;
    runId?: string;
    runKey?: string;
    status?: string;
    triggerType?: string;
    workflowId?: string;
  }
}

export function getCloudMoldAiWorkflowRunPage(
  params: CloudMoldAiOperationsApi.WorkflowRunPageParams,
) {
  return requestClient.get<PageResult<CloudMoldAiOperationsApi.WorkflowRun>>(
    '/cloudmold/ai-operations/runs/page',
    { params },
  );
}
