import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

import { buildCommandEnvelope } from '../command-helpers';

/** JSON representation of a signed 64-bit integer; never deserialize as number. */
export type Int64String = string;

export namespace CloudMoldProcurementQualityApi {
  export interface PageParams extends PageParam {
    ownerId?: string;
    purchaseOrderId?: string;
    receiptId?: string;
    status?: string;
    supplierId?: string;
  }

  export interface PageItem {
    acceptedQuantity: string;
    businessNo: string;
    completedAt?: string;
    finalDecision?: string;
    inspectionCode: string;
    inspectionId: string;
    ownerId: string;
    ownerType: string;
    purchaseOrderId: string;
    quarantinedQuantity: string;
    receiptId: string;
    receivedQuantity: string;
    rejectedQuantity: string;
    sampledQuantity: string;
    status: string;
    supplierId: string;
    updatedAt: string;
    version: number;
  }

  export interface Defect {
    affectedQuantity: string;
    defectCategory: string;
    defectCode: string;
    defectId: string;
    evidenceRef?: string;
    evidenceSha256: string;
    severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  }

  export interface ResultSplit {
    acceptedDispositionCode?: string;
    acceptedFinanceInventoryEvidenceId?: string;
    acceptedFinanceInventoryEvidenceVersion?: number;
    acceptedFinanceInventoryOperationId?: Int64String;
    acceptedInventoryAggregateVersion?: number;
    acceptedInventoryOperationId?: Int64String;
    acceptedLedgerTransactionId?: Int64String;
    acceptedQuantity: string;
    acceptedWarehouseOperationId?: Int64String;
    acceptedWarehouseReceiptLineVersion?: number;
    acceptedWarehouseReceiptVersion?: number;
    acceptedWarehouseScheduleFulfillmentVersion?: number;
    actorPrincipalId: string;
    decisionEvidenceSha256: string;
    decisionVersion: number;
    defects: Defect[];
    evidenceRef?: string;
    financeQualityEvidenceId?: string;
    financeQualityEvidenceVersion?: number;
    financeQualityOperationId?: Int64String;
    financeReceiptEvidenceId?: string;
    financeReceiptEvidenceOperationId?: Int64String;
    financeReceiptEvidenceVersion?: number;
    inspectionLineId: string;
    inspectionSplitId: string;
    occurredAt: string;
    operationId: Int64String;
    quarantineDispositionCode?: string;
    quarantinedFinanceInventoryEvidenceId?: string;
    quarantinedFinanceInventoryEvidenceVersion?: number;
    quarantinedFinanceInventoryOperationId?: Int64String;
    quarantinedInventoryAggregateVersion?: number;
    quarantinedInventoryOperationId?: Int64String;
    quarantinedLedgerTransactionId?: Int64String;
    quarantinedQuantity: string;
    quarantinedWarehouseOperationId?: Int64String;
    quarantinedWarehouseReceiptLineVersion?: number;
    quarantinedWarehouseReceiptVersion?: number;
    quarantinedWarehouseScheduleFulfillmentVersion?: number;
    qualityDecisionId: string;
    rejectedDispositionCode?: string;
    rejectedFinanceInventoryEvidenceId?: string;
    rejectedFinanceInventoryEvidenceVersion?: number;
    rejectedFinanceInventoryOperationId?: Int64String;
    rejectedInventoryAggregateVersion?: number;
    rejectedInventoryOperationId?: Int64String;
    rejectedLedgerTransactionId?: Int64String;
    rejectedQuantity: string;
    rejectedWarehouseOperationId?: Int64String;
    rejectedWarehouseReceiptLineVersion?: number;
    rejectedWarehouseReceiptVersion?: number;
    rejectedWarehouseScheduleFulfillmentVersion?: number;
    resultSplitId: string;
    sampledQuantity: string;
  }

  export interface ResultBatch {
    actorPrincipalId: string;
    decisionVersion: number;
    inspectionVersionAfter: number;
    inspectionVersionBefore: number;
    occurredAt: string;
    operationId: Int64String;
    resultBatchId: string;
    splits: ResultSplit[];
  }

  export interface InspectionSplit {
    acceptedQuantity: string;
    inspectionSplitId: string;
    locationId: string;
    lotId?: string;
    quarantinedQuantity: string;
    receivedQuantity: string;
    rejectedQuantity: string;
    sampledQuantity: string;
    splitNumber: number;
    status: string;
    uomCode: string;
    version: number;
    warehouseId: string;
  }

  export interface InspectionLine {
    acceptedQuantity: string;
    canonicalSkuId: string;
    currencyCode: string;
    inspectionLineId: string;
    itemId: string;
    lineNumber: number;
    ownerId: string;
    ownerType: string;
    purchaseOrderId: string;
    quarantinedQuantity: string;
    receiptLineId: string;
    receivedQuantity: string;
    rejectedQuantity: string;
    sampledQuantity: string;
    scheduleId: string;
    splits: InspectionSplit[];
    status: string;
    supplierId: string;
    unitCostAmountMinor: Int64String;
    uomCode: string;
    valuationPolicy: string;
    valuationPolicyHash: string;
    valuationPolicyVersion: string;
    version: number;
  }

  export interface Detail extends PageItem {
    completedByPrincipalId?: string;
    createdByPrincipalId: string;
    lastDecisionActorPrincipalId?: string;
    lines: InspectionLine[];
    resultBatches: ResultBatch[];
    standardContentSha256: string;
    standardId: string;
    standardVersion: number;
    standardVersionId: string;
  }

  export interface DefectInput {
    affectedQuantity: string;
    defectCategory: string;
    defectCode: string;
    defectId?: string;
    evidenceRef?: string;
    evidenceSha256: string;
    severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  }

  export interface RecordResultInput {
    acceptedDispositionCode?: string;
    acceptedQuantity: string;
    decisionEvidenceSha256: string;
    defects: DefectInput[];
    evidenceRef?: string;
    expectedInspectionVersion: number;
    expectedLineVersion: number;
    expectedSplitVersion: number;
    inspectionId: string;
    inspectionLineId: string;
    inspectionSplitId: string;
    quarantineDispositionCode?: string;
    quarantinedQuantity: string;
    rejectedDispositionCode?: string;
    rejectedQuantity: string;
    sampledQuantity: string;
  }

  export interface CommandResult {
    acceptedQuantity: string;
    aggregateVersion: number;
    duplicate: boolean;
    finalDecision?: string;
    inspectionId: string;
    operationId: Int64String;
    quarantinedQuantity: string;
    receivedQuantity: string;
    rejectedQuantity: string;
    sampledQuantity: string;
    status: string;
  }
}

const ROOT = '/cloudmold/quality/procurement-receipt-inspections';

export function getProcurementReceiptInspectionPage(
  params: CloudMoldProcurementQualityApi.PageParams,
) {
  return requestClient.get<PageResult<CloudMoldProcurementQualityApi.PageItem>>(
    `${ROOT}/page`,
    { params },
  );
}

export function getProcurementReceiptInspection(inspectionId: string) {
  return requestClient.get<CloudMoldProcurementQualityApi.Detail>(
    `${ROOT}/${encodeURIComponent(inspectionId)}`,
  );
}

export function recordProcurementReceiptInspectionResult(
  input: CloudMoldProcurementQualityApi.RecordResultInput,
) {
  const { expectedInspectionVersion, ...values } = input;
  return requestClient.post<CloudMoldProcurementQualityApi.CommandResult>(
    `${ROOT}/command`,
    {
      ...buildCommandEnvelope(),
      expectedVersion: expectedInspectionVersion,
      inspectionId: values.inspectionId,
      operation: 'RECORD_LINE_RESULTS',
      results: {
        lines: [
          {
            expectedVersion: values.expectedLineVersion,
            inspectionLineId: values.inspectionLineId,
            splits: [
              {
                acceptedDispositionCode: values.acceptedDispositionCode,
                acceptedQuantity: values.acceptedQuantity,
                decisionEvidenceSha256: values.decisionEvidenceSha256,
                defects: values.defects,
                evidenceRef: values.evidenceRef,
                expectedVersion: values.expectedSplitVersion,
                inspectionSplitId: values.inspectionSplitId,
                quarantineDispositionCode: values.quarantineDispositionCode,
                quarantinedQuantity: values.quarantinedQuantity,
                qualityDecisionId: crypto.randomUUID(),
                rejectedDispositionCode: values.rejectedDispositionCode,
                rejectedQuantity: values.rejectedQuantity,
                resultSplitId: crypto.randomUUID(),
                sampledQuantity: values.sampledQuantity,
              },
            ],
          },
        ],
        resultBatchId: crypto.randomUUID(),
      },
    },
  );
}

export function completeProcurementReceiptInspection(
  inspectionId: string,
  expectedVersion: number,
) {
  return requestClient.post<CloudMoldProcurementQualityApi.CommandResult>(
    `${ROOT}/command`,
    {
      ...buildCommandEnvelope(),
      expectedVersion,
      inspectionId,
      operation: 'COMPLETE_INSPECTION',
    },
  );
}
