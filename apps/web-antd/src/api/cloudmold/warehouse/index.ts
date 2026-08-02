import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

/**
 * CloudMold 规范仓网主数据只读查询 API。
 * 仅读取 cloudmold_warehouse / cloudmold_warehouse_zone / cloudmold_warehouse_location 权威表。
 */
export namespace CloudMoldWarehouseApi {
  export interface Warehouse {
    name: string;
    status: string;
    timezone?: string;
    updatedAt: string;
    version: number;
    warehouseCode: string;
    warehouseId: string;
    warehouseType: string;
  }

  export interface Zone {
    name: string;
    status: string;
    updatedAt: string;
    version: number;
    warehouseCode?: string;
    warehouseId: string;
    zoneCode: string;
    zoneId: string;
    zoneType: string;
  }

  export interface Location {
    aisleCode?: string;
    allowItemMixing?: boolean;
    allowLotMixing?: boolean;
    bayCode?: string;
    capacityQuantity?: number;
    capacityUomCode?: string;
    levelCode?: string;
    locationCode: string;
    locationId: string;
    locationType?: string;
    name?: string;
    rackCode?: string;
    status: string;
    updatedAt: string;
    version: number;
    warehouseCode?: string;
    warehouseId: string;
    zoneCode?: string;
    zoneId: string;
  }

  export interface WarehousePageParams extends PageParam {
    status?: string;
    warehouseCode?: string;
    warehouseType?: string;
  }

  export interface ZonePageParams extends PageParam {
    status?: string;
    warehouseId?: string;
    zoneCode?: string;
  }

  export interface LocationPageParams extends PageParam {
    locationCode?: string;
    status?: string;
    warehouseId?: string;
    zoneId?: string;
  }

  export interface StockTransferPageParams extends PageParam {
    keyword?: string;
    orderStatus?: string;
    sourceWarehouseId?: string;
    targetWarehouseId?: string;
  }

  export interface StockTransferPageItem {
    approvedAt: string;
    currentStageCode: string;
    currentStageLabel: string;
    lineCount: number;
    orderCode: string;
    orderId: string;
    orderStatus: string;
    orderVersion: number;
    ownerId: string;
    ownerType: string;
    preparedAt: string;
    requestCode: string;
    requestId: string;
    requestStatus: string;
    requestVersion: number;
    sourceBusinessRef: string;
    sourceBusinessType: string;
    sourceWarehouseCode: string;
    sourceWarehouseId: string;
    sourceWarehouseName: string;
    targetWarehouseCode: string;
    targetWarehouseId: string;
    targetWarehouseName: string;
    terminal: boolean;
    totalRequestedQuantity: number;
    uomCode: string;
    updatedAt: string;
  }

  export interface StockTransferLine {
    canonicalSkuId: string;
    lineId: string;
    lineNumber: number;
    remark?: string;
    requestedQuantity: number;
    uomCode: string;
  }

  export interface StockTransferHistory {
    businessObjectId: string;
    businessObjectType: string;
    changedAt: string;
    historyId: string;
    stageCode: string;
    stageLabel: string;
    status: string;
    statusVersion: number;
  }

  export interface StockTransferDetail {
    currentStageCode: string;
    currentStageLabel: string;
    lines: StockTransferLine[];
    orderCode: string;
    orderId: string;
    orderStatus: string;
    orderVersion: number;
    ownerId: string;
    ownerType: string;
    reasonCode: string;
    remark?: string;
    requestCode: string;
    requestId: string;
    requestStatus: string;
    requestVersion: number;
    sourceBusinessRef: string;
    sourceBusinessType: string;
    sourceWarehouseCode: string;
    sourceWarehouseId: string;
    sourceWarehouseName: string;
    statusHistory: StockTransferHistory[];
    targetWarehouseCode: string;
    targetWarehouseId: string;
    targetWarehouseName: string;
    terminal: boolean;
  }

  export type SupplierReturnOperation =
    | 'APPROVE'
    | 'CANCEL'
    | 'COMPLETE'
    | 'CREATE_DRAFT'
    | 'DISPATCH'
    | 'SUBMIT';

  export interface SupplierReturnPageParams extends PageParam {
    keyword?: string;
    purchaseOrderId?: string;
    receiptId?: string;
    status?: string;
    supplierId?: string;
    warehouseId?: string;
  }

  export interface SupplierReturnPageItem {
    createdAt: string;
    currentStageCode: string;
    currentStageLabel: string;
    lineCount: number;
    purchaseOrderId: string;
    receiptId: string;
    returnCode: string;
    returnId: string;
    status: string;
    supplierId: string;
    terminal: boolean;
    totalDispatchedQuantity: string;
    totalReturnQuantity: string;
    updatedAt: string;
    version: number;
    warehouseId: string;
  }

  export interface SupplierReturnLine {
    canonicalSkuId: string;
    currencyCode?: string;
    decisionVersion?: number;
    dispatchedQuantity: string;
    inspectionSplitId?: string;
    lineNumber: number;
    lineStatus: string;
    locationId?: string;
    lotId?: string;
    outstandingQuantity: string;
    purchaseOrderItemId?: string;
    purchaseOrderScheduleId?: string;
    qualityDecisionId?: string;
    qualityEvidenceRef?: string;
    receiptLineId?: string;
    remark?: string;
    returnLineId: string;
    returnQuantity: string;
    sourceDisposition: string;
    uomCode: string;
    unitCostAmountMinor?: string;
    valuationPolicyHash?: string;
    valuationPolicyId?: string;
    valuationPolicyVersion?: string;
    warehouseId?: string;
  }

  export interface SupplierReturnDispatchLine {
    cumulativeDispatchedQuantity: string;
    dispatchedQuantity: string;
    executionLineId: string;
    inventoryAggregateVersion?: string;
    ledgerTransactionId?: string;
    lineNumber: number;
    lineStatus: string;
    occurredAt: string;
    outstandingQuantity: string;
    remark?: string;
    returnLineId: string;
    sourceBalanceId?: string;
    sourceDisposition: string;
  }

  export interface SupplierReturnDispatchBatch {
    batchId: string;
    batchNo: string;
    lines: SupplierReturnDispatchLine[];
    occurredAt: string;
    remark?: string;
    status: string;
    version: number;
  }

  export interface SupplierReturnHistory {
    businessObjectId: string;
    businessObjectType: string;
    changedAt: string;
    historyId: string;
    remark?: string;
    stageCode: string;
    stageLabel: string;
    status: string;
    statusVersion: number;
  }

  export interface SupplierReturnDetail {
    approvedAt?: string;
    approvedByPrincipalId?: string;
    cancelledAt?: string;
    cancelledByPrincipalId?: string;
    completedAt?: string;
    completedByPrincipalId?: string;
    createdAt: string;
    createdByPrincipalId?: string;
    currentStageCode: string;
    currentStageLabel: string;
    dispatchBatches: SupplierReturnDispatchBatch[];
    lines: SupplierReturnLine[];
    ownerId: string;
    ownerType: string;
    purchaseOrderId: string;
    reasonCode: string;
    receiptId: string;
    remark?: string;
    returnCode: string;
    returnId: string;
    status: string;
    statusHistory: SupplierReturnHistory[];
    submittedAt?: string;
    submittedByPrincipalId?: string;
    supplierId: string;
    terminal: boolean;
    updatedAt: string;
    version: number;
    warehouseId: string;
  }

  export interface SupplierReturnCommandResult {
    aggregateVersion: number;
    batchId?: string;
    batchNo?: string;
    currentStageCode: string;
    currentStageLabel: string;
    duplicate: boolean;
    operationId: string;
    processedLineCount?: number;
    returnCode: string;
    returnId: string;
    status: string;
  }

  export interface SupplierReturnCommand {
    operation: SupplierReturnOperation;
    returnId?: string;
    expectedVersion?: number;
    create?: {
      lines: Array<{
        decisionVersion?: number;
        lineNumber: number;
        qualityDecisionId?: string;
        remark?: string;
        returnLineId: string;
        returnQuantity: string;
        sourceDisposition: string;
      }>;
      purchaseOrderId: string;
      reasonCode: string;
      receiptId: string;
      remark?: string;
      returnCode: string;
      returnId: string;
    };
    cancel?: {
      reasonCode: string;
      remark?: string;
    };
    dispatchBatch?: {
      batchId: string;
      batchNo: string;
      lines: Array<{
        dispatchQuantity: string;
        executionLineId: string;
        lineNumber: number;
        remark?: string;
        returnLineId: string;
      }>;
      remark?: string;
    };
  }

  export type StockCountOperation =
    | 'ADJUST'
    | 'APPROVE_DIFFERENCE'
    | 'CANCEL'
    | 'COMPLETE'
    | 'CREATE_DRAFT'
    | 'RECORD_COUNT_BATCH'
    | 'START_COUNTING'
    | 'SUBMIT';

  export interface StockCountPageParams extends PageParam {
    countMode?: string;
    keyword?: string;
    status?: string;
  }

  export interface StockCountPageItem {
    countMode: string;
    countedLineCount: number;
    differenceLineCount: number;
    freezeCapturedAt?: string;
    freezeLedgerTransactionId?: string;
    lineCount: number;
    scopeLabel: string;
    scopeType: string;
    sourceBusinessRef?: string;
    sourceBusinessType?: string;
    status: string;
    stockCountCode: string;
    stockCountId: string;
    updatedAt: string;
    version: number;
  }

  export interface StockCountLine {
    adjustedAggregateVersion?: number;
    adjustmentId?: string;
    adjustmentLedgerTransactionId?: number;
    balanceId?: string;
    baseUomCode: string;
    bookAggregateVersion?: number;
    bookAvailableQuantity: string;
    bookInTransitQuantity: string;
    bookOnHandQuantity: string;
    bookReservedQuantity: string;
    canonicalSkuId: string;
    countStatus: string;
    countedAt?: string;
    countedByPrincipalId?: string;
    countedOnHandQuantity?: string;
    differenceQuantity?: string;
    lineId: string;
    lineNumber: number;
    locationId?: string;
    lotId?: string;
    ownerId: string;
    ownerType: string;
    qualityStatus: string;
    remark?: string;
    stockStatus: string;
    warehouseId: string;
  }

  export interface StockCountExecutionLine {
    countedOnHandQuantity: string;
    differenceQuantity: string;
    executionLineId: string;
    remark?: string;
    stockCountLineId: string;
  }

  export interface StockCountExecutionBatch {
    batchId: string;
    batchNo: string;
    countedByPrincipalId?: string;
    lineCount: number;
    lines: StockCountExecutionLine[];
    occurredAt?: string;
    remark?: string;
    status: string;
  }

  export interface StockCountApproval {
    approvalId: string;
    approvalType: string;
    approvedAt?: string;
    approvedByPrincipalId?: string;
    remark?: string;
    totalBookOnHandQuantity: string;
    totalCountedOnHandQuantity: string;
    totalDifferenceQuantity: string;
  }

  export interface StockCountHistory {
    changedAt: string;
    changedByPrincipalId?: string;
    historyId: string;
    remark?: string;
    stageCode: string;
    stageLabel: string;
    status: string;
    statusVersion: number;
  }

  export interface StockCountDetail {
    approvals: StockCountApproval[];
    countMode: string;
    countedLineCount: number;
    createdAt: string;
    createdByPrincipalId?: string;
    differenceLineCount: number;
    executionBatches: StockCountExecutionBatch[];
    freezeCapturedAt?: string;
    freezeLedgerTransactionId?: number;
    lineCount: number;
    lines: StockCountLine[];
    reasonCode?: string;
    remark?: string;
    scopeLabel: string;
    scopeType: string;
    sourceBusinessRef?: string;
    sourceBusinessType?: string;
    status: string;
    statusHistory: StockCountHistory[];
    stockCountCode: string;
    stockCountId: string;
    updatedAt: string;
    version: number;
  }

  export interface StockCountCommandResult {
    aggregateVersion: number;
    batchId?: string;
    batchNo?: string;
    currentStageCode: string;
    currentStageLabel: string;
    differenceLineCount?: number;
    duplicate: boolean;
    freezeLedgerTransactionId?: number;
    operationId: string;
    processedLineCount?: number;
    status: string;
    stockCountCode: string;
    stockCountId: string;
  }

  export interface StockCountCommand {
    operation: StockCountOperation;
    approvalRemark?: string;
    countBatch?: {
      batchId: string;
      batchNo: string;
      lines: Array<{
        countedOnHandQuantity: string;
        executionLineId: string;
        remark?: string;
        stockCountLineId: string;
      }>;
      remark?: string;
    };
    lines?: Array<{
      baseUomCode: string;
      canonicalSkuId: string;
      lineId: string;
      lineNumber: number;
      locationId?: string;
      lotId?: string;
      ownerId: string;
      ownerType: string;
      qualityStatus: string;
      remark?: string;
      stockStatus: string;
      warehouseId: string;
    }>;
    reasonCode?: string;
    remark?: string;
    scopeLabel?: string;
    scopeType?: string;
    sourceBusinessRef?: string;
    sourceBusinessType?: string;
    stockCountCode?: string;
    stockCountId?: string;
    countMode?: string;
  }

  export type InventoryScrapOperation =
    | 'APPROVE'
    | 'CANCEL'
    | 'COMPLETE'
    | 'CREATE_DRAFT'
    | 'RECORD_DISPOSITION_BATCH'
    | 'SUBMIT';

  export interface InventoryScrapPageParams extends PageParam {
    keyword?: string;
    status?: string;
    warehouseId?: string;
  }

  export interface InventoryScrapPageItem {
    aggregateVersion: number;
    createdAt: string;
    lineCount: number;
    ownerId: string;
    ownerType: string;
    reasonCode: string;
    scrapCode: string;
    scrapId: string;
    scrapStatus: string;
    totalDisposedQuantity: string;
    totalRequestedQuantity: string;
    updatedAt: string;
    warehouseId: string;
  }

  export interface InventoryScrapLine {
    aggregateVersion: number;
    baseUomCode: string;
    canonicalSkuId: string;
    disposedQuantity: string;
    evidenceRef?: string;
    evidenceType?: string;
    lineId: string;
    lineNumber: number;
    lineStatus: string;
    locationId?: string;
    lotId?: string;
    qualityStatus: string;
    remark?: string;
    requestedQuantity: string;
    stockStatus: string;
  }

  export interface InventoryScrapDispositionLine {
    baseUomCode: string;
    canonicalSkuId: string;
    cumulativeDisposedQuantity: string;
    dispositionLineId: string;
    disposedQuantity: string;
    inventoryBalanceId?: string;
    inventoryLedgerTransactionId?: number;
    inventoryOperationId?: number;
    lineNumber: number;
    lineStatus: string;
    locationId?: string;
    lotId?: string;
    qualityStatus: string;
    remark?: string;
    scrapLineId: string;
    stockStatus: string;
  }

  export interface InventoryScrapDispositionBatch {
    batchId: string;
    batchNo: string;
    batchStatus: string;
    dispositionType: string;
    executedByPrincipalId?: string;
    lineCount: number;
    lines: InventoryScrapDispositionLine[];
    occurredAt?: string;
    proofRef?: string;
    proofType?: string;
    remark?: string;
    totalDisposedQuantity: string;
  }

  export interface InventoryScrapHistory {
    actorPrincipalId?: string;
    aggregateVersion: number;
    changedAt: string;
    historyId: string;
    note?: string;
    scrapStatus: string;
  }

  export interface InventoryScrapDetail {
    aggregateVersion: number;
    approvedAt?: string;
    approvedByPrincipalId?: string;
    cancelledAt?: string;
    cancelledByPrincipalId?: string;
    completedAt?: string;
    completedByPrincipalId?: string;
    createdAt: string;
    dispositionBatches: InventoryScrapDispositionBatch[];
    lineCount: number;
    lines: InventoryScrapLine[];
    ownerId: string;
    ownerType: string;
    reasonCode: string;
    remark?: string;
    requestedByPrincipalId?: string;
    scrapCode: string;
    scrapId: string;
    scrapStatus: string;
    statusHistory: InventoryScrapHistory[];
    submittedByPrincipalId?: string;
    totalDisposedQuantity: string;
    totalRequestedQuantity: string;
    updatedAt: string;
    warehouseId: string;
  }

  export interface InventoryScrapCommandResult {
    aggregateVersion: number;
    batchId?: string;
    batchNo?: string;
    duplicate: boolean;
    operationId: string;
    processedLineCount?: number;
    scrapCode: string;
    scrapId: string;
    scrapStatus: string;
  }

  export interface InventoryScrapCommand {
    operation: InventoryScrapOperation;
    dispositionBatch?: {
      batchId: string;
      batchNo: string;
      dispositionType: string;
      lines: Array<{
        disposedQuantity: string;
        dispositionLineId: string;
        lineNumber: number;
        remark?: string;
      }>;
      proofRef?: string;
      proofType?: string;
      remark?: string;
    };
    lines?: Array<{
      baseUomCode: string;
      canonicalSkuId: string;
      evidenceRef?: string;
      evidenceType?: string;
      lineId: string;
      lineNumber: number;
      locationId?: string;
      lotId?: string;
      qualityStatus: string;
      remark?: string;
      requestedQuantity: string;
      stockStatus: string;
    }>;
    ownerId?: string;
    ownerType?: string;
    reasonCode?: string;
    remark?: string;
    scrapCode?: string;
    scrapId?: string;
    warehouseId?: string;
  }
}

export function getCloudMoldWarehousePage(
  params: CloudMoldWarehouseApi.WarehousePageParams,
) {
  return requestClient.get<PageResult<CloudMoldWarehouseApi.Warehouse>>(
    '/cloudmold/warehouse/warehouses/page',
    { params },
  );
}

export function getCloudMoldWarehouseZonePage(
  params: CloudMoldWarehouseApi.ZonePageParams,
) {
  return requestClient.get<PageResult<CloudMoldWarehouseApi.Zone>>(
    '/cloudmold/warehouse/zones/page',
    { params },
  );
}

export function getCloudMoldWarehouseLocationPage(
  params: CloudMoldWarehouseApi.LocationPageParams,
) {
  return requestClient.get<PageResult<CloudMoldWarehouseApi.Location>>(
    '/cloudmold/warehouse/locations/page',
    { params },
  );
}

export function getCloudMoldStockTransferPage(
  params: CloudMoldWarehouseApi.StockTransferPageParams,
) {
  return requestClient.get<
    PageResult<CloudMoldWarehouseApi.StockTransferPageItem>
  >('/cloudmold/warehouse/stock-transfers/page', { params });
}

export function getCloudMoldStockTransfer(requestId: string) {
  return requestClient.get<CloudMoldWarehouseApi.StockTransferDetail>(
    '/cloudmold/warehouse/stock-transfers/get',
    { params: { requestId } },
  );
}

export function getCloudMoldSupplierReturnPage(
  params: CloudMoldWarehouseApi.SupplierReturnPageParams,
) {
  return requestClient.get<
    PageResult<CloudMoldWarehouseApi.SupplierReturnPageItem>
  >('/cloudmold/warehouse/supplier-returns/page', { params });
}

export function getCloudMoldSupplierReturn(returnId: string) {
  return requestClient.get<CloudMoldWarehouseApi.SupplierReturnDetail>(
    '/cloudmold/warehouse/supplier-returns/get',
    { params: { returnId } },
  );
}

export function executeCloudMoldSupplierReturnCommand(
  command: CloudMoldWarehouseApi.SupplierReturnCommand,
) {
  return requestClient.post<CloudMoldWarehouseApi.SupplierReturnCommandResult>(
    '/cloudmold/warehouse/supplier-returns/command',
    command,
  );
}

export function getCloudMoldStockCountPage(
  params: CloudMoldWarehouseApi.StockCountPageParams,
) {
  return requestClient.get<
    PageResult<CloudMoldWarehouseApi.StockCountPageItem>
  >('/cloudmold/warehouse/stock-counts/page', { params });
}

export function getCloudMoldStockCount(stockCountId: string) {
  return requestClient.get<CloudMoldWarehouseApi.StockCountDetail>(
    '/cloudmold/warehouse/stock-counts/get',
    { params: { stockCountId } },
  );
}

export function executeCloudMoldStockCountCommand(
  command: CloudMoldWarehouseApi.StockCountCommand,
) {
  return requestClient.post<CloudMoldWarehouseApi.StockCountCommandResult>(
    '/cloudmold/warehouse/stock-counts/command',
    command,
  );
}

export function getCloudMoldInventoryScrapPage(
  params: CloudMoldWarehouseApi.InventoryScrapPageParams,
) {
  return requestClient.get<
    PageResult<CloudMoldWarehouseApi.InventoryScrapPageItem>
  >('/cloudmold/warehouse/inventory-scraps/page', { params });
}

export function getCloudMoldInventoryScrap(scrapId: string) {
  return requestClient.get<CloudMoldWarehouseApi.InventoryScrapDetail>(
    '/cloudmold/warehouse/inventory-scraps/get',
    { params: { scrapId } },
  );
}

export function executeCloudMoldInventoryScrapCommand(
  command: CloudMoldWarehouseApi.InventoryScrapCommand,
) {
  return requestClient.post<CloudMoldWarehouseApi.InventoryScrapCommandResult>(
    '/cloudmold/warehouse/inventory-scraps/command',
    command,
  );
}
