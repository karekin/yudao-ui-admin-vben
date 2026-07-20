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
} as const;

/** Order 订单状态转换 operation（对齐后端 OrderOperation） */
export const OrderOperation = {
  COMPLETE: 'COMPLETE',
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
