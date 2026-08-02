import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestClient } from '#/api/request';

import {
  captureCloudMoldInventoryAgingSnapshot,
  getCloudMoldInventoryAgingSnapshot,
  getCloudMoldInventoryAgingSnapshotPage,
  getCloudMoldInventoryLot,
  getCloudMoldInventoryLotAvailability,
} from './index';

vi.mock('#/api/request', () => ({
  requestClient: { get: vi.fn(), post: vi.fn() },
}));

describe('cloudmold inventory api', () => {
  beforeEach(() => {
    vi.mocked(requestClient.get).mockReset();
    vi.mocked(requestClient.post).mockReset();
  });

  it('queries the canonical lot and availability endpoints', async () => {
    await getCloudMoldInventoryLot('lot/id', '2026-08-02T08:00:00Z');
    await getCloudMoldInventoryLotAvailability(
      'lot/id',
      '2026-08-02T08:00:00Z',
    );

    expect(requestClient.get).toHaveBeenNthCalledWith(
      1,
      '/cloudmold/inventory/v3/lots/lot%2Fid',
      { params: { eligibilityAt: '2026-08-02T08:00:00Z' } },
    );
    expect(requestClient.get).toHaveBeenNthCalledWith(
      2,
      '/cloudmold/inventory/v3/lots/lot%2Fid/availability',
      { params: { eligibilityAt: '2026-08-02T08:00:00Z' } },
    );
  });

  it('queries and captures authoritative aging snapshots', async () => {
    const params = { keyword: 'ledger v18', pageNo: 1, pageSize: 20 };

    await getCloudMoldInventoryAgingSnapshotPage(params);
    await getCloudMoldInventoryAgingSnapshot('snapshot/id');
    await captureCloudMoldInventoryAgingSnapshot({
      ageAgingMaxDays: 90,
      ageFreshMaxDays: 30,
      ageStaleMaxDays: 180,
      bucketPolicyCode: 'AGING_STANDARD',
      bucketPolicyVersion: 'v1',
      correlationId: 'corr-1',
      expiryCriticalMaxDays: 7,
      expiryWarningMaxDays: 30,
      idempotencyKey: 'idem-1',
      occurredAt: '2026-08-02T08:00:00Z',
      ownerId: 'merchant-1',
      ownerType: 'MERCHANT',
      sourceEventId: 'cloudmold-admin:idem-1',
      warehouseId: 'warehouse-1',
    });

    expect(requestClient.get).toHaveBeenNthCalledWith(
      1,
      '/cloudmold/inventory/v3/aging-snapshots/page',
      { params },
    );
    expect(requestClient.get).toHaveBeenNthCalledWith(
      2,
      '/cloudmold/inventory/v3/aging-snapshots/snapshot%2Fid',
    );
    expect(requestClient.post).toHaveBeenCalledWith(
      '/cloudmold/inventory/v3/aging-snapshots/command',
      expect.objectContaining({
        bucketPolicyCode: 'AGING_STANDARD',
        warehouseId: 'warehouse-1',
      }),
    );
  });
});
