import { describe, expect, it } from 'vitest';

import {
  canReleaseAwardToPurchaseOrders,
  formatMinorMoney,
  procurementActions,
} from './presentation';

describe('procurement presentation', () => {
  it('exposes only legal final-state actions', () => {
    expect(procurementActions('REQUISITION', 'DRAFT')).toEqual([]);
    expect(procurementActions('AWARD', 'DRAFT')).toEqual([
      {
        label: '提交定标',
        operation: 'SUBMIT_AWARD',
        permission: 'cloudmold:procurement:award:submit',
      },
    ]);
    expect(procurementActions('QUOTATION', 'SUBMITTED')).toEqual([]);
  });

  it('maps purchase-order lifecycle actions to exact permissions', () => {
    expect(procurementActions('PURCHASE_ORDER', 'APPROVED')[0]).toEqual({
      label: '生效订单',
      operation: 'RELEASE_PURCHASE_ORDER',
      permission: 'cloudmold:procurement:order:release',
    });
    expect(procurementActions('PURCHASE_ORDER', 'RELEASED')[0]).toEqual({
      label: '发送供应商',
      operation: 'DISPATCH_PURCHASE_ORDER',
      permission: 'cloudmold:procurement:order:write',
    });
    expect(procurementActions('PURCHASE_ORDER', 'DISPATCHED')[0]).toEqual({
      label: '供应商确认',
      operation: 'SUPPLIER_CONFIRM_PURCHASE_ORDER',
      permission: 'cloudmold:procurement:order:write',
    });
  });

  it('requires explicit reason codes for rejection and cancellation', () => {
    expect(procurementActions('AWARD', 'SUBMITTED')[1]).toEqual({
      danger: true,
      label: '驳回定标',
      operation: 'REJECT_AWARD',
      permission: 'cloudmold:procurement:award:approve',
      reasonRequired: true,
    });
    expect(procurementActions('RFQ', 'QUOTING')[1]?.reasonRequired).toBe(true);
    expect(procurementActions('PURCHASE_ORDER', 'DRAFT')[1]?.operation).toBe(
      'CANCEL_PURCHASE_ORDER',
    );
  });

  it('allows award release only for approved snapshots without purchase orders', () => {
    expect(
      canReleaseAwardToPurchaseOrders({
        purchaseOrderCount: 0,
        status: 'APPROVED',
      }),
    ).toBe(true);
    expect(
      canReleaseAwardToPurchaseOrders({
        purchaseOrderCount: 1,
        status: 'APPROVED',
      }),
    ).toBe(false);
    expect(
      canReleaseAwardToPurchaseOrders({
        purchaseOrderCount: 0,
        status: 'SUBMITTED',
      }),
    ).toBe(false);
  });

  it('formats minor-unit money without changing authority', () => {
    expect(formatMinorMoney('123456', 'CNY')).toBe('¥1,234.56');
    expect(formatMinorMoney('900719925474099399', 'CNY')).toBe(
      '¥9,007,199,254,740,993.99',
    );
  });
});
