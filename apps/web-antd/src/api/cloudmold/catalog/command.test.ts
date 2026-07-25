import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestClient } from '#/api/request';

import { activateCatalogDefinition } from './command';

vi.mock('#/api/request', () => ({
  requestClient: { post: vi.fn() },
}));

describe('activateCatalogDefinition', () => {
  beforeEach(() => {
    vi.mocked(requestClient.post).mockReset();
    vi.mocked(requestClient.post).mockImplementation(async (_url, payload) => {
      let currentStatus = 'ACTIVE';
      if (payload.action === 'SUBMIT') {
        currentStatus = 'SUBMITTED';
      } else if (payload.action === 'APPROVE') {
        currentStatus = 'APPROVED';
      }

      return {
        aggregateVersion: Number(payload.expectedVersion) + 1,
        currentStatus,
        duplicate: false,
      };
    });
  });

  it('activates dependencies before SKU and activates SPU last', async () => {
    const result = await activateCatalogDefinition({
      aggregateVersion: 1,
      canonicalSkuId: 'sku',
      canonicalSpuId: 'spu',
      canonicalStyleId: 'style',
      colorId: 'color',
      colorStatus: 'DRAFT',
      colorVersion: 1,
      created: true,
      duplicate: false,
      operationId: 1,
      primaryBarcodeId: 'barcode',
      sizeGroupId: 'group',
      sizeGroupStatus: 'DRAFT',
      sizeGroupVersion: 1,
      sizeId: 'size',
      sizeStatus: 'DRAFT',
      sizeVersion: 1,
      skuStatus: 'DRAFT',
      spuStatus: 'DRAFT',
      spuVersion: 1,
      styleStatus: 'DRAFT',
      styleVersion: 1,
    });

    const calls = vi.mocked(requestClient.post).mock.calls.map(([, body]) => {
      const command = body as Record<string, unknown>;
      return `${command.entityType}:${command.action}`;
    });
    expect(calls).toEqual([
      'STYLE:ACTIVATE',
      'COLOR:ACTIVATE',
      'SIZE_GROUP:ACTIVATE',
      'SIZE:ACTIVATE',
      'SPU:SUBMIT',
      'SPU:APPROVE',
      'SKU:ACTIVATE',
      'SPU:ACTIVATE',
    ]);
    expect(result.skuStatus).toBe('ACTIVE');
    expect(result.spuStatus).toBe('ACTIVE');
  });
});
