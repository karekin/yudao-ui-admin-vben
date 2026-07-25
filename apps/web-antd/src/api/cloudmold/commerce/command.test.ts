import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestClient } from '#/api/request';

import {
  completeOrder,
  completeOrderAfterDelivery,
  shipFulfillment,
} from './command';

vi.mock('#/api/request', () => ({
  requestClient: { post: vi.fn() },
}));

describe('cloudmold commerce commands', () => {
  beforeEach(() => {
    vi.mocked(requestClient.post).mockReset();
    vi.mocked(requestClient.post).mockResolvedValue({
      aggregateId: 'aggregate-id',
      aggregateType: 'ORDER',
      aggregateVersion: 4,
      duplicate: false,
      operationId: 1,
      status: 'COMPLETED',
    });
  });

  it('uses delivery-validated completion for listing-backed orders', async () => {
    await completeOrderAfterDelivery('order-id', 3);

    expect(requestClient.post).toHaveBeenCalledWith(
      '/cloudmold/order/command',
      expect.objectContaining({
        expectedVersion: 3,
        operation: 'COMPLETE_AFTER_DELIVERY',
        orderId: 'order-id',
      }),
    );
  });

  it('keeps plain completion available for non-listing orders', async () => {
    await completeOrder('order-id', 3);

    expect(requestClient.post).toHaveBeenCalledWith(
      '/cloudmold/order/command',
      expect.objectContaining({
        expectedVersion: 3,
        operation: 'COMPLETE',
        orderId: 'order-id',
      }),
    );
  });

  it('sends immutable carrier and waybill evidence with ship', async () => {
    await shipFulfillment('fulfillment-id', 2, 'SF', 'SF123456');

    expect(requestClient.post).toHaveBeenCalledWith(
      '/cloudmold/fulfillment/command',
      expect.objectContaining({
        carrierCode: 'SF',
        expectedVersion: 2,
        fulfillmentId: 'fulfillment-id',
        operation: 'SHIP',
        waybillNo: 'SF123456',
      }),
    );
  });
});
