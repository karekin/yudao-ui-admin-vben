import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestClient } from '#/api/request';

import {
  executeSupplyPlanningCommand,
  getInventoryHealthSnapshotPage,
  getSafetyStockPolicyPage,
  getSupplyPlanningWorkItemPage,
} from './index';

vi.mock('#/api/request', () => ({
  requestClient: { get: vi.fn(), post: vi.fn() },
}));

describe('cloudmold supply-planning api', () => {
  beforeEach(() => {
    vi.mocked(requestClient.get).mockReset();
    vi.mocked(requestClient.post).mockReset();
  });

  it('queries only the CloudMold supply-planning work-item endpoint', async () => {
    const params = {
      itemType: 'PLAN_SCENARIO',
      pageNo: 1,
      pageSize: 100,
      status: 'SELECTED',
    };

    await getSupplyPlanningWorkItemPage(params);

    expect(requestClient.get).toHaveBeenCalledWith(
      '/cloudmold/supply-planning/work-item/page',
      { params },
    );
  });

  it('adds an auditable command envelope to supply-planning writes', async () => {
    await executeSupplyPlanningCommand({
      operation: 'APPROVE_SUPPLY_PLAN',
      supplyPlan: {
        approverPrincipalId: 'principal-id',
        expectedVersion: 2,
        planId: 'plan-id',
      },
    });

    expect(requestClient.post).toHaveBeenCalledWith(
      '/cloudmold/supply-planning/command',
      expect.objectContaining({
        correlationId: expect.any(String),
        idempotencyKey: expect.any(String),
        occurredAt: expect.any(String),
        operation: 'APPROVE_SUPPLY_PLAN',
        runId: expect.any(String),
        supplyPlan: {
          approverPrincipalId: 'principal-id',
          expectedVersion: 2,
          planId: 'plan-id',
        },
      }),
    );
  });

  it('sends only canonical stock-transfer dimensions', async () => {
    await executeSupplyPlanningCommand({
      operation: 'CONVERT_REPLENISHMENT',
      replenishmentConversion: {
        convertedByPrincipalId: 'principal-id',
        expectedVersion: 2,
        ownerId: 'merchant-id',
        ownerType: 'MERCHANT',
        recommendationId: 'replenishment-id',
        sourceWarehouseId: 'warehouse-source',
        targetType: 'TRANSFER_REQUEST',
        targetWarehouseId: 'warehouse-target',
      },
    });

    expect(requestClient.post).toHaveBeenCalledWith(
      '/cloudmold/supply-planning/command',
      expect.objectContaining({
        operation: 'CONVERT_REPLENISHMENT',
        replenishmentConversion: {
          convertedByPrincipalId: 'principal-id',
          expectedVersion: 2,
          ownerId: 'merchant-id',
          ownerType: 'MERCHANT',
          recommendationId: 'replenishment-id',
          sourceWarehouseId: 'warehouse-source',
          targetType: 'TRANSFER_REQUEST',
          targetWarehouseId: 'warehouse-target',
        },
      }),
    );
  });

  it('queries versioned inventory-control records from supply planning', async () => {
    const params = { pageNo: 1, pageSize: 20 };

    await getSafetyStockPolicyPage(params);
    await getInventoryHealthSnapshotPage(params);

    expect(requestClient.get).toHaveBeenNthCalledWith(
      1,
      '/cloudmold/supply-planning/safety-stock-policies/page',
      { params },
    );
    expect(requestClient.get).toHaveBeenNthCalledWith(
      2,
      '/cloudmold/supply-planning/inventory-health-snapshots/page',
      { params },
    );
  });
});
