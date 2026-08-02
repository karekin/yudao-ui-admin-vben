import type { CloudMoldWarehouseProcurementApi } from '#/api/cloudmold/warehouse-procurement';

import { describe, expect, it } from 'vitest';

import {
  canPutawayLine,
  canRecordReceipt,
  formatQuantity,
  inboundStatusMeta,
  receiptDispositionSummary,
  remainingPutawayQuantity,
  remainingReceivableQuantity,
} from './presentation';

const asnLine: CloudMoldWarehouseProcurementApi.AsnLine = {
  allowedOverReceiptQuantity: '0.500000',
  asnLineId: 'asn-line-1',
  baseUomCode: 'PCS',
  canonicalSkuId: 'sku-1',
  currencyCode: 'CNY',
  deliveryScheduleId: 'schedule-1',
  fulfillmentVersion: 1,
  lineNo: 1,
  ownerId: 'owner-1',
  ownerType: 'MERCHANT',
  pendingQualityQuantity: '0',
  poReleaseVersion: 2,
  procurementOrderItemId: 'item-1',
  receiptLocationId: 'receiving-1',
  receivedQuantity: '9007199254740992.250000',
  scheduledQuantity: '9007199254740993.000000',
  status: 'OPEN',
  supplierId: 'supplier-1',
  tolerancePolicyHash: 'a'.repeat(64),
  tolerancePolicyVersion: 'v1',
  unitCostAmountMinor: '9007199254740993',
  valuationPolicyHash: 'b'.repeat(64),
  valuationPolicyId: 'STANDARD_COST',
  valuationPolicyVersion: 'v2',
  warehouseId: 'warehouse-1',
};

const receiptLine: CloudMoldWarehouseProcurementApi.ReceiptLine = {
  acceptedQuantity: '9007199254740993.250000',
  asnLineId: 'asn-line-1',
  baseUomCode: 'PCS',
  canonicalSkuId: 'sku-1',
  cumulativePutawayQuantity: '9007199254740992.125000',
  currencyCode: 'CNY',
  deliveryScheduleId: 'schedule-1',
  financeReceiptEvidenceId: 'finance-receipt-evidence-1',
  financeReceiptEvidenceOperationId: '9007199254741000',
  financeReceiptEvidenceVersion: 1,
  fulfillmentVersionAfter: 2,
  fulfillmentVersionBefore: 1,
  inventoryBalanceId: 'balance-1',
  inventoryLedgerTxId: '9007199254740993',
  inventoryOperationId: '9007199254740994',
  lineNo: 1,
  movementCostAmountMinor: '1250',
  ownerId: 'owner-1',
  ownerType: 'MERCHANT',
  pendingQualityQuantity: '0',
  poReleaseVersion: 2,
  procurementOrderItemId: 'item-1',
  qualityStatus: 'QUALITY_ACCEPTED',
  quarantinedQuantity: '0',
  receiptLineId: 'receipt-line-1',
  receiptLocationId: 'receiving-1',
  receivedQuantity: '9007199254740993.25',
  rejectedQuantity: '0',
  roundingPolicyCode: 'HALF_UP',
  supplierId: 'supplier-1',
  tolerancePolicyHash: 'a'.repeat(64),
  tolerancePolicyVersion: 'v1',
  unitCostAmountMinor: '100',
  valuationPolicyHash: 'b'.repeat(64),
  valuationPolicyId: 'STANDARD_COST',
  valuationPolicyVersion: 'v2',
  version: 3,
  warehouseId: 'warehouse-1',
};

describe('procurement inbound presentation', () => {
  it('preserves decimal precision beyond Number safe integer', () => {
    expect(formatQuantity('9007199254740993.120000', 'PCS')).toBe(
      '9007199254740993.12 PCS',
    );
  });

  it('computes remaining receivable quantity with fixed-point BigInt', () => {
    expect(remainingReceivableQuantity(asnLine)).toBe('1.25');
  });

  it('computes remaining putaway quantity with fixed-point BigInt', () => {
    expect(remainingPutawayQuantity(receiptLine)).toBe('1.125');
  });

  it('permits putaway only for accepted quantities', () => {
    expect(canPutawayLine(receiptLine)).toBe(true);
    expect(
      canPutawayLine({ ...receiptLine, qualityStatus: 'PENDING_QUALITY' }),
    ).toBe(false);
  });

  it('stops receipt registration when the ASN is terminal', () => {
    const progress = {
      asnId: 'asn-1',
      asnNo: 'ASN-1',
      asnStatus: 'PARTIALLY_RECEIVED',
      asnVersion: 1,
      lines: [asnLine],
      nextWaitingEventCode: 'RECEIVE',
      nextWaitingEventLabel: '收货',
      procurementOrderId: 'po-1',
      receiptCount: 0,
      receipts: [],
      supplierId: 'supplier-1',
      terminal: false,
      totalPendingQualityQuantity: '0',
      totalReceivedQuantity: '0',
      totalScheduledQuantity: '1',
      warehouseId: 'warehouse-1',
    } satisfies CloudMoldWarehouseProcurementApi.ReceiptProgress;
    expect(canRecordReceipt(progress)).toBe(true);
    expect(canRecordReceipt({ ...progress, terminal: true })).toBe(false);
  });

  it('maps only known Warehouse states to operator language', () => {
    expect(inboundStatusMeta('PENDING_QUALITY')).toEqual({
      color: 'processing',
      label: '待质检',
    });
    expect(inboundStatusMeta('QUALITY_REJECTED')).toEqual({
      color: 'error',
      label: '质检拒收',
    });
  });

  it('shows all four quantity partitions', () => {
    expect(receiptDispositionSummary(receiptLine)).toBe(
      '待检 0 · 合格 9007199254740993.25 · 拒收 0 · 隔离 0',
    );
  });

  it('does not allow fully put away accepted lines', () => {
    expect(
      canPutawayLine({
        ...receiptLine,
        cumulativePutawayQuantity: receiptLine.acceptedQuantity,
      }),
    ).toBe(false);
  });
});
