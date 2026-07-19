import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

const codeInput = (fieldName: string, label: string): VbenFormSchema => ({
  component: 'Input',
  componentProps: { allowClear: true, placeholder: `输入${label}` },
  fieldName,
  label,
});

const statusInput = (fieldName = 'status'): VbenFormSchema =>
  codeInput(fieldName, '状态编码');

const moneyColumn = (field: string, title: string) => ({
  field,
  formatter: 'formatFenToYuanAmount',
  minWidth: 120,
  title,
});

const timeColumn = (field: string, title: string) => ({
  field,
  formatter: 'formatDateTime',
  minWidth: 170,
  title,
});

export function useListingFormSchema(): VbenFormSchema[] {
  return [
    codeInput('listingNo', '刊登单号'),
    codeInput('title', '标题'),
    codeInput('channelCode', '渠道编码'),
    codeInput('shopId', '店铺 ID'),
    statusInput(),
  ];
}

export function useOrderFormSchema(): VbenFormSchema[] {
  return [
    codeInput('orderNo', '订单号'),
    codeInput('buyerId', '规范买家 ID'),
    statusInput(),
  ];
}

export function usePaymentFormSchema(): VbenFormSchema[] {
  return [
    codeInput('paymentNo', '支付单号'),
    codeInput('orderId', '订单 ID'),
    codeInput('providerCode', '支付提供方'),
    statusInput(),
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: '测试通道', value: true },
          { label: '真实通道', value: false },
        ],
      },
      fieldName: 'testMode',
      label: '通道模式',
    },
  ];
}

export function useFulfillmentFormSchema(): VbenFormSchema[] {
  return [
    codeInput('fulfillmentNo', '履约单号'),
    codeInput('orderNo', '订单号'),
    codeInput('warehouseId', '仓库 ID'),
    codeInput('waybillNo', '运单号'),
    statusInput(),
  ];
}

export function useAfterSaleFormSchema(): VbenFormSchema[] {
  return [
    codeInput('afterSaleNo', '售后单号'),
    codeInput('orderNo', '订单号'),
    statusInput('caseStatus'),
    statusInput('refundStatus'),
  ];
}

export function useListingColumns(): VxeTableGridOptions['columns'] {
  return [
    { field: 'listingNo', fixed: 'left', minWidth: 170, title: '刊登单号' },
    { field: 'title', minWidth: 220, title: '标题' },
    { field: 'channelCode', minWidth: 110, title: '渠道' },
    { field: 'shopId', minWidth: 150, title: '店铺 ID' },
    { field: 'canonicalSpuId', minWidth: 180, title: '规范 SPU ID' },
    { field: 'revision', minWidth: 80, title: '修订' },
    {
      field: 'status',
      minWidth: 130,
      slots: { default: 'status' },
      title: '状态',
    },
    { field: 'offerCount', minWidth: 90, title: '报价数' },
    { field: 'enabledOfferCount', minWidth: 110, title: '启用报价' },
    moneyColumn('minPriceMinor', '最低价（元）'),
    moneyColumn('maxPriceMinor', '最高价（元）'),
    { field: 'completionPassed', minWidth: 100, title: '完整性' },
    { field: 'businessApproved', minWidth: 100, title: '业务审批' },
    { field: 'riskApproved', minWidth: 100, title: '风控审批' },
    timeColumn('publishStartAt', '发布开始'),
    timeColumn('publishEndAt', '发布结束'),
    { field: 'aggregateVersion', minWidth: 80, title: '版本' },
    timeColumn('updatedAt', '更新时间'),
  ];
}

export function useOrderColumns(): VxeTableGridOptions['columns'] {
  return [
    { field: 'orderNo', fixed: 'left', minWidth: 170, title: '订单号' },
    { field: 'buyerId', minWidth: 170, title: '规范买家 ID' },
    {
      field: 'status',
      minWidth: 150,
      slots: { default: 'status' },
      title: '状态',
    },
    { field: 'itemCount', minWidth: 90, title: '行数' },
    { field: 'totalQuantity', minWidth: 100, title: '总数量' },
    moneyColumn('productAmountMinor', '商品额（元）'),
    moneyColumn('shippingAmountMinor', '运费（元）'),
    moneyColumn('discountAmountMinor', '优惠（元）'),
    moneyColumn('payableAmountMinor', '应付（元）'),
    { field: 'currencyCode', minWidth: 80, title: '币种' },
    { field: 'paymentId', minWidth: 180, title: '支付 ID' },
    { field: 'paymentStatus', minWidth: 130, title: '支付状态' },
    { field: 'fulfillmentId', minWidth: 180, title: '履约 ID' },
    { field: 'fulfillmentStatus', minWidth: 130, title: '履约状态' },
    { field: 'shipmentId', minWidth: 180, title: '发运 ID' },
    { field: 'refundId', minWidth: 180, title: '退款 ID' },
    { field: 'cancellationSagaId', minWidth: 180, title: '取消 Saga' },
    { field: 'aggregateVersion', minWidth: 80, title: '版本' },
    timeColumn('createdAt', '创建时间'),
    timeColumn('updatedAt', '更新时间'),
  ];
}

export function usePaymentColumns(): VxeTableGridOptions['columns'] {
  return [
    { field: 'paymentNo', fixed: 'left', minWidth: 170, title: '支付单号' },
    { field: 'orderId', minWidth: 180, title: '订单 ID' },
    {
      field: 'status',
      minWidth: 120,
      slots: { default: 'status' },
      title: '状态',
    },
    moneyColumn('payableAmountMinor', '应付（元）'),
    moneyColumn('capturedAmountMinor', '已收（元）'),
    moneyColumn('refundedAmountMinor', '已退（元）'),
    moneyColumn('remainingAmountMinor', '可退余额（元）'),
    { field: 'providerCode', minWidth: 130, title: '支付提供方' },
    {
      field: 'testMode',
      minWidth: 110,
      slots: { default: 'test-mode' },
      title: '通道模式',
    },
    {
      field: 'providerTransactionReferenceMasked',
      minWidth: 190,
      title: '提供方流水（脱敏）',
    },
    { field: 'currencyCode', minWidth: 80, title: '币种' },
    { field: 'aggregateVersion', minWidth: 80, title: '版本' },
    timeColumn('createdAt', '创建时间'),
    timeColumn('updatedAt', '更新时间'),
  ];
}

export function useFulfillmentColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'fulfillmentNo',
      fixed: 'left',
      minWidth: 170,
      title: '履约单号',
    },
    { field: 'orderNo', minWidth: 170, title: '订单号' },
    {
      field: 'status',
      minWidth: 130,
      slots: { default: 'status' },
      title: '状态',
    },
    { field: 'sellerId', minWidth: 150, title: '卖家 ID' },
    { field: 'warehouseId', minWidth: 150, title: '仓库 ID' },
    { field: 'itemCount', minWidth: 90, title: '行数' },
    { field: 'totalQuantity', minWidth: 100, title: '总数量' },
    { field: 'firstSliceShipmentStatus', minWidth: 130, title: '发运状态' },
    { field: 'carrierCode', minWidth: 110, title: '承运商' },
    { field: 'waybillNo', minWidth: 160, title: '运单号' },
    timeColumn('promisedDeliveryAt', '承诺送达'),
    { field: 'cancellationRef', minWidth: 180, title: '取消引用' },
    { field: 'aggregateVersion', minWidth: 80, title: '版本' },
    timeColumn('updatedAt', '更新时间'),
  ];
}

export function useAfterSaleColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'afterSaleNo',
      fixed: 'left',
      minWidth: 170,
      title: '售后单号',
    },
    { field: 'orderNo', minWidth: 170, title: '订单号' },
    {
      field: 'caseStatus',
      minWidth: 130,
      slots: { default: 'status' },
      title: '售后状态',
    },
    { field: 'refundStatus', minWidth: 130, title: '退款状态' },
    { field: 'afterSaleType', minWidth: 120, title: '类型' },
    { field: 'reasonCode', minWidth: 140, title: '原因编码' },
    { field: 'responsibility', minWidth: 140, title: '责任编码' },
    { field: 'canonicalSkuId', minWidth: 180, title: '规范 SKU ID' },
    { field: 'quantity', minWidth: 100, title: '数量' },
    moneyColumn('approvedAmountMinor', '批准金额（元）'),
    { field: 'returnFulfillmentId', minWidth: 180, title: '退货履约 ID' },
    { field: 'resolutionSagaStatus', minWidth: 140, title: '编排状态' },
    { field: 'resolutionSagaActiveStep', minWidth: 150, title: '当前步骤' },
    {
      field: 'resolutionSagaAttemptCount',
      minWidth: 100,
      title: '尝试次数',
    },
    {
      field: 'resolutionSagaLastErrorCode',
      minWidth: 140,
      title: '错误编码',
    },
    { field: 'aggregateVersion', minWidth: 80, title: '版本' },
    timeColumn('createdAt', '创建时间'),
    timeColumn('updatedAt', '更新时间'),
  ];
}
