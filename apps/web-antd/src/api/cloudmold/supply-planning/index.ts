import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

import { buildCommandEnvelopeWithRunId } from '../command-helpers';

export namespace CloudMoldSupplyPlanningApi {
  export interface WorkItem {
    aggregateId: string;
    aggregateVersion: number;
    businessDate?: string;
    code: string;
    itemType:
      | 'FORECAST'
      | 'FORECAST_EVALUATION'
      | 'INVENTORY_ISSUE'
      | 'INVENTORY_SCAN'
      | 'PLAN_SCENARIO'
      | 'REPLENISHMENT'
      | 'SUPPLY_PLAN';
    relatedRef?: string;
    status: string;
    updatedAt: string;
  }

  export interface PageParams extends PageParam {
    itemType?: string;
    status?: string;
  }

  export interface Command {
    forecast?: Record<string, unknown>;
    forecastEvaluation?: Record<string, unknown>;
    inventoryHealthScan?: Record<string, unknown>;
    inventoryIssue?: Record<string, unknown>;
    operation: string;
    planScenario?: Record<string, unknown>;
    replenishment?: Record<string, unknown>;
    replenishmentConversion?: Record<string, unknown>;
    supplyPlan?: Record<string, unknown>;
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

export function getSupplyPlanningWorkItemPage(
  params: CloudMoldSupplyPlanningApi.PageParams,
) {
  return requestClient.get<PageResult<CloudMoldSupplyPlanningApi.WorkItem>>(
    '/cloudmold/supply-planning/work-item/page',
    { params },
  );
}

export function executeSupplyPlanningCommand(
  command: CloudMoldSupplyPlanningApi.Command,
) {
  return requestClient.post<CloudMoldSupplyPlanningApi.CommandResult>(
    '/cloudmold/supply-planning/command',
    { ...buildCommandEnvelopeWithRunId(), ...command },
  );
}
