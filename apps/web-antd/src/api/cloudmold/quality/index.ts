import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

import { buildCommandEnvelopeWithRunId } from '../command-helpers';

export namespace CloudMoldQualityApi {
  export interface WorkItem {
    aggregateId: string;
    aggregateVersion: number;
    code: string;
    dueDate?: string;
    itemType:
      | 'CAPA'
      | 'CERTIFICATION'
      | 'INSPECTION_TASK'
      | 'RECALL_ACTION'
      | 'STANDARD';
    relatedRef?: string;
    status: string;
    updatedAt: string;
  }

  export interface PageParams extends PageParam {
    itemType?: string;
    status?: string;
  }

  export interface Command {
    capa?: Record<string, unknown>;
    certification?: Record<string, unknown>;
    inspectionTask?: Record<string, unknown>;
    operation: string;
    recallAction?: Record<string, unknown>;
    standard?: Record<string, unknown>;
  }

  export interface CommandResult {
    aggregateId: string;
    aggregateType: string;
    aggregateVersion: number;
    duplicate: boolean;
    operationId: number;
    status: string;
  }
}

export function getQualityWorkItemPage(params: CloudMoldQualityApi.PageParams) {
  return requestClient.get<PageResult<CloudMoldQualityApi.WorkItem>>(
    '/cloudmold/quality/work-item/page',
    { params },
  );
}

export function executeQualityCommand(command: CloudMoldQualityApi.Command) {
  return requestClient.post<CloudMoldQualityApi.CommandResult>(
    '/cloudmold/quality/command',
    { ...buildCommandEnvelopeWithRunId(), ...command },
  );
}
