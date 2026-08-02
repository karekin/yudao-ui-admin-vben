import { describe, expect, it } from 'vitest';

import {
  canCompleteInspection,
  canRecordInspectionResult,
  dispositionSummary,
  finalDecisionMeta,
  formatDecimalQuantity,
  inspectionStatusMeta,
  undecidedQuantity,
} from './presentation';

describe('procurement quality presentation', () => {
  it('maps inspection states without inventing actions', () => {
    expect(inspectionStatusMeta('READY_TO_COMPLETE')).toEqual({
      color: 'warning',
      label: '待独立复核',
    });
    expect(canRecordInspectionResult('OPEN')).toBe(true);
    expect(canRecordInspectionResult('COMPLETED')).toBe(false);
    expect(canCompleteInspection('READY_TO_COMPLETE')).toBe(true);
    expect(canCompleteInspection('IN_PROGRESS')).toBe(false);
  });

  it('formats decimal quantities as strings without Number conversion', () => {
    expect(formatDecimalQuantity('9007199254740993.120000', 'PCS')).toBe(
      '9007199254740993.12 PCS',
    );
    expect(formatDecimalQuantity('0.000000')).toBe('0');
  });

  it('computes undecided quantity with fixed-point BigInt arithmetic', () => {
    expect(
      undecidedQuantity({
        acceptedQuantity: '9007199254740992.100000',
        inspectionSplitId: 'split-1',
        locationId: 'location-1',
        quarantinedQuantity: '0.050000',
        receivedQuantity: '9007199254740993.250000',
        rejectedQuantity: '0.100000',
        sampledQuantity: '1.000000',
        splitNumber: 1,
        status: 'PARTIALLY_INSPECTED',
        uomCode: 'PCS',
        version: 2,
        warehouseId: 'warehouse-1',
      }),
    ).toBe('1');
  });

  it('presents the three authoritative disposition partitions', () => {
    expect(
      dispositionSummary({
        acceptedQuantity: '9.5',
        businessNo: 'GRN-1',
        inspectionCode: 'IQC-1',
        inspectionId: 'inspection-1',
        ownerId: 'owner-1',
        ownerType: 'MERCHANT',
        purchaseOrderId: 'po-1',
        quarantinedQuantity: '0.25',
        receiptId: 'receipt-1',
        receivedQuantity: '10',
        rejectedQuantity: '0.25',
        sampledQuantity: '1',
        status: 'READY_TO_COMPLETE',
        supplierId: 'supplier-1',
        updatedAt: '2026-08-02T00:00:00Z',
        version: 3,
      }),
    ).toBe('合格 9.5 / 拒收 0.25 / 隔离 0.25');
    expect(finalDecisionMeta('REJECTED').color).toBe('error');
  });
});
