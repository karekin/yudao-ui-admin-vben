import { requestClient } from '#/api/request';

import { buildMerchantCommandEnvelope } from '../command-helpers';

/**
 * CloudMold merchant 写命令（商家/店铺状态转换）。
 * 后端 CQRS：POST /cloudmold/merchant/command + operation 枚举 + 扁平 DTO。
 * envelope 强制 runId + sourceSystem + traceId（buildMerchantCommandEnvelope 补全）。
 * expectedVersion 从列表 row.version 回传（注意 merchant/shop 的 version 字段名是 version，非 aggregateVersion）。
 */

/** Merchant 商家/店铺状态转换 operation（对齐后端 MerchantOperation） */
export const MerchantOperation = {
  ACTIVATE_MERCHANT: 'ACTIVATE_MERCHANT',
  ACTIVATE_SHOP: 'ACTIVATE_SHOP',
  PAUSE_SHOP: 'PAUSE_SHOP',
  RESUME_MERCHANT: 'RESUME_MERCHANT',
  RESUME_SHOP: 'RESUME_SHOP',
  SUSPEND_MERCHANT: 'SUSPEND_MERCHANT',
} as const;

export namespace CloudMoldMerchantCommandApi {
  export interface CommandResult {
    duplicate: boolean;
    operationId: number;
  }
}

function sendMerchantCommand(payload: Record<string, unknown>) {
  const envelope = buildMerchantCommandEnvelope();
  return requestClient.post<CloudMoldMerchantCommandApi.CommandResult>(
    '/cloudmold/merchant/command',
    { ...envelope, ...payload },
  );
}

/** 激活商家：PENDING_ACTIVATION → ACTIVE */
export function activateMerchant(merchantId: string, expectedVersion: number) {
  return sendMerchantCommand({
    expectedVersion,
    merchantId,
    operation: MerchantOperation.ACTIVATE_MERCHANT,
  });
}

/** 恢复商家：SUSPENDED → ACTIVE */
export function resumeMerchant(merchantId: string, expectedVersion: number) {
  return sendMerchantCommand({
    expectedVersion,
    merchantId,
    operation: MerchantOperation.RESUME_MERCHANT,
  });
}

/** 激活店铺：DRAFT → ACTIVE（要求所属商家已 ACTIVE） */
export function activateShop(shopId: string, expectedVersion: number) {
  return sendMerchantCommand({
    expectedVersion,
    operation: MerchantOperation.ACTIVATE_SHOP,
    shopId,
  });
}

/** 恢复店铺：PAUSED → ACTIVE */
export function resumeShop(shopId: string, expectedVersion: number) {
  return sendMerchantCommand({
    expectedVersion,
    operation: MerchantOperation.RESUME_SHOP,
    shopId,
  });
}

/** 停用商家：ACTIVE/RESTRICTED → SUSPENDED；会触发 Listing 物理下架 Saga。 */
export function suspendMerchant(
  merchantId: string,
  expectedVersion: number,
  reason: string,
) {
  return sendMerchantCommand({
    expectedVersion,
    merchantId,
    operation: MerchantOperation.SUSPEND_MERCHANT,
    reason,
  });
}

/** 暂停店铺：ACTIVE → PAUSED；恢复营业不会自动重新上架 Listing。 */
export function pauseShop(
  shopId: string,
  expectedVersion: number,
  reason: string,
) {
  return sendMerchantCommand({
    expectedVersion,
    operation: MerchantOperation.PAUSE_SHOP,
    reason,
    shopId,
  });
}
