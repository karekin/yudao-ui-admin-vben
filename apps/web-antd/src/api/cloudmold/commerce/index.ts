import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace CloudMoldCommerceApi {
  export interface Listing {
    businessApproved: boolean;
    canonicalSpuId: string;
    channelCode: string;
    completionPassed: boolean;
    currencyCode: string;
    enabledOfferCount: number;
    listingId: string;
    listingNo: string;
    maxPriceMinor?: number;
    merchantId: string;
    minPriceMinor?: number;
    offerCount: number;
    publishEndAt?: string;
    publishStartAt?: string;
    revision: number;
    riskApproved: boolean;
    shopId: string;
    status: string;
    title: string;
    updatedAt: string;
    version: number;
  }

  export interface Order {
    aggregateVersion: number;
    buyerId: string;
    cancellationSagaId?: string;
    createdAt: string;
    currencyCode: string;
    discountAmountMinor: number;
    fulfillmentId?: string;
    fulfillmentStatus?: string;
    itemCount: number;
    orderId: string;
    orderNo: string;
    payableAmountMinor: number;
    paymentId?: string;
    paymentStatus?: string;
    productAmountMinor: number;
    shippingAmountMinor: number;
    shipmentId?: string;
    status: string;
    totalQuantity: string;
    updatedAt: string;
    refundId?: string;
  }

  export interface OrderDetailItem {
    canonicalSkuId: string;
    channelCode?: string;
    createdAt: string;
    discountAmountMinor?: number;
    lineAmountMinor?: number;
    lineKey?: string;
    listingId?: string;
    listingOfferId?: string;
    listingRevision?: number;
    listingVersion?: number;
    merchandiseCostMinor?: number;
    netAmountMinor?: number;
    orderItemId: string;
    quantity: string;
    reservationId?: string;
    shopId?: string;
    unitPriceMinor?: number;
    updatedAt: string;
  }

  export interface OrderDetail {
    aggregateVersion: number;
    buyerId: string;
    cancellationResponsibilityCode?: string;
    cancellationResponsibilityParty?: string;
    cancellationSagaId?: string;
    createdAt: string;
    currencyCode: string;
    discountAmountMinor: number;
    fulfillmentId?: string;
    fulfillmentStatus?: string;
    itemCount: number;
    items: OrderDetailItem[];
    orderId: string;
    orderNo: string;
    payableAmountMinor: number;
    paymentId?: string;
    paymentStatus?: string;
    preCancellationStatus?: string;
    productAmountMinor: number;
    refundId?: string;
    runId?: string;
    shippingAmountMinor: number;
    shipmentId?: string;
    status: string;
    totalQuantity: string;
    updatedAt: string;
  }

  export interface Payment {
    aggregateVersion: number;
    capturedAmountMinor: number;
    createdAt: string;
    currencyCode: string;
    orderId: string;
    payableAmountMinor: number;
    paymentId: string;
    paymentNo: string;
    providerCode: string;
    providerTransactionReferenceMasked: string;
    refundedAmountMinor: number;
    remainingAmountMinor: number;
    status: string;
    testMode: boolean;
    updatedAt: string;
  }

  export interface Fulfillment {
    carrierCode?: string;
    cancellationRef?: string;
    aggregateVersion: number;
    fulfillmentId: string;
    fulfillmentNo: string;
    itemCount: number;
    orderId: string;
    orderNo: string;
    promisedDeliveryAt?: string;
    sellerId: string;
    firstSliceShipmentId?: string;
    firstSliceShipmentStatus?: string;
    status: string;
    totalQuantity: string;
    updatedAt: string;
    warehouseId: string;
    waybillNo?: string;
  }

  export interface AfterSale {
    aggregateVersion: number;
    afterSaleId: string;
    afterSaleNo: string;
    approvedAmountMinor?: number;
    afterSaleType: string;
    canonicalSkuId: string;
    caseStatus: string;
    createdAt: string;
    currencyCode: string;
    orderId: string;
    orderNo: string;
    quantity: string;
    reasonCode: string;
    refundStatus: string;
    resolutionSagaId?: string;
    resolutionSagaActiveStep?: string;
    resolutionSagaAttemptCount?: number;
    resolutionSagaLastErrorCode?: string;
    resolutionSagaStatus?: string;
    responsibility?: string;
    returnFulfillmentId?: string;
    updatedAt: string;
  }

  export interface ListingPageParams extends PageParam {
    channelCode?: string;
    listingNo?: string;
    shopId?: string;
    status?: string;
    title?: string;
  }

  export interface OrderPageParams extends PageParam {
    buyerId?: string;
    orderNo?: string;
    status?: string;
  }

  export interface PaymentPageParams extends PageParam {
    orderId?: string;
    paymentNo?: string;
    providerCode?: string;
    status?: string;
    testMode?: boolean;
  }

  export interface FulfillmentPageParams extends PageParam {
    fulfillmentNo?: string;
    orderNo?: string;
    status?: string;
    warehouseId?: string;
    waybillNo?: string;
  }

  export interface AfterSalePageParams extends PageParam {
    afterSaleNo?: string;
    orderNo?: string;
    refundStatus?: string;
    caseStatus?: string;
  }
}

export function getCloudMoldListingPage(
  params: CloudMoldCommerceApi.ListingPageParams,
) {
  return requestClient.get<PageResult<CloudMoldCommerceApi.Listing>>(
    '/cloudmold/listing/page',
    { params },
  );
}

export function getCloudMoldOrderPage(
  params: CloudMoldCommerceApi.OrderPageParams,
) {
  return requestClient.get<PageResult<CloudMoldCommerceApi.Order>>(
    '/cloudmold/order/page',
    { params },
  );
}

/** 查询单个规范订单详情（含订单行），不读取 yudao Trade 表。 */
export function getCloudMoldOrderDetail(orderId: string) {
  return requestClient.get<CloudMoldCommerceApi.OrderDetail | null>(
    '/cloudmold/order/get',
    { params: { orderId } },
  );
}

export function getCloudMoldPaymentPage(
  params: CloudMoldCommerceApi.PaymentPageParams,
) {
  return requestClient.get<PageResult<CloudMoldCommerceApi.Payment>>(
    '/cloudmold/payment/page',
    { params },
  );
}

export function getCloudMoldFulfillmentPage(
  params: CloudMoldCommerceApi.FulfillmentPageParams,
) {
  return requestClient.get<PageResult<CloudMoldCommerceApi.Fulfillment>>(
    '/cloudmold/fulfillment/page',
    { params },
  );
}

export function getCloudMoldAfterSalePage(
  params: CloudMoldCommerceApi.AfterSalePageParams,
) {
  return requestClient.get<PageResult<CloudMoldCommerceApi.AfterSale>>(
    '/cloudmold/aftersale/page',
    { params },
  );
}
