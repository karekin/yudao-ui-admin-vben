import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestClient } from '#/api/request';

import {
  getCloudMoldCustomerReceivablesSummary,
  getCloudMoldSalesContractReceivablesSummary,
} from './finance-summary';

vi.mock('#/api/request', () => ({
  requestClient: { get: vi.fn() },
}));

describe('cloudmold crm finance summary api', () => {
  beforeEach(() => {
    vi.mocked(requestClient.get).mockReset();
  });

  it('queries customer and sales-contract read-only receivable summaries', async () => {
    await getCloudMoldCustomerReceivablesSummary('customer-1');
    await getCloudMoldSalesContractReceivablesSummary('contract/1');

    expect(requestClient.get).toHaveBeenNthCalledWith(
      1,
      '/cloudmold/finance/receivables/customers/customer-1/summary',
    );
    expect(requestClient.get).toHaveBeenNthCalledWith(
      2,
      '/cloudmold/finance/receivables/sales-contracts/contract%2F1/summary',
    );
  });
});
