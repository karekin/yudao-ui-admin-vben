import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestClient } from '#/api/request';

import {
  completeProcurementReceiptInspection,
  getProcurementReceiptInspection,
  getProcurementReceiptInspectionPage,
  recordProcurementReceiptInspectionResult,
} from './index';

vi.mock('#/api/request', () => ({
  requestClient: { get: vi.fn(), post: vi.fn() },
}));

describe('cloudmold procurement quality api', () => {
  beforeEach(() => {
    vi.mocked(requestClient.get).mockReset();
    vi.mocked(requestClient.post).mockReset();
  });

  it('queries the canonical inspection page and encoded detail only', async () => {
    const params = { pageNo: 1, pageSize: 20, status: 'OPEN' };
    await getProcurementReceiptInspectionPage(params);
    await getProcurementReceiptInspection('inspection/id');
    expect(requestClient.get).toHaveBeenNthCalledWith(
      1,
      '/cloudmold/quality/procurement-receipt-inspections/page',
      { params },
    );
    expect(requestClient.get).toHaveBeenNthCalledWith(
      2,
      '/cloudmold/quality/procurement-receipt-inspections/inspection%2Fid',
    );
  });

  it('records a typed one-split decision with an auditable envelope', async () => {
    await recordProcurementReceiptInspectionResult({
      acceptedDispositionCode: 'ACCEPT',
      acceptedQuantity: '9.750000',
      decisionEvidenceSha256: 'a'.repeat(64),
      defects: [],
      expectedInspectionVersion: 3,
      expectedLineVersion: 2,
      expectedSplitVersion: 2,
      inspectionId: 'inspection-1',
      inspectionLineId: 'line-1',
      inspectionSplitId: 'split-1',
      quarantineDispositionCode: 'QUARANTINE',
      quarantinedQuantity: '0.125000',
      rejectedQuantity: '0.125000',
      rejectedDispositionCode: 'RETURN_TO_SUPPLIER',
      sampledQuantity: '1.000000',
    });

    expect(requestClient.post).toHaveBeenCalledWith(
      '/cloudmold/quality/procurement-receipt-inspections/command',
      expect.objectContaining({
        correlationId: expect.any(String),
        idempotencyKey: expect.any(String),
        occurredAt: expect.any(String),
        operation: 'RECORD_LINE_RESULTS',
        results: expect.objectContaining({
          lines: [
            expect.objectContaining({
              expectedVersion: 2,
              inspectionLineId: 'line-1',
              splits: [
                expect.objectContaining({
                  acceptedQuantity: '9.750000',
                  expectedVersion: 2,
                  inspectionSplitId: 'split-1',
                  quarantineDispositionCode: 'QUARANTINE',
                  quarantinedQuantity: '0.125000',
                  rejectedQuantity: '0.125000',
                }),
              ],
            }),
          ],
        }),
      }),
    );
  });

  it('submits the independent completion review with optimistic version', async () => {
    await completeProcurementReceiptInspection('inspection-1', 8);
    expect(requestClient.post).toHaveBeenCalledWith(
      '/cloudmold/quality/procurement-receipt-inspections/command',
      expect.objectContaining({
        expectedVersion: 8,
        inspectionId: 'inspection-1',
        operation: 'COMPLETE_INSPECTION',
      }),
    );
  });

  it('contains no ERP or WMS endpoint alias', () => {
    const source = [
      getProcurementReceiptInspectionPage,
      getProcurementReceiptInspection,
      recordProcurementReceiptInspectionResult,
    ].join('\n');
    expect(source).not.toMatch(/\/(erp|wms)\//i);
  });
});
