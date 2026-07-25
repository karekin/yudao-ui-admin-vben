import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

import { buildCommandEnvelopeWithRunId } from '../command-helpers';

export namespace CloudMoldSupplyPlanningApi {
  export type ReplenishmentConversionTargetType =
    | 'PURCHASE_REQUEST'
    | 'TRANSFER_REQUEST';

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

  export interface ForecastCommand {
    forecast?: Record<string, unknown>;
    operation: string;
  }

  export interface ForecastEvaluationCommand {
    forecastEvaluation?: Record<string, unknown>;
    operation: string;
  }

  export interface InventoryHealthScanCommand {
    inventoryHealthScan?: Record<string, unknown>;
    operation: string;
  }

  export interface InventoryIssueCommand {
    inventoryIssue?: Record<string, unknown>;
    operation: string;
  }

  export interface PlanScenarioCommand {
    operation: string;
    planScenario?: Record<string, unknown>;
  }

  export interface ReplenishmentDecisionCommand {
    operation: string;
    replenishment?: Record<string, unknown>;
  }

  export interface PurchaseReplenishmentConversion {
    accountId: number;
    convertedByPrincipalId: string;
    erpProductId: number;
    erpProductUnitId: number;
    expectedVersion: number;
    mappingEvidenceSha256: string;
    recommendationId: string;
    supplierId: number;
    targetType: 'PURCHASE_REQUEST';
    taxPercent: number;
    unitCostMinor: number;
  }

  export interface TransferReplenishmentConversion {
    convertedByPrincipalId: string;
    expectedVersion: number;
    mappingEvidenceSha256: string;
    recommendationId: string;
    sourceWarehouseId: number;
    targetType: 'TRANSFER_REQUEST';
    targetWarehouseId: number;
    unitCostMinor: number;
    wmsSkuId: number;
  }

  export type ReplenishmentConversion =
    | PurchaseReplenishmentConversion
    | TransferReplenishmentConversion;

  export interface ReplenishmentConversionCommand {
    operation: 'CONVERT_REPLENISHMENT';
    replenishmentConversion: ReplenishmentConversion;
  }

  export interface SupplyPlanCommand {
    operation: string;
    supplyPlan?: Record<string, unknown>;
  }

  export type Command =
    | ForecastCommand
    | ForecastEvaluationCommand
    | InventoryHealthScanCommand
    | InventoryIssueCommand
    | PlanScenarioCommand
    | ReplenishmentConversionCommand
    | ReplenishmentDecisionCommand
    | SupplyPlanCommand
    | {
        forecast?: Record<string, unknown>;
        forecastEvaluation?: Record<string, unknown>;
        inventoryHealthScan?: Record<string, unknown>;
        inventoryIssue?: Record<string, unknown>;
        operation: string;
        planScenario?: Record<string, unknown>;
        replenishment?: Record<string, unknown>;
        replenishmentConversion?: ReplenishmentConversion;
        supplyPlan?: Record<string, unknown>;
      };

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
