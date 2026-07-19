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
    refundId?: string;
    shipmentId?: string;
    shippingAmountMinor: number;
    status: string;
    totalQuantity: string;
    updatedAt: string;
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
    capturedAt?: string;
    createdAt: string;
    currencyCode: string;
    executionMode?: string;
    orderId: string;
    payableAmountMinor: number;
    paymentId: string;
    paymentNo: string;
    providerCode: string;
    providerTransactionReferenceMasked: string;
    refundedAmountMinor: number;
    refundedAt?: string;
    remainingAmountMinor: number;
    status: string;
    testMode: boolean;
    updatedAt: string;
  }

  export interface Fulfillment {
    aggregateVersion: number;
    cancellationRef?: string;
    carrierCode?: string;
    firstSliceShipmentId?: string;
    firstSliceShipmentStatus?: string;
    fulfillmentId: string;
    fulfillmentNo: string;
    itemCount: number;
    orderId: string;
    orderNo: string;
    promisedDeliveryAt?: string;
    sellerId: string;
    status: string;
    totalQuantity: string;
    updatedAt: string;
    warehouseId: string;
    waybillNo?: string;
  }

  export interface FulfillmentDetailItem {
    canonicalSkuId: string;
    createdAt: string;
    fulfillmentItemId: string;
    orderItemId: string;
    quantity: string;
    reservationId: string;
    updatedAt: string;
  }

  export interface FulfillmentDetail {
    aggregateVersion: number;
    cancellationRef?: string;
    carrierCode?: string;
    createdAt: string;
    deliveryPromiseVersionRef?: string;
    firstSliceShipmentId?: string;
    firstSliceShipmentStatus?: string;
    fulfillmentId: string;
    fulfillmentNo: string;
    itemCount: number;
    items: FulfillmentDetailItem[];
    orderId: string;
    orderNo: string;
    promisedDeliveryAt?: string;
    sellerId: string;
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
    afterSaleType: string;
    approvedAmountMinor?: number;
    canonicalSkuId: string;
    caseStatus: string;
    createdAt: string;
    currencyCode: string;
    orderId: string;
    orderNo: string;
    quantity: string;
    reasonCode: string;
    refundStatus: string;
    resolutionSagaActiveStep?: string;
    resolutionSagaAttemptCount?: number;
    resolutionSagaId?: string;
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
    caseStatus?: string;
    orderNo?: string;
    refundStatus?: string;
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

/** 查询单个规范支付详情，不读取 yudao Mall Pay 表。 */
export function getCloudMoldPaymentDetail(paymentId: string) {
  return requestClient.get<CloudMoldCommerceApi.Payment | null>(
    '/cloudmold/payment/get',
    { params: { paymentId } },
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

/** 查询单个规范履约详情（含订单行），不读取 yudao Trade 表。 */
export function getCloudMoldFulfillmentDetail(fulfillmentId: string) {
  return requestClient.get<CloudMoldCommerceApi.FulfillmentDetail | null>(
    '/cloudmold/fulfillment/get',
    { params: { fulfillmentId } },
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
