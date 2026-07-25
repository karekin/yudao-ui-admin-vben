import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestClient } from '#/api/request';

import {
  activateCatalogDefinition,
  rotateCatalogBarcode,
  updateCatalogMetadata,
  updateCatalogSkuCode,
} from './command';

vi.mock('#/api/request', () => ({
  requestClient: { post: vi.fn() },
}));

describe('cloudmold catalog commands', () => {
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

  it('updates only the selected SKU metadata with a command envelope', async () => {
    await updateCatalogSkuCode('sku-id', 7, 'sku-new', '业务编码纠正');

    expect(requestClient.post).toHaveBeenCalledWith(
      '/cloudmold/catalog/metadata/update',
      expect.objectContaining({
        correlationId: expect.any(String),
        entityId: 'sku-id',
        entityType: 'SKU',
        expectedVersion: 7,
        idempotencyKey: expect.any(String),
        occurredAt: expect.any(String),
        reason: '业务编码纠正',
        skuCode: 'sku-new',
      }),
    );
  });

  it('updates style metadata with explicit idempotency control', async () => {
    await updateCatalogMetadata({
      brandRef: 'INTERNAL:BRAND:YSHOPPING',
      entityId: 'style-id',
      entityType: 'STYLE',
      expectedVersion: 3,
      idempotencyKey: 'catalog-style-update-fixed-key',
      planningCategoryRef: 'INTERNAL:CATEGORY:DRESS',
      planningYear: 2026,
      reason: '企划复核后调整款式命名',
      seasonCode: 'AUTUMN',
      styleCode: 'YS2026-DRESS-001-REV1',
      styleName: '秋季连衣裙升级版',
      waveCode: 'WAVE-02',
    });

    expect(requestClient.post).toHaveBeenCalledWith(
      '/cloudmold/catalog/metadata/update',
      expect.objectContaining({
        brandRef: 'INTERNAL:BRAND:YSHOPPING',
        entityId: 'style-id',
        entityType: 'STYLE',
        expectedVersion: 3,
        idempotencyKey: 'catalog-style-update-fixed-key',
        planningCategoryRef: 'INTERNAL:CATEGORY:DRESS',
        planningYear: 2026,
        reason: '企划复核后调整款式命名',
        seasonCode: 'AUTUMN',
        styleCode: 'YS2026-DRESS-001-REV1',
        styleName: '秋季连衣裙升级版',
        waveCode: 'WAVE-02',
      }),
    );
  });

  it('rotates the primary barcode with version and audit reason', async () => {
    await rotateCatalogBarcode({
      barcode: '6900000000012',
      barcodeType: 'EAN13',
      expectedVersion: 8,
      idempotencyKey: 'catalog-barcode-fixed-key',
      reason: '供应商条码切换',
      skuId: 'sku-id',
    });

    expect(requestClient.post).toHaveBeenCalledWith(
      '/cloudmold/catalog/barcode/rotate',
      expect.objectContaining({
        barcode: '6900000000012',
        barcodeType: 'EAN13',
        correlationId: expect.any(String),
        expectedVersion: 8,
        idempotencyKey: 'catalog-barcode-fixed-key',
        occurredAt: expect.any(String),
        reason: '供应商条码切换',
        skuId: 'sku-id',
      }),
    );
  });
});
