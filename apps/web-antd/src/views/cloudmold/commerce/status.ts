/**
 * CloudMold 交易与履约域（Listing / Order / Payment / Fulfillment / AfterSale）
 * 共享的状态颜色解析。
 *
 * 沿用原 commerce 聚合页的 success / warning 状态集合 + FAIL / ERROR 子串判定，
 * 拆分为独立子页后保持行为一致：未命中任何集合时统一显示为 processing（进行中），
 * 不把未知状态伪装成绿色或错误。
 */
const successStates = new Set([
  'CAPTURED',
  'COMPLETED',
  'DELIVERED',
  'PUBLISHED',
  'REFUNDED',
  'RESOLVED',
]);

const warningStates = new Set([
  'CANCELLED',
  'REJECTED',
  'RETURNED',
  'SUSPENDED',
  'UNPUBLISHED',
]);

export function commerceStatusColor(status: unknown): string {
  const value = String(status ?? 'UNKNOWN');
  if (successStates.has(value)) return 'success';
  if (warningStates.has(value)) return 'warning';
  if (value.includes('FAIL') || value.includes('ERROR')) return 'error';
  return 'processing';
}
