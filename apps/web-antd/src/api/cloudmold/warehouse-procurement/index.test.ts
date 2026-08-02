import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestClient } from '#/api/request';

import {
  getProcurementPutaway,
  getProcurementPutawayPage,
  getProcurementReceipt,
  getProcurementReceiptPage,
  getProcurementReceiptProgress,
  putawayProcurementReceipt,
  recordPartialProcurementReceipt,
} from './index';

vi.mock('#/api/request', () => ({
  requestClient: { get: vi.fn(), post: vi.fn() },
}));

describe('cloudmold warehouse procurement api', () => {
  beforeEach(() => {
    vi.mocked(requestClient.get).mockReset();
    vi.mocked(requestClient.post).mockReset();
  });

  it('uses only canonical Warehouse receipt endpoints', async () => {
    const params = { pageNo: 1, pageSize: 20, status: 'PENDING_QUALITY' };
    await getProcurementReceiptPage(params);
    await getProcurementReceipt('receipt/id');
    await getProcurementReceiptProgress('po/id');
    expect(requestClient.get).toHaveBeenNthCalledWith(
      1,
      '/cloudmold/warehouse/inbound/receipts/page',
      { params },
    );
    expect(requestClient.get).toHaveBeenNthCalledWith(
      2,
      '/cloudmold/warehouse/inbound/receipts/get',
      { params: { receiptId: 'receipt/id' } },
    );
    expect(requestClient.get).toHaveBeenNthCalledWith(
      3,
      '/cloudmold/warehouse/inbound/receipts/progress',
      { params: { procurementOrderId: 'po/id' } },
    );
  });

  it('queries authoritative putaway batches and encoded IDs', async () => {
    const params = { pageNo: 2, pageSize: 10, status: 'COMPLETED' };
    await getProcurementPutawayPage(params);
    await getProcurementPutaway('putaway/id');
    expect(requestClient.get).toHaveBeenNthCalledWith(
      1,
      '/cloudmold/warehouse/inbound/putaways/page',
      { params },
    );
    expect(requestClient.get).toHaveBeenNthCalledWith(
      2,
      '/cloudmold/warehouse/inbound/putaways/get',
      { params: { putawayId: 'putaway/id' } },
    );
  });

  it('submits line-level partial putaway with no header target location', async () => {
    await putawayProcurementReceipt({
      lines: [
        {
          quantity: '12.500000',
          receiptLine: {
            acceptedQuantity: '12.5',
            asnLineId: 'asn-line-1',
            baseUomCode: 'PCS',
            canonicalSkuId: 'sku-1',
            cumulativePutawayQuantity: '0',
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
            poReleaseVersion: 1,
            procurementOrderItemId: 'item-1',
            qualityStatus: 'QUALITY_ACCEPTED',
            quarantinedQuantity: '0',
            receiptLineId: 'receipt-line-1',
            receiptLocationId: 'receiving-1',
            receivedQuantity: '12.5',
            rejectedQuantity: '0',
            roundingPolicyCode: 'HALF_UP',
            supplierId: 'supplier-1',
            tolerancePolicyHash: 'a'.repeat(64),
            tolerancePolicyVersion: '1',
            unitCostAmountMinor: '100',
            valuationPolicyHash: 'b'.repeat(64),
            valuationPolicyId: 'STANDARD_COST',
            valuationPolicyVersion: '1',
            version: 3,
            warehouseId: 'warehouse-1',
          },
          targetLocationId: 'sellable-1',
        },
      ],
      receipt: {
        createdAt: '2026-08-02T00:00:00',
        lines: [],
        receiptId: 'receipt-1',
        receiptNo: 'GRN-1',
        status: 'PARTIALLY_PUTAWAY',
        version: 4,
      },
    });

    const payload = vi.mocked(requestClient.post).mock.calls[0]?.[1] as {
      putaway: Record<string, unknown>;
    };
    expect(requestClient.post).toHaveBeenCalledWith(
      '/cloudmold/warehouse/inbound/putaways/command',
      expect.objectContaining({ operation: 'COMPLETE_PUTAWAY' }),
    );
    expect(payload.putaway).not.toHaveProperty('targetLocationId');
    expect(payload.putaway.lines).toEqual([
      expect.objectContaining({
        expectedReceiptLineVersion: 3,
        quantity: '12.500000',
        receiptLineId: 'receipt-line-1',
        sourceLocationId: 'receiving-1',
        targetLocationId: 'sellable-1',
      }),
    ]);
  });

  it('submits partial receipt from frozen ASN identity without client-valued cost', async () => {
    const asnLine = {
      allowedOverReceiptQuantity: '0',
      asnLineId: 'asn-line-1',
      baseUomCode: 'PCS',
      canonicalSkuId: 'sku-1',
      currencyCode: 'CNY',
      deliveryScheduleId: 'schedule-1',
      fulfillmentVersion: 2,
      lineNo: 1,
      ownerId: 'owner-1',
      ownerType: 'MERCHANT',
      pendingQualityQuantity: '0',
      poReleaseVersion: 4,
      procurementOrderItemId: 'item-1',
      receiptLocationId: 'receiving-1',
      receivedQuantity: '0',
      roundingPolicyCode: 'HALF_UP',
      scheduledQuantity: '10',
      status: 'OPEN',
      supplierId: 'supplier-1',
      tolerancePolicyHash: 'a'.repeat(64),
      tolerancePolicyVersion: 'v1',
      unitCostAmountMinor: '9007199254740993',
      valuationPolicyHash: 'b'.repeat(64),
      valuationPolicyId: 'WEIGHTED_AVERAGE',
      valuationPolicyVersion: 'v2',
      warehouseId: 'warehouse-1',
    };
    await recordPartialProcurementReceipt({
      lines: [{ asnLine, receivedQuantity: '2.500000' }],
      progress: {
        asnId: 'asn-1',
        asnNo: 'ASN-1',
        asnStatus: 'PARTIAL_RECEIVED',
        asnVersion: 3,
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
        totalScheduledQuantity: '10',
        warehouseId: 'warehouse-1',
      },
      receiptNo: 'GRN-1',
    });

    expect(requestClient.post).toHaveBeenCalledWith(
      '/cloudmold/warehouse/inbound/receipts/partial-receive',
      expect.objectContaining({
        operation: 'COMPLETE_RECEIPT',
        receipt: expect.objectContaining({
          lines: [
            expect.objectContaining({
              asnLineId: 'asn-line-1',
              expectedFulfillmentVersion: 2,
              receivedQuantity: '2.500000',
            }),
          ],
        }),
      }),
    );
    const payload = vi.mocked(requestClient.post).mock.calls[0]?.[1] as {
      receipt: { lines: Array<Record<string, unknown>> };
    };
    expect(payload.receipt.lines[0]).not.toHaveProperty(
      'movementCostAmountMinor',
    );
    expect(payload.receipt.lines[0]).not.toHaveProperty('unitCostAmountMinor');
  });

  it('contains no ERP or WMS endpoint alias', () => {
    const source = [
      getProcurementReceiptPage,
      getProcurementReceipt,
      getProcurementReceiptProgress,
      getProcurementPutawayPage,
      getProcurementPutaway,
      putawayProcurementReceipt,
    ].join('\n');
    expect(source).not.toMatch(/\/(erp|wms)\//i);
  });
});
