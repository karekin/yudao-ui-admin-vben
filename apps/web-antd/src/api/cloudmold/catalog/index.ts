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
