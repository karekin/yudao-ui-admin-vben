import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

import { buildCommandEnvelope } from '../command-helpers';

/** JSON representation of a signed 64-bit integer; never deserialize as number. */
export type Int64String = string;

export namespace CloudMoldWarehouseProcurementApi {
  export interface ReceiptPageParams extends PageParam {
    keyword?: string;
    procurementOrderId?: string;
    receiptId?: string;
    receiptNo?: string;
    status?: string;
    supplierId?: string;
    warehouseId?: string;
  }

  export interface ReceiptPageItem {
    asnId: string;
    createdAt: string;
    lineCount: Int64String;
    procurementOrderId: string;
    receiptId: string;
    receiptNo: string;
    status: string;
    supplierId: string;
    totalAcceptedQuantity: string;
    totalPendingQualityQuantity: string;
    totalPutawayQuantity: string;
    totalQuarantinedQuantity: string;
    totalReceivedQuantity: string;
    totalRejectedQuantity: string;
    updatedAt: string;
    version: number;
    warehouseId: string;
  }

  export interface PutawayPageParams extends PageParam {
    keyword?: string;
    procurementOrderId?: string;
    receiptId?: string;
    status?: string;
    warehouseId?: string;
  }

  export interface PutawayPageItem {
    createdAt: string;
    lineCount: Int64String;
    procurementOrderId: string;
    putawayId: string;
    receiptId: string;
    receiptNo: string;
    status: string;
    supplierId: string;
    totalPutawayQuantity: string;
    updatedAt: string;
    version: number;
    warehouseId: string;
  }

  export interface PutawayLine {
    baseUomCode: string;
    canonicalSkuId: string;
    createdAt: string;
    cumulativePutawayQuantity: string;
    inventoryMovementGroupId: string;
    inventoryOperationId: Int64String;
    inventoryTargetBalanceId: string;
    inventoryLedgerTransactionId: Int64String;
    lotId?: string;
    ownerId: string;
    ownerType: string;
    putawayLineId: string;
    putawayQuantity: string;
    receiptLineId: string;
    sourceLocationId: string;
    status: string;
    targetLocationId: string;
    updatedAt: string;
    version: number;
  }

  export interface PutawayDetail extends Omit<
    PutawayPageItem,
    'lineCount' | 'totalPutawayQuantity'
  > {
    lines: PutawayLine[];
  }

  export interface ReceiptLine {
    acceptedQuantity: string;
    asnLineId: string;
    baseUomCode: string;
    canonicalSkuId: string;
    cumulativePutawayQuantity: string;
    currencyCode: string;
    deliveryScheduleId: string;
    financeReceiptEvidenceId: string;
    financeReceiptEvidenceOperationId: Int64String;
    financeReceiptEvidenceVersion: number;
    fulfillmentVersionAfter: number;
    fulfillmentVersionBefore: number;
    inventoryBalanceId: string;
    inventoryLedgerTxId: Int64String;
    inventoryOperationId: Int64String;
    lineNo: number;
    lotId?: string;
    movementCostAmountMinor: Int64String;
    ownerId: string;
    ownerType: string;
    pendingQualityQuantity: string;
    poReleaseVersion: number;
    procurementOrderItemId: string;
    qualityInspectionId?: string;
    qualityStatus: string;
    quarantinedQuantity: string;
    receiptLineId: string;
    receiptLocationId: string;
    receivedQuantity: string;
    roundingPolicyCode: string;
    rejectedQuantity: string;
    supplierId: string;
    tolerancePolicyHash: string;
    tolerancePolicyVersion: string;
    unitCostAmountMinor: Int64String;
    valuationPolicyHash: string;
    valuationPolicyId: string;
    valuationPolicyVersion: string;
    version: number;
    warehouseId: string;
  }

  export interface ReceiptDetail {
    createdAt: string;
    lines: ReceiptLine[];
    receiptId: string;
    receiptNo: string;
    remark?: string;
    status: string;
    version: number;
  }

  export interface AsnLine {
    allowedOverReceiptQuantity: string;
    asnLineId: string;
    baseUomCode: string;
    canonicalSkuId: string;
    currencyCode: string;
    deliveryScheduleId: string;
    fulfillmentVersion: number;
    lineNo: number;
    ownerId: string;
    ownerType: string;
    pendingQualityQuantity: string;
    poReleaseVersion: number;
    procurementOrderItemId: string;
    receiptLocationId: string;
    receivedQuantity: string;
    scheduledQuantity: string;
    status: string;
    supplierId: string;
    tolerancePolicyHash: string;
    tolerancePolicyVersion: string;
    unitCostAmountMinor: Int64String;
    valuationPolicyHash: string;
    valuationPolicyId: string;
    valuationPolicyVersion: string;
    warehouseId: string;
  }

  export interface ReceiptProgress {
    asnId: string;
    asnNo: string;
    asnStatus: string;
    asnVersion: number;
    lines: AsnLine[];
    nextWaitingEventCode: string;
    nextWaitingEventLabel: string;
    procurementOrderId: string;
    receiptCount: number;
    receipts: ReceiptDetail[];
    supplierId: string;
    terminal: boolean;
    totalPendingQualityQuantity: string;
    totalReceivedQuantity: string;
    totalScheduledQuantity: string;
    warehouseId: string;
  }

  export interface PartialReceiptLineInput {
    asnLine: AsnLine;
    lotId?: string;
    qualityInspectionId?: string;
    receivedQuantity: string;
  }

  export interface PartialReceiptInput {
    lines: PartialReceiptLineInput[];
    progress: ReceiptProgress;
    receiptNo: string;
    remark?: string;
  }

  export interface PutawayLineInput {
    quantity: string;
    receiptLine: ReceiptLine;
    targetLocationId: string;
  }

  export interface PutawayInput {
    lines: PutawayLineInput[];
    receipt: ReceiptDetail;
  }

  export interface CommandResult {
    aggregateVersion: number;
    asnId: string;
    asnNo: string;
    asnStatus: string;
    duplicate: boolean;
    operationId: Int64String;
    processedLineCount: number;
    procurementOrderId: string;
    putawayId?: string;
    receiptId?: string;
    receiptNo?: string;
    receiptStatus?: string;
    status: string;
  }
}

const ROOT = '/cloudmold/warehouse/inbound';

export function getProcurementReceiptPage(
  params: CloudMoldWarehouseProcurementApi.ReceiptPageParams,
) {
  return requestClient.get<
    PageResult<CloudMoldWarehouseProcurementApi.ReceiptPageItem>
  >(`${ROOT}/receipts/page`, { params });
}

export function getProcurementReceipt(receiptId: string) {
  return requestClient.get<CloudMoldWarehouseProcurementApi.ReceiptDetail>(
    `${ROOT}/receipts/get`,
    { params: { receiptId } },
  );
}

export function getProcurementReceiptProgress(procurementOrderId: string) {
  return requestClient.get<CloudMoldWarehouseProcurementApi.ReceiptProgress>(
    `${ROOT}/receipts/progress`,
    { params: { procurementOrderId } },
  );
}

export function getProcurementPutawayPage(
  params: CloudMoldWarehouseProcurementApi.PutawayPageParams,
) {
  return requestClient.get<
    PageResult<CloudMoldWarehouseProcurementApi.PutawayPageItem>
  >(`${ROOT}/putaways/page`, { params });
}

export function getProcurementPutaway(putawayId: string) {
  return requestClient.get<CloudMoldWarehouseProcurementApi.PutawayDetail>(
    `${ROOT}/putaways/get`,
    { params: { putawayId } },
  );
}

export function recordPartialProcurementReceipt(
  input: CloudMoldWarehouseProcurementApi.PartialReceiptInput,
) {
  const { progress } = input;
  return requestClient.post<CloudMoldWarehouseProcurementApi.CommandResult>(
    `${ROOT}/receipts/partial-receive`,
    {
      ...buildCommandEnvelope(),
      operation: 'COMPLETE_RECEIPT',
      receipt: {
        asnId: progress.asnId,
        lines: input.lines.map(({ asnLine, ...line }, index) => ({
          asnLineId: asnLine.asnLineId,
          baseUomCode: asnLine.baseUomCode,
          canonicalSkuId: asnLine.canonicalSkuId,
          deliveryScheduleId: asnLine.deliveryScheduleId,
          expectedFulfillmentVersion: asnLine.fulfillmentVersion,
          lineNo: index + 1,
          lotId: line.lotId,
          ownerId: asnLine.ownerId,
          ownerType: asnLine.ownerType,
          poReleaseVersion: asnLine.poReleaseVersion,
          procurementOrderId: progress.procurementOrderId,
          procurementOrderItemId: asnLine.procurementOrderItemId,
          qualityInspectionId: line.qualityInspectionId,
          qualityStatus: 'PENDING_QUALITY',
          receiptLocationId: asnLine.receiptLocationId,
          receivedQuantity: line.receivedQuantity,
          supplierId: progress.supplierId,
          tolerancePolicyHash: asnLine.tolerancePolicyHash,
          tolerancePolicyVersion: asnLine.tolerancePolicyVersion,
          warehouseId: progress.warehouseId,
        })),
        procurementOrderId: progress.procurementOrderId,
        receiptNo: input.receiptNo,
        remark: input.remark,
        supplierId: progress.supplierId,
        warehouseId: progress.warehouseId,
      },
    },
  );
}

export function putawayProcurementReceipt(
  input: CloudMoldWarehouseProcurementApi.PutawayInput,
) {
  const firstLine = input.lines[0]?.receiptLine;
  if (!firstLine) throw new Error('收货单至少需要一条收货行');
  return requestClient.post<CloudMoldWarehouseProcurementApi.CommandResult>(
    `${ROOT}/putaways/command`,
    {
      ...buildCommandEnvelope(),
      operation: 'COMPLETE_PUTAWAY',
      putaway: {
        expectedVersion: input.receipt.version,
        lines: input.lines.map(
          ({ quantity, receiptLine, targetLocationId }) => ({
            expectedReceiptLineVersion: receiptLine.version,
            lotId: receiptLine.lotId,
            quantity,
            receiptLineId: receiptLine.receiptLineId,
            sourceLocationId: receiptLine.receiptLocationId,
            targetLocationId,
          }),
        ),
        receiptId: input.receipt.receiptId,
        warehouseId: firstLine.warehouseId,
      },
    },
  );
}
