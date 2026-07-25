import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace CloudMoldCatalogApi {
  export interface Sku {
    aggregateVersion: number;
    baseUomCode: string;
    canonicalSkuId: string;
    canonicalSpuId: string;
    canonicalStyleId: string;
    catalogStatus: number;
    colorCode: string;
    colorName: string;
    primaryBarcode?: string;
    productName: string;
    sizeCode: string;
    sizeGroupCode: string;
    sizeName: string;
    skuCode: string;
    spuCode: string;
    styleCode: string;
    styleName: string;
    updatedAt: string;
  }

  export interface SkuPageParams extends PageParam {
    skuCode?: string;
    spuCode?: string;
    status?: number;
  }

  export interface SkuBarcode {
    barcode: string;
    barcodeId: string;
    barcodeType?: string;
    isPrimary?: boolean;
    status?: number;
    validFrom?: string;
    validTo?: string;
  }

  export interface SkuDetail {
    aggregateVersion: number;
    barcodes: SkuBarcode[];
    baseUomCode: string;
    canonicalSkuId: string;
    canonicalSpuId: string;
    canonicalStyleId: string;
    catalogStatus: number;
    colorCode: string;
    colorId?: string;
    colorName: string;
    createdAt: string;
    primaryBarcode?: string;
    productName: string;
    sizeCode: string;
    sizeGroupId: string;
    sizeGroupCode: string;
    sizeId?: string;
    sizeName: string;
    skuCode: string;
    spuCode: string;
    styleCode: string;
    styleName: string;
    updatedAt: string;
    variantKey?: string;
    variantKeyHash?: string;
    colorStatus: number;
    colorVersion: number;
    sizeGroupStatus: number;
    sizeGroupVersion: number;
    sizeStatus: number;
    sizeVersion: number;
    spuStatus: number;
    spuVersion: number;
    styleStatus: number;
    styleVersion: number;
  }
}

/** 查询当前租户的 CloudMold 规范 SKU，不读取 yudao Product/ERP/WMS 商品表。 */
export function getCloudMoldCatalogSkuPage(
  params: CloudMoldCatalogApi.SkuPageParams,
) {
  return requestClient.get<PageResult<CloudMoldCatalogApi.Sku>>(
    '/cloudmold/catalog/skus/page',
    { params },
  );
}

/** 查询单个规范 SKU 详情（含条码列表），不读取 yudao 商品表。 */
export function getCloudMoldCatalogSkuDetail(skuId: string) {
  return requestClient.get<CloudMoldCatalogApi.SkuDetail | null>(
    '/cloudmold/catalog/skus/get',
    { params: { skuId } },
  );
}
