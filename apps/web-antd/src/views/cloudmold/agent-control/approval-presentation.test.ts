import { describe, expect, it } from 'vitest';

import {
  buildApprovalDecisionPresentation,
  buildApprovalPresentation,
  buildGenericApprovalPresentation,
} from './approval-presentation';

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

  it('makes non-catalog workflow inputs reviewable without exposing raw commands', () => {
    const result = buildGenericApprovalPresentation({
      actionCode: 'crossborder.bonded-customs',
      approvalId: 'approval-3',
      businessContextJson: JSON.stringify({
        runId: 'bonded-customs-001',
        leaseToken: 'must-not-be-visible',
        commands: [
          { operation: 'CREATE_CASE', idempotencyKey: 'hidden' },
          { operation: 'SUBMIT_DECLARATION', idempotencyKey: 'hidden' },
        ],
      }),
      requestedAt: '2026-07-26T10:00:00Z',
      riskLevel: 'R3',
      roleCode: 'bonded-customs-operations',
      status: 'PENDING',
      title: '保税仓关务闭环',
      workOrderId: 'wo-3',
    });

    expect(result).toMatchObject({
      actionTitle: '保税仓关务闭环',
      operationCount: 2,
      operationNames: ['CREATE_CASE', 'SUBMIT_DECLARATION'],
    });
    expect(result?.entries).not.toContainEqual({
      label: 'lease Token',
      value: 'must-not-be-visible',
    });
    expect(result?.entries).not.toContainEqual({
      label: 'run Id',
      value: 'bonded-customs-001',
    });
  });

  it('explains a high-risk customs workflow in business terms', () => {
    expect(
      buildApprovalDecisionPresentation({
        actionCode: 'crossborder.bonded-customs',
        riskLevel: 'R3',
        roleCode: 'bonded-customs-operations',
        skillId: 'skill.cloudmold.crossborder.bonded-customs-lifecycle.v1',
        title: 'Temporal 定时托管',
      }),
    ).toMatchObject({
      title: '保税仓关务处置',
      objective: expect.stringContaining('关务'),
      outputs: expect.arrayContaining(['申报或处置记录']),
      riskReason: expect.stringContaining('合规风险'),
    });
  });

  it('keeps the fallback risk explanation actionable', () => {
    expect(
      buildApprovalDecisionPresentation({
        actionCode: 'unmapped.action',
        riskLevel: 'R3',
        roleCode: 'operations',
        title: '未知工作流',
      })?.riskReason,
    ).toContain('冻结范围');
  });
});
