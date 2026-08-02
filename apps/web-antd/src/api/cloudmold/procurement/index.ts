import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

import { buildCommandEnvelopeWithRunId } from '../command-helpers';

/** JSON representation of a signed 64-bit integer; never deserialize as number. */
export type Int64String = string;

export namespace CloudMoldProcurementApi {
  export type ProcurementWorkspace =
    | 'AWARD'
    | 'PURCHASE_ORDER'
    | 'QUOTATION'
    | 'REQUISITION'
    | 'RFQ';

  export interface PageParams extends PageParam {
    keyword?: string;
    status?: string;
  }

  export interface Quantity {
    quantity: string;
    uomCode: string;
  }

  export interface Money {
    amountMinor: Int64String;
    currencyCode: string;
  }

  /** A typed, immutable lineage edge between procurement documents. */
  export interface Lineage {
    awardId?: string;
    awardLineId?: string;
    purchaseOrderId?: string;
    purchaseOrderItemId?: string;
    quotationId?: string;
    quotationLineId?: string;
    requisitionId: string;
    requisitionLineId: string;
    requisitionScheduleId?: string;
    sourcingEventId?: string;
    sourcingLineId?: string;
  }

  export interface RequisitionPageItem {
    aggregateVersion: number;
    approvedAt?: string;
    lineCount: number;
    requisitionCode: string;
    requisitionId: string;
    requestedByPrincipalId: string;
    requiredDeliveryDate?: string;
    status: string;
    submittedAt?: string;
    totalRequestedQuantity: string;
    uomCode: string;
    updatedAt: string;
  }

  export interface RfqPageItem {
    aggregateVersion: number;
    eventCode: string;
    eventId: string;
    invitationCount: number;
    lineCount: number;
    quotationDeadline: string;
    quotationRevisionCount: number;
    requisitionCode: string;
    requisitionId: string;
    status: string;
    title: string;
    updatedAt: string;
  }

  export interface QuotationPageItem {
    aggregateVersion: number;
    currencyCode: string;
    eventCode: string;
    eventId: string;
    grossAmountMinor: Int64String;
    lineCount: number;
    quotationCode: string;
    quotationId: string;
    revisionNumber: number;
    status: string;
    supplierId: string;
    submittedAt?: string;
    updatedAt: string;
  }

  export interface AwardPageItem {
    aggregateVersion: number;
    awardCode: string;
    awardId: string;
    awardedQuantity: string;
    eventCode: string;
    eventAggregateVersion: number;
    eventId: string;
    lineCount: number;
    purchaseOrderCount: number;
    status: string;
    supplierCount: number;
    updatedAt: string;
  }

  export interface AwardLine {
    awardLineId: string;
    awardedGrossAmountMinor: Int64String;
    awardedQuantity: string;
    canonicalSkuId: string;
    lineNumber: number;
    lineage: Lineage;
    promisedDeliveryDate: string;
    quotationId: string;
    quotationLineId: string;
    quotationRevisionNumber: number;
    requisitionLineId: string;
    score: string;
    sourcingLineId: string;
    supplierId: string;
    unitNetPriceMinor: string;
    uomCode: string;
  }

  export interface AwardDetail extends AwardPageItem {
    approvedAt?: string;
    approvedGrossAmountMinor: Int64String;
    awardedNetAmountMinor: Int64String;
    awardedTaxAmountMinor: Int64String;
    currencyCode: string;
    decisionReasonCode: string;
    lines: AwardLine[];
    quotationDeadline: string;
    reviewPolicyCode: string;
    statusHistory: StatusHistory[];
    submittedAt?: string;
  }

  export interface ReleasedPurchaseOrderSummary {
    aggregateVersion: number;
    currencyCode: string;
    grossAmountMinor: Int64String;
    lineCount: number;
    orderCode: string;
    orderId: string;
    status: string;
    supplierId: string;
  }

  export interface PurchaseOrderPageItem {
    aggregateVersion: number;
    awardCode?: string;
    awardId?: string;
    currencyCode: string;
    grossAmountMinor: Int64String;
    lineCount: number;
    orderCode: string;
    orderId: string;
    orderedQuantity: string;
    qualifiedQuantity: string;
    receivedQuantity: string;
    scheduleCount: number;
    status: string;
    supplierId: string;
    updatedAt: string;
  }

  export interface PurchaseOrderSchedule {
    canonicalWarehouseId: string;
    qualifiedQuantity: string;
    receivedQuantity: string;
    requiredDeliveryDate: string;
    scheduleId: string;
    scheduleNumber: number;
    scheduledQuantity: string;
  }

  export interface PurchaseOrderLine {
    canonicalSkuId: string;
    invoicedQuantity: string;
    itemId: string;
    lineGrossAmountMinor: Int64String;
    lineNetAmountMinor: Int64String;
    lineNumber: number;
    lineTaxAmountMinor: Int64String;
    lineage: Lineage;
    orderedQuantity: string;
    qualifiedQuantity: string;
    receivedQuantity: string;
    returnedQuantity: string;
    schedules: PurchaseOrderSchedule[];
    taxCode: string;
    taxRateBps: number;
    unitNetPriceMinor: string;
    uomCode: string;
    valuationPolicyHash: string;
    valuationPolicyId: string;
    valuationPolicyVersion: string;
  }

  export interface StatusHistory {
    actorPrincipalId: string;
    changedAt: string;
    fromStatus?: string;
    reasonCode?: string;
    statusVersion: number;
    toStatus: string;
  }

  export interface PurchaseOrderDetail extends PurchaseOrderPageItem {
    headerNetAmountMinor: Int64String;
    headerTaxAmountMinor: Int64String;
    issuedAt?: string;
    legalEntityId: string;
    lines: PurchaseOrderLine[];
    sourceBusinessRef: string;
    sourceBusinessType: string;
    statusHistory: StatusHistory[];
    supplierAcknowledgedAt?: string;
  }

  export type AggregateType =
    | 'PURCHASE_AWARD'
    | 'PURCHASE_ORDER'
    | 'PURCHASE_QUOTATION'
    | 'PURCHASE_REQUISITION'
    | 'PURCHASE_SOURCING_EVENT';

  export interface CommandResult {
    aggregateId: string;
    aggregateType: AggregateType;
    aggregateVersion: number;
    duplicate: boolean;
    operationId: Int64String;
    purchaseOrderId?: string;
    status: string;
  }

  export interface ReleasePurchaseOrdersCommand {
    expectedAwardVersion: number;
  }

  export interface ReleasePurchaseOrdersResult {
    awardId: string;
    awardVersion: number;
    duplicate: boolean;
    operationId: Int64String;
    purchaseOrders: ReleasedPurchaseOrderSummary[];
    status: string;
  }

  export type PurchaseOrderOperation =
    (typeof PURCHASE_ORDER_OPERATIONS)[number];
  export type PurchaseOrderTransitionOperation = PurchaseOrderOperation;
  export type SourcingOperation = (typeof SOURCING_OPERATIONS)[number];
  export type SourcingEventTransitionOperation =
    | 'CANCEL_SOURCING_EVENT'
    | 'CLOSE_QUOTING'
    | 'CLOSE_SOURCING_EVENT'
    | 'OPEN_QUOTING'
    | 'PUBLISH_SOURCING_EVENT';
  export type SourcingAwardTransitionOperation =
    | 'APPROVE_AWARD'
    | 'REJECT_AWARD'
    | 'SUBMIT_AWARD';

  export interface PurchaseOrderTransitionCommand {
    operation: PurchaseOrderTransitionOperation;
    purchaseOrder: {
      expectedVersion: number;
      orderId: string;
      reasonCode?: string;
    };
  }

  export type SourcingTransitionCommand =
    | {
        awardTransition: {
          awardId: string;
          expectedAwardVersion: number;
          expectedEventVersion: number;
          reasonCode?: string;
        };
        operation: SourcingAwardTransitionOperation;
      }
    | {
        eventTransition: {
          eventId: string;
          expectedVersion: number;
          reasonCode?: string;
        };
        operation: SourcingEventTransitionOperation;
      };
}

const ROOT = '/cloudmold/procurement';

export const PURCHASE_ORDER_OPERATIONS = [
  'SUBMIT_PURCHASE_ORDER',
  'APPROVE_PURCHASE_ORDER',
  'RELEASE_PURCHASE_ORDER',
  'DISPATCH_PURCHASE_ORDER',
  'SUPPLIER_CONFIRM_PURCHASE_ORDER',
  'CANCEL_PURCHASE_ORDER',
  'CLOSE_PURCHASE_ORDER',
] as const;

export const SOURCING_OPERATIONS = [
  'CREATE_SOURCING_EVENT',
  'PUBLISH_SOURCING_EVENT',
  'INVITE_SUPPLIER',
  'OPEN_QUOTING',
  'SUBMIT_QUOTATION_REVISION',
  'WITHDRAW_QUOTATION_REVISION',
  'CLOSE_QUOTING',
  'CREATE_EVALUATION_POLICY',
  'RECORD_EVALUATION_SCORE',
  'CREATE_AWARD_DRAFT',
  'SUBMIT_AWARD',
  'APPROVE_AWARD',
  'REJECT_AWARD',
  'CLOSE_SOURCING_EVENT',
  'CANCEL_SOURCING_EVENT',
] as const;

export function getPurchaseRequisitionPage(
  params: CloudMoldProcurementApi.PageParams,
) {
  return requestClient.get<
    PageResult<CloudMoldProcurementApi.RequisitionPageItem>
  >(`${ROOT}/purchase-requisitions/page`, { params });
}

export function getSourcingEventPage(
  params: CloudMoldProcurementApi.PageParams,
) {
  return requestClient.get<PageResult<CloudMoldProcurementApi.RfqPageItem>>(
    `${ROOT}/sourcing-events/page`,
    { params },
  );
}

export function getQuotationPage(params: CloudMoldProcurementApi.PageParams) {
  return requestClient.get<
    PageResult<CloudMoldProcurementApi.QuotationPageItem>
  >(`${ROOT}/quotations/page`, { params });
}

export function getPurchaseAwardPage(
  params: CloudMoldProcurementApi.PageParams,
) {
  return requestClient.get<PageResult<CloudMoldProcurementApi.AwardPageItem>>(
    `${ROOT}/awards/page`,
    { params },
  );
}

export function getPurchaseOrderPage(
  params: CloudMoldProcurementApi.PageParams,
) {
  return requestClient.get<
    PageResult<CloudMoldProcurementApi.PurchaseOrderPageItem>
  >(`${ROOT}/orders/page`, { params });
}

export function getPurchaseAward(awardId: string) {
  return requestClient.get<CloudMoldProcurementApi.AwardDetail>(
    `${ROOT}/awards/${encodeURIComponent(awardId)}`,
  );
}

export function getPurchaseOrder(orderId: string) {
  return requestClient.get<CloudMoldProcurementApi.PurchaseOrderDetail>(
    `${ROOT}/order/${encodeURIComponent(orderId)}`,
  );
}

export function executePurchaseOrderTransition(
  command: CloudMoldProcurementApi.PurchaseOrderTransitionCommand,
) {
  return requestClient.post<CloudMoldProcurementApi.CommandResult>(
    `${ROOT}/command`,
    { ...buildCommandEnvelopeWithRunId(), ...command },
  );
}

export function executeSourcingTransition(
  command: CloudMoldProcurementApi.SourcingTransitionCommand,
) {
  return requestClient.post<CloudMoldProcurementApi.CommandResult>(
    `${ROOT}/sourcing/command`,
    { ...buildCommandEnvelopeWithRunId(), ...command },
  );
}

export function releaseAwardPurchaseOrders(
  awardId: string,
  command: CloudMoldProcurementApi.ReleasePurchaseOrdersCommand,
) {
  return requestClient.post<CloudMoldProcurementApi.ReleasePurchaseOrdersResult>(
    `${ROOT}/awards/${encodeURIComponent(awardId)}/release-purchase-orders`,
    {
      ...buildCommandEnvelopeWithRunId(),
      causationId: crypto.randomUUID(),
      ...command,
    },
  );
}
