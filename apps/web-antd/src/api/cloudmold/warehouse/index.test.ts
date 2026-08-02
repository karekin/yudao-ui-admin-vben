import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestClient } from '#/api/request';

import {
  getCloudMoldStockTransfer,
  getCloudMoldStockTransferPage,
} from './index';

vi.mock('#/api/request', () => ({
  requestClient: { get: vi.fn() },
}));

describe('cloudmold canonical stock-transfer api', () => {
  beforeEach(() => vi.mocked(requestClient.get).mockReset());

  it('queries only the Warehouse-owned page endpoint', async () => {
    const params = { orderStatus: 'PREPARE', pageNo: 1, pageSize: 20 };
    await getCloudMoldStockTransferPage(params);
    expect(requestClient.get).toHaveBeenCalledWith(
      '/cloudmold/warehouse/stock-transfers/page',
      { params },
    );
  });

  it('loads detail by canonical request id', async () => {
    await getCloudMoldStockTransfer('request-id');
    expect(requestClient.get).toHaveBeenCalledWith(
      '/cloudmold/warehouse/stock-transfers/get',
      { params: { requestId: 'request-id' } },
    );
  });
});
