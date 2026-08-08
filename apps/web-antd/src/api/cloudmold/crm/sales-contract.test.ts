import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestClient } from '#/api/request';

import {
  executeSalesContractCommand,
  getCloudMoldSalesContract,
  listCloudMoldSalesContracts,
  SALES_CONTRACT_OPERATIONS,
} from './sales-contract';

vi.mock('#/api/request', () => ({
  requestClient: { get: vi.fn(), post: vi.fn() },
}));

describe('cloudmold crm sales contract api', () => {
  beforeEach(() => {
    vi.mocked(requestClient.get).mockReset();
    vi.mocked(requestClient.post).mockReset();
  });

  it('loads a canonical sales contract detail by id', async () => {
    await getCloudMoldSalesContract('contract/1');

    expect(requestClient.get).toHaveBeenCalledWith(
      '/cloudmold/crm/sales-contracts/contract%2F1',
    );
  });

  it('lists canonical sales contracts for the workbench', async () => {
    await listCloudMoldSalesContracts();

    expect(requestClient.get).toHaveBeenCalledWith(
      '/cloudmold/crm/sales-contracts/page',
    );
  });

  it('submits supported sales contract commands with the full envelope', async () => {
    await executeSalesContractCommand({
      contractCode: 'SC-001',
      contractName: 'Sales Contract',
      currencyCode: 'CNY',
      customerId: 'customer-1',
      effectiveDate: '2026-08-08',
      items: [
        {
          canonicalSkuId: 'sku-1',
          itemName: 'SKU 1',
          lineAmountMinor: 2000,
          quantity: '2',
          unitPriceMinor: 1000,
          uomCode: 'PCS',
        },
      ],
      operation: SALES_CONTRACT_OPERATIONS.CREATE_DRAFT,
      sellerMerchantId: 'merchant-1',
      sellerShopId: 'shop-1',
    });

    expect(requestClient.post).toHaveBeenCalledWith(
      '/cloudmold/crm/sales-contracts/command',
      expect.objectContaining({
        causationId: expect.any(String),
        contractCode: 'SC-001',
        contractName: 'Sales Contract',
        correlationId: expect.any(String),
        currencyCode: 'CNY',
        customerId: 'customer-1',
        effectiveDate: '2026-08-08',
        idempotencyKey: expect.any(String),
        occurredAt: expect.any(String),
        operation: SALES_CONTRACT_OPERATIONS.CREATE_DRAFT,
        runId: expect.any(String),
        sellerMerchantId: 'merchant-1',
        sellerShopId: 'shop-1',
      }),
    );
  });
});
