import { describe, expect, it } from 'vitest';

import { buildApprovalPresentation } from './approval-presentation';

describe('buildApprovalPresentation', () => {
  it('turns a catalog matrix snapshot into an approver-readable summary', () => {
    const result = buildApprovalPresentation({
      actionCode: 'auto-listing-hourly-v2',
      approvalId: 'approval-1',
      businessContextJson: JSON.stringify({
        definitions: [
          {
            barcode: 'BAR-BLACK-S',
            colorName: '黑色',
            planningCategoryRef: 'INTERNAL:CATEGORY:DRESS',
            planningYear: 2026,
            productName: '语兴好物连衣裙',
            seasonCode: 'SUMMER',
            sizeName: 'S',
            skuCode: 'YS-001-BLACK-S',
            spuCode: 'YS-001',
          },
          {
            barcode: 'BAR-WHITE-M',
            colorName: '白色',
            productName: '语兴好物连衣裙',
            sizeName: 'M',
            skuCode: 'YS-001-WHITE-M',
            spuCode: 'YS-001',
          },
        ],
        lifecycle: [{ action: 'ACTIVATE' }, { action: 'SUBMIT' }],
      }),
      requestedAt: '2026-07-26T10:00:00Z',
      riskLevel: 'R2',
      roleCode: 'merchandising',
      status: 'PENDING',
      title: 'Temporal scheduled write',
      workOrderId: 'wo-1',
    });

    expect(result).toMatchObject({
      actionTitle: '创建并启用新品“语兴好物连衣裙”',
      barcodeCount: 2,
      category: 'DRESS',
      colorNames: ['黑色', '白色'],
      lifecycleCount: 2,
      planningYear: 2026,
      sizeNames: ['S', 'M'],
      spuCode: 'YS-001',
    });
    expect(result?.skuRows).toHaveLength(2);
  });

  it('fails closed when the frozen snapshot is absent or malformed', () => {
    expect(buildApprovalPresentation()).toBeUndefined();
    expect(
      buildApprovalPresentation({
        actionCode: 'unknown',
        approvalId: 'approval-2',
        businessContextJson: '{',
        requestedAt: '2026-07-26T10:00:00Z',
        riskLevel: 'R2',
        roleCode: 'merchandising',
        status: 'PENDING',
        title: 'Unknown',
        workOrderId: 'wo-2',
      }),
    ).toBeUndefined();
  });
});
