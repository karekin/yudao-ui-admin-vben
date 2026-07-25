import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestClient } from '#/api/request';

import {
  executeSupplyPlanningCommand,
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

  it('preserves governed replenishment PREPARE mapping fields', async () => {
    await executeSupplyPlanningCommand({
      operation: 'CONVERT_REPLENISHMENT',
      replenishmentConversion: {
        accountId: 12,
        convertedByPrincipalId: 'principal-id',
        erpProductId: 34,
        erpProductUnitId: 56,
        expectedVersion: 2,
        mappingEvidenceSha256: 'a'.repeat(64),
        recommendationId: 'replenishment-id',
        supplierId: 78,
        targetType: 'PURCHASE_REQUEST',
        taxPercent: 13,
        unitCostMinor: 1299,
      },
    });

    expect(requestClient.post).toHaveBeenCalledWith(
      '/cloudmold/supply-planning/command',
      expect.objectContaining({
        operation: 'CONVERT_REPLENISHMENT',
        replenishmentConversion: {
          accountId: 12,
          convertedByPrincipalId: 'principal-id',
          erpProductId: 34,
          erpProductUnitId: 56,
          expectedVersion: 2,
          mappingEvidenceSha256: 'a'.repeat(64),
          recommendationId: 'replenishment-id',
          supplierId: 78,
          targetType: 'PURCHASE_REQUEST',
          taxPercent: 13,
          unitCostMinor: 1299,
        },
      }),
    );
  });
});
