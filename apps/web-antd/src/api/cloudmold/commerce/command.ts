import { requestClient } from '#/api/request';

import { buildCommandEnvelopeWithRunId } from '../command-helpers';

/**
 * CloudMold commerce 三领域（fulfillment/order/aftersale）写命令。
 * 后端 CQRS：POST /cloudmold/{module}/command + operation 枚举 + 扁平 DTO（无内嵌 aggregate）。
 * envelope 强制 operation/idempotencyKey/runId/occurredAt/correlationId。
 * expectedVersion 从列表 row.aggregateVersion 回传（乐观锁 CAS）。
 */

/** Fulfillment 履约状态转换 operation（对齐后端 FulfillmentOperation） */
export const FulfillmentOperation = {
  DELIVER: 'DELIVER',
  MARK_IN_TRANSIT: 'MARK_IN_TRANSIT',
  SHIP: 'SHIP',
} as const;

/** Order 订单状态转换 operation（对齐后端 OrderOperation） */
export const OrderOperation = {
  COMPLETE: 'COMPLETE',
  COMPLETE_AFTER_DELIVERY: 'COMPLETE_AFTER_DELIVERY',
  CONFIRM_INVENTORY: 'CONFIRM_INVENTORY',
} as const;

/** AfterSale 售后状态转换 operation（对齐后端 AfterSaleOperation） */
export const AfterSaleOperation = {
  APPROVE: 'APPROVE',
} as const;

export namespace CloudMoldCommerceCommandApi {
  export interface CommandResult {
    aggregateId: string;
    aggregateType: string;
    aggregateVersion: number;
    duplicate: boolean;
    operationId: number;
    status: string;
  }
}

/** 通用扁平 command 发送：补全 envelope（含 runId）+ 业务 payload */
function sendCommerceCommand(
  endpoint: string,
  payload: Record<string, unknown>,
) {
  const envelope = buildCommandEnvelopeWithRunId();
  return requestClient.post<CloudMoldCommerceCommandApi.CommandResult>(
    endpoint,
    { ...envelope, ...payload },
  );
}

/** Fulfillment 标记在途：SHIPPED → IN_TRANSIT */
export function markFulfillmentInTransit(
  fulfillmentId: string,
  expectedVersion: number,
) {
  return sendCommerceCommand('/cloudmold/fulfillment/command', {
    expectedVersion,
    fulfillmentId,
    operation: FulfillmentOperation.MARK_IN_TRANSIT,
  });
}

/** Fulfillment 投递完成：IN_TRANSIT → DELIVERED */
export function deliverFulfillment(
  fulfillmentId: string,
  expectedVersion: number,
) {
  return sendCommerceCommand('/cloudmold/fulfillment/command', {
    expectedVersion,
    fulfillmentId,
    operation: FulfillmentOperation.DELIVER,
  });
}

/** Fulfillment 发货：CREATED → SHIPPED，承运商与运单号写入后不可变。 */
export function shipFulfillment(
  fulfillmentId: string,
  expectedVersion: number,
  carrierCode: string,
  waybillNo: string,
) {
  return sendCommerceCommand('/cloudmold/fulfillment/command', {
    carrierCode,
    expectedVersion,
    fulfillmentId,
    operation: FulfillmentOperation.SHIP,
    waybillNo,
  });
}

/** Order 库存预占确认：PLACED → INVENTORY_RESERVED */
export function confirmOrderInventory(
  orderId: string,
  expectedVersion: number,
) {
  return sendCommerceCommand('/cloudmold/order/command', {
    expectedVersion,
    operation: OrderOperation.CONFIRM_INVENTORY,
    orderId,
  });
}

/** Order 完成（非 listing 单）：SHIPPED → COMPLETED */
export function completeOrder(orderId: string, expectedVersion: number) {
  return sendCommerceCommand('/cloudmold/order/command', {
    expectedVersion,
    operation: OrderOperation.COMPLETE,
    orderId,
  });
}

/** Listing-backed Order 完成：SHIPPED → COMPLETED，后端校验绑定履约单已送达。 */
export function completeOrderAfterDelivery(
  orderId: string,
  expectedVersion: number,
) {
  return sendCommerceCommand('/cloudmold/order/command', {
    expectedVersion,
    operation: OrderOperation.COMPLETE_AFTER_DELIVERY,
    orderId,
  });
}

/** AfterSale 审核通过：REQUESTED → APPROVED（reviewerId 为当前管理员 principal） */
export function approveAfterSale(
  afterSaleId: string,
  expectedVersion: number,
  reviewerId: string,
) {
  return sendCommerceCommand('/cloudmold/aftersale/command', {
    afterSaleId,
    expectedVersion,
    operation: AfterSaleOperation.APPROVE,
    reviewerId,
  });
}

/** Listing 上架状态转换 operation（对齐后端 ListingOperation，CREATE_DRAFT 非转换不入） */
export const ListingOperation = {
  APPROVE_BUSINESS: 'APPROVE_BUSINESS',
  APPROVE_RISK: 'APPROVE_RISK',
  ARCHIVE: 'ARCHIVE',
  PASS_COMPLETION: 'PASS_COMPLETION',
  PUBLISH: 'PUBLISH',
  REJECT_BUSINESS: 'REJECT_BUSINESS',
  REJECT_COMPLETION: 'REJECT_COMPLETION',
  REJECT_RISK: 'REJECT_RISK',
  REVISE: 'REVISE',
  SUBMIT: 'SUBMIT',
  SUSPEND: 'SUSPEND',
  UNPUBLISH: 'UNPUBLISH',
} as const;

/** 通用 listing 状态转换（无额外入参的 10 个 op） */
function listingTransition(
  operation: string,
  listingId: string,
  expectedVersion: number,
) {
  return sendCommerceCommand('/cloudmold/listing/command', {
    expectedVersion,
    listingId,
    operation,
  });
}

/** 提交审核：DRAFT → SUBMITTED */
export const submitListing = (id: string, v: number) =>
  listingTransition(ListingOperation.SUBMIT, id, v);
/** 通过完备性：SUBMITTED → COMPLETION_PASSED */
export const passCompletionListing = (id: string, v: number) =>
  listingTransition(ListingOperation.PASS_COMPLETION, id, v);
/** 通过业务审核：COMPLETION_PASSED → BUSINESS_APPROVED */
export const approveBusinessListing = (id: string, v: number) =>
  listingTransition(ListingOperation.APPROVE_BUSINESS, id, v);
/** 通过风控审核：BUSINESS_APPROVED → RISK_APPROVED */
export const approveRiskListing = (id: string, v: number) =>
  listingTransition(ListingOperation.APPROVE_RISK, id, v);
/** 驳回完备性：SUBMITTED → REJECTED */
export const rejectCompletionListing = (id: string, v: number) =>
  listingTransition(ListingOperation.REJECT_COMPLETION, id, v);
/** 驳回业务：COMPLETION_PASSED → REJECTED */
export const rejectBusinessListing = (id: string, v: number) =>
  listingTransition(ListingOperation.REJECT_BUSINESS, id, v);
/** 驳回风控：BUSINESS_APPROVED → REJECTED */
export const rejectRiskListing = (id: string, v: number) =>
  listingTransition(ListingOperation.REJECT_RISK, id, v);
/** 修订：REJECTED → DRAFT（revision+1） */
export const reviseListing = (id: string, v: number) =>
  listingTransition(ListingOperation.REVISE, id, v);
/** 下架：PUBLISHED → UNPUBLISHED */
export const unpublishListing = (id: string, v: number) =>
  listingTransition(ListingOperation.UNPUBLISH, id, v);
/** 归档：DRAFT/REJECTED/UNPUBLISHED/SUSPENDED → ARCHIVED */
export const archiveListing = (id: string, v: number) =>
  listingTransition(ListingOperation.ARCHIVE, id, v);

/**
 * 发布：RISK_APPROVED/UNPUBLISHED/SUSPENDED → PUBLISHED。
 * publisherRef 首次必填；不传时后端复用 header 已存的 publisherRef。
 */
export function publishListing(
  listingId: string,
  expectedVersion: number,
  publisherRef?: string,
) {
  return sendCommerceCommand('/cloudmold/listing/command', {
    expectedVersion,
    listingId,
    operation: ListingOperation.PUBLISH,
    ...(publisherRef ? { publisherRef } : {}),
  });
}

/** 暂停：PUBLISHED → SUSPENDED（reason 必填，≤256） */
export function suspendListing(
  listingId: string,
  expectedVersion: number,
  reason: string,
) {
  return sendCommerceCommand('/cloudmold/listing/command', {
    expectedVersion,
    listingId,
    operation: ListingOperation.SUSPEND,
    reason,
  });
}
