import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

/**
 * CloudMold 规范商家 / 店铺只读查询 API。
 * 仅读取 cloudmold_merchant_account / cloudmold_merchant_shop 权威表。
 */
export namespace CloudMoldMerchantApi {
  export interface Merchant {
    legalEntityId: string;
    legalName?: string;
    merchantCode: string;
    merchantId: string;
    status: string;
    updatedAt: string;
    version: number;
  }

  export interface Shop {
    channelCode: string;
    externalShopId?: string;
    merchantCode?: string;
    merchantId: string;
    shopId: string;
    status: string;
    updatedAt: string;
    version: number;
  }

  export interface MerchantPageParams extends PageParam {
    legalName?: string;
    merchantCode?: string;
    status?: string;
  }

  export interface ShopPageParams extends PageParam {
    channelCode?: string;
    merchantId?: string;
    status?: string;
  }
}

export function getCloudMoldMerchantPage(
  params: CloudMoldMerchantApi.MerchantPageParams,
) {
  return requestClient.get<PageResult<CloudMoldMerchantApi.Merchant>>(
    '/cloudmold/merchant/merchants/page',
    { params },
  );
}

export function getCloudMoldMerchantShopPage(
  params: CloudMoldMerchantApi.ShopPageParams,
) {
  return requestClient.get<PageResult<CloudMoldMerchantApi.Shop>>(
    '/cloudmold/merchant/shops/page',
    { params },
  );
}
