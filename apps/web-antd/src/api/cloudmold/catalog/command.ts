import { requestClient } from '#/api/request';

import { buildCommandEnvelope } from '../command-helpers';

export const CatalogEntityType = {
  COLOR: 'COLOR',
  SIZE: 'SIZE',
  SIZE_GROUP: 'SIZE_GROUP',
  SKU: 'SKU',
  SPU: 'SPU',
  STYLE: 'STYLE',
} as const;

export const CatalogLifecycleAction = {
  ACTIVATE: 'ACTIVATE',
  APPROVE: 'APPROVE',
  ARCHIVE: 'ARCHIVE',
  DEACTIVATE: 'DEACTIVATE',
  REJECT: 'REJECT',
  RESET_DRAFT: 'RESET_DRAFT',
  SUBMIT: 'SUBMIT',
} as const;

export namespace CloudMoldCatalogCommandApi {
  export interface CommandEnvelopeOverride {
    causationId?: string;
    correlationId?: string;
    idempotencyKey?: string;
    occurredAt?: string;
  }

  export interface DefineSkuCommand {
    barcode: string;
    barcodeType: string;
    baseUomCode: string;
    brandRef: string;
    colorCode: string;
    colorName: string;
    planningCategoryRef: string;
    planningYear: number;
    productName: string;
    salesCategoryRef: string;
    seasonCode: string;
    sizeCode: string;
    sizeGroupCode: string;
    sizeGroupName: string;
    sizeName: string;
    sizeSort: number;
    skuCode: string;
    spuCode: string;
    styleCode: string;
    styleName: string;
    waveCode: string;
  }

  export interface DefineSkuResult {
    aggregateVersion: number;
    canonicalSkuId: string;
    canonicalSpuId: string;
    canonicalStyleId: string;
    colorId: string;
    colorStatus: string;
    colorVersion: number;
    created: boolean;
    duplicate: boolean;
    operationId: number;
    primaryBarcodeId: string;
    sizeGroupId: string;
    sizeGroupStatus: string;
    sizeGroupVersion: number;
    sizeId: string;
    sizeStatus: string;
    sizeVersion: number;
    skuStatus: string;
    spuStatus: string;
    spuVersion: number;
    styleStatus: string;
    styleVersion: number;
  }

  export interface LifecycleResult {
    aggregateVersion: number;
    businessCode: string;
    currentStatus: string;
    duplicate: boolean;
    entityId: string;
    entityType: string;
    operationId: number;
    previousStatus: string;
  }

  export interface MetadataUpdateResult {
    aggregateVersion: number;
    businessCode: string;
    currentStatus: string;
    duplicate: boolean;
    entityId: string;
    entityType: string;
    operationId: number;
  }

  export interface BarcodeRotateResult {
    aggregateVersion: number;
    barcodeType: string;
    currentBarcode: string;
    currentBarcodeId: string;
    duplicate: boolean;
    operationId: number;
    previousBarcode: string;
    previousBarcodeId: string;
    skuId: string;
  }

  export interface MetadataUpdateCommand extends CommandEnvelopeOverride {
    brandRef?: string;
    entityId: string;
    entityType: 'SKU' | 'SPU' | 'STYLE';
    expectedVersion: number;
    planningCategoryRef?: string;
    planningYear?: number;
    productName?: string;
    reason: string;
    salesCategoryRef?: string;
    seasonCode?: string;
    skuCode?: string;
    spuCode?: string;
    styleCode?: string;
    styleName?: string;
    waveCode?: string;
  }

  export interface BarcodeRotateCommand extends CommandEnvelopeOverride {
    barcode: string;
    barcodeType: string;
    expectedVersion: number;
    reason: string;
    skuId: string;
  }
}

function buildCatalogCommandEnvelope(
  override: CloudMoldCatalogCommandApi.CommandEnvelopeOverride = {},
) {
  return {
    ...buildCommandEnvelope(),
    ...override,
  };
}

export function defineCatalogSku(
  payload: CloudMoldCatalogCommandApi.DefineSkuCommand,
) {
  return requestClient.post<CloudMoldCatalogCommandApi.DefineSkuResult>(
    '/cloudmold/catalog/sku/define',
    {
      ...buildCommandEnvelope(),
      ...payload,
      status: 'DRAFT',
    },
  );
}

export function changeCatalogLifecycle(
  entityType: string,
  entityId: string,
  action: string,
  expectedVersion: number,
  reason: string,
) {
  return requestClient.post<CloudMoldCatalogCommandApi.LifecycleResult>(
    '/cloudmold/catalog/lifecycle',
    {
      ...buildCatalogCommandEnvelope(),
      action,
      entityId,
      entityType,
      expectedVersion,
      reason,
    },
  );
}

/**
 * 更新 SKU 自有编码。
 *
 * Style/SPU 的可写字段尚未由详情查询完整返回，前端在查询契约补齐前不开放，
 * 避免用空值覆盖规范元数据。
 */
export function updateCatalogSkuCode(
  skuId: string,
  expectedVersion: number,
  skuCode: string,
  reason: string,
  override: CloudMoldCatalogCommandApi.CommandEnvelopeOverride = {},
) {
  return updateCatalogMetadata({
    ...override,
    entityId: skuId,
    entityType: CatalogEntityType.SKU,
    expectedVersion,
    reason,
    skuCode,
  });
}

export function updateCatalogMetadata(
  payload: CloudMoldCatalogCommandApi.MetadataUpdateCommand,
) {
  return requestClient.post<CloudMoldCatalogCommandApi.MetadataUpdateResult>(
    '/cloudmold/catalog/metadata/update',
    {
      ...buildCatalogCommandEnvelope(payload),
      ...payload,
    },
  );
}

/** 轮换当前主条码；后端原子保留历史条码并推进 SKU 聚合版本。 */
export function rotateCatalogBarcode(
  skuIdOrPayload: CloudMoldCatalogCommandApi.BarcodeRotateCommand | string,
  expectedVersion?: number,
  barcode?: string,
  barcodeType?: string,
  reason?: string,
  override: CloudMoldCatalogCommandApi.CommandEnvelopeOverride = {},
) {
  const payload =
    typeof skuIdOrPayload === 'string'
      ? {
          ...override,
          barcode,
          barcodeType,
          expectedVersion,
          reason,
          skuId: skuIdOrPayload,
        }
      : skuIdOrPayload;
  return requestClient.post<CloudMoldCatalogCommandApi.BarcodeRotateResult>(
    '/cloudmold/catalog/barcode/rotate',
    {
      ...buildCatalogCommandEnvelope(payload),
      ...payload,
    },
  );
}

type MutableDefinition = CloudMoldCatalogCommandApi.DefineSkuResult;

async function activateSimple(
  state: MutableDefinition,
  entityType: string,
  idKey: keyof MutableDefinition,
  statusKey: keyof MutableDefinition,
  versionKey: keyof MutableDefinition,
) {
  const status = String(state[statusKey]);
  if (status === 'ACTIVE') return;
  if (!['DRAFT', 'INACTIVE'].includes(status)) {
    throw new Error(`${entityType} 当前状态 ${status} 不能激活`);
  }
  const result = await changeCatalogLifecycle(
    entityType,
    String(state[idKey]),
    CatalogLifecycleAction.ACTIVATE,
    Number(state[versionKey]),
    '管理后台创建并激活商品',
  );
  state[statusKey] = result.currentStatus as never;
  state[versionKey] = result.aggregateVersion as never;
}

/** 按 Catalog 依赖关系推进完整定义，任一步失败都会保留已成功的可审计状态。 */
export async function activateCatalogDefinition(
  definition: CloudMoldCatalogCommandApi.DefineSkuResult,
) {
  const state = { ...definition };
  await activateSimple(
    state,
    CatalogEntityType.STYLE,
    'canonicalStyleId',
    'styleStatus',
    'styleVersion',
  );
  await activateSimple(
    state,
    CatalogEntityType.COLOR,
    'colorId',
    'colorStatus',
    'colorVersion',
  );
  await activateSimple(
    state,
    CatalogEntityType.SIZE_GROUP,
    'sizeGroupId',
    'sizeGroupStatus',
    'sizeGroupVersion',
  );
  await activateSimple(
    state,
    CatalogEntityType.SIZE,
    'sizeId',
    'sizeStatus',
    'sizeVersion',
  );

  if (state.spuStatus === 'REJECTED') {
    const reset = await changeCatalogLifecycle(
      CatalogEntityType.SPU,
      state.canonicalSpuId,
      CatalogLifecycleAction.RESET_DRAFT,
      state.spuVersion,
      '管理后台重新提交商品',
    );
    state.spuStatus = reset.currentStatus;
    state.spuVersion = reset.aggregateVersion;
  }
  if (state.spuStatus === 'DRAFT') {
    const submitted = await changeCatalogLifecycle(
      CatalogEntityType.SPU,
      state.canonicalSpuId,
      CatalogLifecycleAction.SUBMIT,
      state.spuVersion,
      '管理后台提交商品审核',
    );
    state.spuStatus = submitted.currentStatus;
    state.spuVersion = submitted.aggregateVersion;
  }
  if (state.spuStatus === 'SUBMITTED') {
    const approved = await changeCatalogLifecycle(
      CatalogEntityType.SPU,
      state.canonicalSpuId,
      CatalogLifecycleAction.APPROVE,
      state.spuVersion,
      '管理后台审核通过商品',
    );
    state.spuStatus = approved.currentStatus;
    state.spuVersion = approved.aggregateVersion;
  }

  await activateSimple(
    state,
    CatalogEntityType.SKU,
    'canonicalSkuId',
    'skuStatus',
    'aggregateVersion',
  );
  if (['APPROVED', 'INACTIVE'].includes(state.spuStatus)) {
    const activated = await changeCatalogLifecycle(
      CatalogEntityType.SPU,
      state.canonicalSpuId,
      CatalogLifecycleAction.ACTIVATE,
      state.spuVersion,
      '管理后台激活商品',
    );
    state.spuStatus = activated.currentStatus;
    state.spuVersion = activated.aggregateVersion;
  }
  return state;
}
