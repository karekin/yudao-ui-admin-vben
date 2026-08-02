import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace CloudMoldInventoryApi {
  export interface Balance {
    aggregateVersion: number;
    allocatableQuantity: string;
    allocationEligibility: string;
    availableQuantity: string;
    balanceId: string;
    baseUomCode: string;
    canonicalSkuId: string;
    inTransitQuantity: string;
    locationCode: string;
    locationId: string;
    locationName: string;
    lotCode?: string;
    lotId?: string;
    onHandQuantity: string;
    ownerId: string;
    ownerType: string;
    qualityStatus: string;
    reservedQuantity: string;
    skuCode: string;
    spuCode: string;
    stockStatus: string;
    updatedAt: string;
    warehouseCode: string;
    warehouseId: string;
    warehouseName: string;
  }

  export interface BalanceAllocationItem {
    allocationId: string;
    quantity: string;
    reservationId: string;
    status: number;
    version: number;
  }

  export interface BalanceDetail {
    activeAllocations: BalanceAllocationItem[];
    aggregateVersion: number;
    allocationEligibility: string;
    allocatableQuantity: string;
    availableQuantity: string;
    balanceId: string;
    baseUomCode: string;
    canonicalSkuId: string;
    createdAt: string;
    inTransitQuantity: string;
    locationCode: string;
    locationId: string;
    locationName: string;
    lotCode?: string;
    lotId?: string;
    onHandQuantity: string;
    ownerId: string;
    ownerType: string;
    qualityStatus: string;
    recentLedgerEntries: BalanceLedgerItem[];
    reservedQuantity: string;
    skuCode: string;
    spuCode: string;
    stockStatus: string;
    updatedAt: string;
    warehouseCode: string;
    warehouseId: string;
    warehouseName: string;
  }

  export interface BalanceLedgerItem {
    afterOnHandQuantity: string;
    businessNo?: string;
    businessType?: string;
    commandType?: string;
    deltaInTransitQuantity: string;
    deltaOnHandQuantity: string;
    deltaReservedQuantity: string;
    entryRole?: string;
    ledgerEntryId: number;
    occurredAt: string;
  }

  export interface BalancePageParams extends PageParam {
    locationCode?: string;
    lotCode?: string;
    onlyNonZero?: boolean;
    ownerId?: string;
    ownerType?: string;
    qualityStatus?: string;
    skuCode?: string;
    stockStatus?: string;
    warehouseCode?: string;
  }

  export interface Reservation {
    allocationId: string;
    allocationQuantity: string;
    allocationStatus: number;
    allocationVersion: number;
    baseUomCode: string;
    businessId: string;
    businessItemId: string;
    businessType: string;
    canonicalSkuId: string;
    closedOperationId?: number;
    createdAt: string;
    createdOperationId: number;
    locationCode: string;
    locationId: string;
    lotCode?: string;
    lotId?: string;
    ownerId: string;
    ownerType: string;
    qualityStatus: string;
    quantity: string;
    reservationId: string;
    skuCode: string;
    status: number;
    stockStatus: string;
    updatedAt: string;
    version: number;
    warehouseCode: string;
    warehouseId: string;
  }

  export interface ReservationPageParams extends PageParam {
    businessId?: string;
    businessItemId?: string;
    businessType?: string;
    locationCode?: string;
    lotCode?: string;
    reservationId?: string;
    skuCode?: string;
    status?: number;
    warehouseCode?: string;
  }

  export interface LedgerEntry {
    afterInTransitQuantity: string;
    afterOnHandQuantity: string;
    afterReservedQuantity: string;
    aggregateVersion: number;
    balanceId: string;
    baseUomCode: string;
    beforeInTransitQuantity: string;
    beforeOnHandQuantity: string;
    beforeReservedQuantity: string;
    businessId: string;
    businessItemId: string;
    businessNo: string;
    businessType: string;
    canonicalSkuId: string;
    commandType: string;
    counterpartyBalanceId?: string;
    createdAt: string;
    deltaInTransitQuantity: string;
    deltaOnHandQuantity: string;
    deltaReservedQuantity: string;
    entryRole: string;
    ledgerEntryId: number;
    ledgerTransactionId: number;
    locationCode: string;
    locationId: string;
    lotCode?: string;
    lotId?: string;
    movementGroupId: string;
    occurredAt: string;
    ownerId: string;
    ownerType: string;
    qualityStatus: string;
    skuCode: string;
    stockStatus: string;
    warehouseCode: string;
    warehouseId: string;
  }

  export interface LedgerPageParams extends PageParam {
    businessId?: string;
    businessItemId?: string;
    businessNo?: string;
    businessType?: string;
    commandType?: string;
    entryRole?: string;
    locationCode?: string;
    lotCode?: string;
    movementGroupId?: string;
    occurredTimeFrom?: string;
    occurredTimeTo?: string;
    skuCode?: string;
    warehouseCode?: string;
  }

  export interface Lot {
    allocationEligibility: string;
    canonicalSkuId: string;
    eligibilityAt: string;
    expiresOn?: string;
    lotCode: string;
    lotId: string;
    mappedSourceId?: string;
    mappedSourceSystem?: string;
    mappedSourceType?: string;
    manufacturedOn?: string;
    mappingId?: string;
    mappingStatus?: string;
    mappingValidFrom?: string;
    mappingValidTo?: string;
    mappingVersion?: number;
    ownerId: string;
    ownerType: string;
    receivedAt?: string;
    status: string;
    version: number;
  }

  export interface LotAvailability {
    aggregateVersion: number;
    allocatableQuantity: string;
    allocationEligibility: string;
    balanceId: string;
    baseUomCode: string;
    canonicalSkuId: string;
    eligibilityAt: string;
    inTransitQuantity: string;
    locationId: string;
    lotId?: string;
    onHandQuantity: string;
    ownerId: string;
    ownerType: string;
    qualityStatus: string;
    reservedQuantity: string;
    stockStatus: string;
    unreservedQuantity: string;
    warehouseId: string;
  }

  export interface AgingSnapshot {
    ageAgingMaxDays: number;
    ageFreshMaxDays: number;
    ageStaleMaxDays: number;
    bucketPolicyCode: string;
    bucketPolicyHash: string;
    bucketPolicyVersion: string;
    createdAt: string;
    expiryCriticalMaxDays: number;
    expiryWarningMaxDays: number;
    ledgerWatermarkOccurredAt?: string;
    ledgerWatermarkRef: string;
    lineCount: number;
    lines?: AgingSnapshotLine[];
    ownerId: string;
    ownerType: string;
    snapshotCode: string;
    snapshotDate: string;
    snapshotId: string;
    snapshotVersion: number;
    status: string;
    unknownAgeCount: number;
    unknownExpiryCount: number;
    warehouseId: string;
  }

  export interface AgingSnapshotLine {
    ageBasisAt?: string;
    ageBasisType: string;
    ageBucket?: string;
    ageDays?: number;
    availableQuantity: string;
    balanceId: string;
    balanceVersion: number;
    baseUomCode: string;
    canonicalSkuId: string;
    expiryBucket?: string;
    expiryDaysRemaining?: number;
    expiryStatus?: string;
    expiresOn?: string;
    inTransitQuantity: string;
    lineId: number;
    locationId: string;
    lotCode?: string;
    lotId?: string;
    manufacturedOn?: string;
    onHandQuantity: string;
    ownerId: string;
    ownerType: string;
    qualityStatus: string;
    riskClassification: string;
    reservedQuantity: string;
    stockStatus: string;
    warehouseId: string;
  }

  export interface AgingSnapshotPageParams extends PageParam {
    keyword?: string;
  }

  export interface AgingSnapshotCommand {
    ageAgingMaxDays: number;
    ageFreshMaxDays: number;
    ageStaleMaxDays: number;
    bucketPolicyCode: string;
    bucketPolicyVersion: string;
    correlationId: string;
    expiryCriticalMaxDays: number;
    expiryWarningMaxDays: number;
    idempotencyKey: string;
    occurredAt: string;
    ownerId: string;
    ownerType: string;
    sourceEventId: string;
    warehouseId: string;
  }

  export interface AgingSnapshotCommandResult {
    duplicate: boolean;
    lineCount: number;
    operationId: number;
    snapshotCode: string;
    snapshotId: string;
    snapshotVersion: number;
    status: string;
  }
}

export function getCloudMoldInventoryBalancePage(
  params: CloudMoldInventoryApi.BalancePageParams,
) {
  return requestClient.get<PageResult<CloudMoldInventoryApi.Balance>>(
    '/cloudmold/inventory/v3/balances/page',
    { params },
  );
}

/** 查询单个规范库存余额详情（含最近流水与活跃预占），不读取 yudao ERP/WMS 表。 */
export function getCloudMoldInventoryBalanceDetail(balanceId: string) {
  return requestClient.get<CloudMoldInventoryApi.BalanceDetail | null>(
    '/cloudmold/inventory/v3/balances/get-detail',
    { params: { balanceId } },
  );
}

export function getCloudMoldInventoryReservationPage(
  params: CloudMoldInventoryApi.ReservationPageParams,
) {
  return requestClient.get<PageResult<CloudMoldInventoryApi.Reservation>>(
    '/cloudmold/inventory/v3/reservations/page',
    { params },
  );
}

export function getCloudMoldInventoryLedgerPage(
  params: CloudMoldInventoryApi.LedgerPageParams,
) {
  return requestClient.get<PageResult<CloudMoldInventoryApi.LedgerEntry>>(
    '/cloudmold/inventory/v3/ledger/page',
    { params },
  );
}

export function getCloudMoldInventoryLot(lotId: string, eligibilityAt: string) {
  return requestClient.get<CloudMoldInventoryApi.Lot>(
    `/cloudmold/inventory/v3/lots/${encodeURIComponent(lotId)}`,
    { params: { eligibilityAt } },
  );
}

export function getCloudMoldInventoryLotAvailability(
  lotId: string,
  eligibilityAt: string,
) {
  return requestClient.get<CloudMoldInventoryApi.LotAvailability[]>(
    `/cloudmold/inventory/v3/lots/${encodeURIComponent(lotId)}/availability`,
    { params: { eligibilityAt } },
  );
}

export function getCloudMoldInventoryAgingSnapshotPage(
  params: CloudMoldInventoryApi.AgingSnapshotPageParams,
) {
  return requestClient.get<PageResult<CloudMoldInventoryApi.AgingSnapshot>>(
    '/cloudmold/inventory/v3/aging-snapshots/page',
    { params },
  );
}

export function getCloudMoldInventoryAgingSnapshot(snapshotId: string) {
  return requestClient.get<CloudMoldInventoryApi.AgingSnapshot>(
    `/cloudmold/inventory/v3/aging-snapshots/${encodeURIComponent(snapshotId)}`,
  );
}

export function captureCloudMoldInventoryAgingSnapshot(
  command: CloudMoldInventoryApi.AgingSnapshotCommand,
) {
  return requestClient.post<CloudMoldInventoryApi.AgingSnapshotCommandResult>(
    '/cloudmold/inventory/v3/aging-snapshots/command',
    command,
  );
}

export const InventoryOperation = {
  RECEIVE: 'RECEIVE',
  RELEASE: 'RELEASE',
  RESERVE: 'RESERVE',
  RETURN: 'RETURN',
  SHIP: 'SHIP',
} as const;

export namespace CloudMoldInventoryCommandApi {
  export interface Command {
    baseUomCode: string;
    businessId: string;
    businessItemId: string;
    businessNo: string;
    businessType: string;
    canonicalSkuId: string;
    locationId: string;
    lotId?: string;
    operation: string;
    ownerId: string;
    ownerType: string;
    qualityStatus: string;
    quantity: string;
    reservationId?: string;
    stockStatus: string;
    warehouseId: string;
  }

  export interface CommandResult {
    aggregateVersion: number;
    allocationId?: string;
    balanceId: string;
    duplicate: boolean;
    ledgerTransactionId: number;
    operationId: number;
    reservationId?: string;
  }
}

/** 精确维度库存命令；数量、预占、账本与 Outbox 由后端同一事务处理。 */
export function executeCloudMoldInventoryCommand(
  command: CloudMoldInventoryCommandApi.Command,
) {
  const idempotencyKey = crypto.randomUUID();
  return requestClient.post<CloudMoldInventoryCommandApi.CommandResult>(
    '/cloudmold/inventory/v3/command',
    {
      ...command,
      correlationId: crypto.randomUUID(),
      idempotencyKey,
      occurredAt: new Date().toISOString(),
      sourceEventId: `cloudmold-admin:${idempotencyKey}`,
    },
  );
}
