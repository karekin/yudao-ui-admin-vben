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
    convertedByPrincipalId: string;
    expectedVersion: number;
    recommendationId: string;
    targetType: 'PURCHASE_REQUEST';
  }

  export interface TransferReplenishmentConversion {
    convertedByPrincipalId: string;
    expectedVersion: number;
    ownerId: string;
    ownerType: string;
    recommendationId: string;
    sourceWarehouseId: string;
    targetType: 'TRANSFER_REQUEST';
    targetWarehouseId: string;
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

  export type SafetyStockPolicyOperation =
    | 'APPROVE'
    | 'PUBLISH'
    | 'RETIRE'
    | 'SAVE_DRAFT';

  export interface SafetyStockPolicyPageParams extends PageParam {
    keyword?: string;
    status?: string;
  }

  export interface SafetyStockPolicyVersion {
    actorPrincipalId?: string;
    canonicalSkuId: string;
    createdAt: string;
    effectiveFrom: string;
    effectiveTo?: string;
    evidenceRef?: string;
    leadTimeDays: number;
    maximumStockQuantity: string;
    ownerId: string;
    ownerType: string;
    policyBasisCode: string;
    policySha256: string;
    policyVersionId: string;
    reorderPointQuantity: string;
    replenishmentCycleDays: number;
    safetyStockQuantity: string;
    status: string;
    targetServiceLevelBasisPoints: number;
    version: number;
    warehouseNetworkId: string;
  }

  export interface SafetyStockPolicy {
    approvedAt?: string;
    approvedByPrincipalId?: string;
    approvedVersion?: number;
    canonicalSkuId: string;
    createdAt: string;
    createdByPrincipalId?: string;
    currentVersion: number;
    effectiveFrom: string;
    effectiveTo?: string;
    evidenceRef?: string;
    history: SafetyStockPolicyVersion[];
    leadTimeDays: number;
    maximumStockQuantity: string;
    ownerId: string;
    ownerType: string;
    policyBasisCode: string;
    policyCode: string;
    policyId: string;
    policySha256: string;
    publishedAt?: string;
    publishedByPrincipalId?: string;
    publishedVersion?: number;
    reorderPointQuantity: string;
    replenishmentCycleDays: number;
    retiredAt?: string;
    retiredByPrincipalId?: string;
    safetyStockQuantity: string;
    status: string;
    targetServiceLevelBasisPoints: number;
    updatedAt: string;
    warehouseNetworkId: string;
  }

  export type SafetyStockPolicyCommandResult = CommandResult;

  export interface SafetyStockPolicyCommand {
    operation: SafetyStockPolicyOperation;
    policy: {
      canonicalSkuId: string;
      effectiveFrom: string;
      effectiveTo?: string;
      evidenceRef?: string;
      expectedVersion?: number;
      leadTimeDays: number;
      maximumStockQuantity: string;
      ownerId: string;
      ownerType: string;
      policyBasisCode: string;
      policyCode: string;
      policyId: string;
      policySha256: string;
      reorderPointQuantity: string;
      replenishmentCycleDays: number;
      safetyStockQuantity: string;
      targetServiceLevelBasisPoints: number;
      warehouseNetworkId: string;
    };
  }

  export interface InventoryHealthSnapshotIssueRef {
    issueId: string;
    issueType?: string;
    severity?: string;
    sourceBalanceId?: string;
    status?: string;
  }

  export interface InventoryHealthSnapshotPageParams extends PageParam {
    keyword?: string;
    policyId?: string;
  }

  export interface InventoryHealthSnapshot {
    atRiskQuantity: string;
    agedCount: number;
    createdAt: string;
    createdByPrincipalId?: string;
    excessQuantity: string;
    issueCount: number;
    issues: InventoryHealthSnapshotIssueRef[];
    ledgerWatermarkOccurredAt?: string;
    ledgerWatermarkRef: string;
    lowStockCount: number;
    obsoleteCount: number;
    overstockCount: number;
    policyCode: string;
    policyId: string;
    policyVersion: number;
    policyVersionId: string;
    shelfLifeRiskCount: number;
    shortageQuantity: string;
    snapshotCode: string;
    snapshotId: string;
    snapshotSha256: string;
    status: string;
    stockoutCount: number;
  }

  export type InventoryHealthSnapshotCommandResult = CommandResult;

  export interface InventoryHealthSnapshotCommand {
    snapshot: {
      agedCount: number;
      atRiskQuantity: string;
      excessQuantity: string;
      issueRefs: Array<{ issueId: string }>;
      ledgerWatermarkOccurredAt?: string;
      ledgerWatermarkRef: string;
      lowStockCount: number;
      obsoleteCount: number;
      overstockCount: number;
      policyId: string;
      policyVersionId: string;
      shelfLifeRiskCount: number;
      shortageQuantity: string;
      snapshotCode: string;
      snapshotId: string;
      snapshotSha256: string;
      stockoutCount: number;
    };
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

export function getSafetyStockPolicyPage(
  params: CloudMoldSupplyPlanningApi.SafetyStockPolicyPageParams,
) {
  return requestClient.get<
    PageResult<CloudMoldSupplyPlanningApi.SafetyStockPolicy>
  >('/cloudmold/supply-planning/safety-stock-policies/page', { params });
}

export function getSafetyStockPolicy(policyId: string) {
  return requestClient.get<CloudMoldSupplyPlanningApi.SafetyStockPolicy>(
    `/cloudmold/supply-planning/safety-stock-policies/${policyId}`,
  );
}

export function executeSafetyStockPolicyCommand(
  command: CloudMoldSupplyPlanningApi.SafetyStockPolicyCommand,
) {
  return requestClient.post<CloudMoldSupplyPlanningApi.SafetyStockPolicyCommandResult>(
    '/cloudmold/supply-planning/safety-stock-policies/command',
    { ...buildCommandEnvelopeWithRunId(), ...command },
  );
}

export function getInventoryHealthSnapshotPage(
  params: CloudMoldSupplyPlanningApi.InventoryHealthSnapshotPageParams,
) {
  return requestClient.get<
    PageResult<CloudMoldSupplyPlanningApi.InventoryHealthSnapshot>
  >('/cloudmold/supply-planning/inventory-health-snapshots/page', { params });
}

export function getInventoryHealthSnapshot(snapshotId: string) {
  return requestClient.get<CloudMoldSupplyPlanningApi.InventoryHealthSnapshot>(
    `/cloudmold/supply-planning/inventory-health-snapshots/${snapshotId}`,
  );
}

export function executeInventoryHealthSnapshotCommand(
  command: CloudMoldSupplyPlanningApi.InventoryHealthSnapshotCommand,
) {
  return requestClient.post<CloudMoldSupplyPlanningApi.InventoryHealthSnapshotCommandResult>(
    '/cloudmold/supply-planning/inventory-health-snapshots/command',
    { ...buildCommandEnvelopeWithRunId(), ...command },
  );
}
