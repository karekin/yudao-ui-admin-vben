import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getLatestSupplierPerformanceScorecard,
  getSupplierPerformanceReadiness,
} from './index';

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('#/api/request', () => ({
  requestClient: { get },
}));

describe('supplier performance API', () => {
  beforeEach(() => get.mockReset());

  it('uses the read-only readiness contract with the selected period', async () => {
    await getSupplierPerformanceReadiness({
      supplierId: 'supplier-1',
      periodStart: '2026-07-01',
      periodEnd: '2026-07-31',
    });

    expect(get).toHaveBeenCalledWith(
      '/cloudmold/supplier-sourcing/performance/readiness',
      {
        params: {
          supplierId: 'supplier-1',
          periodStart: '2026-07-01',
          periodEnd: '2026-07-31',
        },
      },
    );
  });

  it('encodes the supplier reference before requesting its latest scorecard', async () => {
    await getLatestSupplierPerformanceScorecard('supplier/a');

    expect(get).toHaveBeenCalledWith(
      '/cloudmold/supplier-sourcing/performance/latest/supplier%2Fa',
    );
  });
});
