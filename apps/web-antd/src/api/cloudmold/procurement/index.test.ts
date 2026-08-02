import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestClient } from '#/api/request';

import {
  executePurchaseOrderTransition,
  executeSourcingTransition,
  getPurchaseAward,
  getPurchaseAwardPage,
  getPurchaseOrder,
  getPurchaseOrderPage,
  getPurchaseRequisitionPage,
  getQuotationPage,
  getSourcingEventPage,
  PURCHASE_ORDER_OPERATIONS,
  SOURCING_OPERATIONS,
} from './index';

vi.mock('#/api/request', () => ({
  requestClient: { get: vi.fn(), post: vi.fn() },
}));

describe('cloudmold procurement api', () => {
  beforeEach(() => {
    vi.mocked(requestClient.get).mockReset();
    vi.mocked(requestClient.post).mockReset();
  });

  it('queries only CloudMold purchase-order endpoints', async () => {
    const params = { pageNo: 1, pageSize: 20 };
    await getPurchaseOrderPage(params);
    await getPurchaseOrder('po/id');
    expect(requestClient.get).toHaveBeenNthCalledWith(
      1,
      '/cloudmold/procurement/orders/page',
      { params },
    );
    expect(requestClient.get).toHaveBeenNthCalledWith(
      2,
      '/cloudmold/procurement/order/po%2Fid',
    );
  });

  it('forwards only authoritative pagination params to every page query', async () => {
    const params = { pageNo: 2, pageSize: 10 };
    await getPurchaseRequisitionPage(params);
    await getSourcingEventPage(params);
    await getQuotationPage(params);
    await getPurchaseAwardPage(params);
    await getPurchaseOrderPage(params);
    expect(requestClient.get).toHaveBeenNthCalledWith(
      1,
      '/cloudmold/procurement/purchase-requisitions/page',
      { params },
    );
    expect(requestClient.get).toHaveBeenNthCalledWith(
      2,
      '/cloudmold/procurement/sourcing-events/page',
      { params },
    );
    expect(requestClient.get).toHaveBeenNthCalledWith(
      3,
      '/cloudmold/procurement/quotations/page',
      { params },
    );
    expect(requestClient.get).toHaveBeenNthCalledWith(
      4,
      '/cloudmold/procurement/awards/page',
      { params },
    );
    expect(requestClient.get).toHaveBeenNthCalledWith(
      5,
      '/cloudmold/procurement/orders/page',
      { params },
    );
  });

  it('loads an encoded canonical award detail', async () => {
    await getPurchaseAward('award/id');
    expect(requestClient.get).toHaveBeenCalledWith(
      '/cloudmold/procurement/awards/award%2Fid',
    );
  });

  it('adds an auditable envelope to procurement transitions', async () => {
    await executePurchaseOrderTransition({
      operation: 'RELEASE_PURCHASE_ORDER',
      purchaseOrder: { expectedVersion: 4, orderId: 'po-1' },
    });
    expect(requestClient.post).toHaveBeenCalledWith(
      '/cloudmold/procurement/command',
      expect.objectContaining({
        correlationId: expect.any(String),
        idempotencyKey: expect.any(String),
        occurredAt: expect.any(String),
        operation: 'RELEASE_PURCHASE_ORDER',
        purchaseOrder: {
          expectedVersion: 4,
          orderId: 'po-1',
        },
        runId: expect.any(String),
      }),
    );
  });

  it('uses the exact sourcing event transition shape', async () => {
    await executeSourcingTransition({
      eventTransition: { eventId: 'event-1', expectedVersion: 7 },
      operation: 'OPEN_QUOTING',
    });
    expect(requestClient.post).toHaveBeenCalledWith(
      '/cloudmold/procurement/sourcing/command',
      expect.objectContaining({
        eventTransition: { eventId: 'event-1', expectedVersion: 7 },
        operation: 'OPEN_QUOTING',
      }),
    );
  });

  it('submits award transitions with both authoritative versions', async () => {
    await executeSourcingTransition({
      awardTransition: {
        awardId: 'award-1',
        expectedAwardVersion: 3,
        expectedEventVersion: 9,
        reasonCode: 'SCORE_REVIEWED',
      },
      operation: 'APPROVE_AWARD',
    });
    expect(requestClient.post).toHaveBeenCalledWith(
      '/cloudmold/procurement/sourcing/command',
      expect.objectContaining({
        awardTransition: {
          awardId: 'award-1',
          expectedAwardVersion: 3,
          expectedEventVersion: 9,
          reasonCode: 'SCORE_REVIEWED',
        },
        operation: 'APPROVE_AWARD',
      }),
    );
  });

  it('exposes exactly the final backend operation vocabularies', () => {
    expect(PURCHASE_ORDER_OPERATIONS).toEqual([
      'CREATE_PURCHASE_ORDER',
      'SUBMIT_PURCHASE_ORDER',
      'APPROVE_PURCHASE_ORDER',
      'RELEASE_PURCHASE_ORDER',
      'DISPATCH_PURCHASE_ORDER',
      'SUPPLIER_CONFIRM_PURCHASE_ORDER',
      'CANCEL_PURCHASE_ORDER',
      'CLOSE_PURCHASE_ORDER',
    ]);
    expect(SOURCING_OPERATIONS).toEqual([
      'CREATE_SOURCING_EVENT',
      'PUBLISH_SOURCING_EVENT',
      'INVITE_SUPPLIER',
      'OPEN_QUOTING',
      'SUBMIT_QUOTATION_REVISION',
      'WITHDRAW_QUOTATION_REVISION',
      'CLOSE_QUOTING',
      'CREATE_EVALUATION_POLICY',
      'RECORD_EVALUATION_SCORE',
      'CREATE_AWARD_DRAFT',
      'SUBMIT_AWARD',
      'APPROVE_AWARD',
      'REJECT_AWARD',
      'CLOSE_SOURCING_EVENT',
      'CANCEL_SOURCING_EVENT',
    ]);
    const operations = [...PURCHASE_ORDER_OPERATIONS, ...SOURCING_OPERATIONS];
    expect(operations).not.toContain(
      ['ACKNOWLEDGE', 'PURCHASE', 'ORDER'].join('_'),
    );
    expect(operations).not.toContain(['ISSUE', 'PURCHASE', 'ORDER'].join('_'));
    expect(operations).not.toContain(
      ['RELEASE', 'AWARD', 'TO', 'PURCHASE', 'ORDERS'].join('_'),
    );
  });
});
