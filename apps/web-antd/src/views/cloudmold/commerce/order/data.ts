import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import {
  codeInput,
  moneyColumn,
  statusSelect,
  timeColumn,
  withCloudMoldTableColumns,
} from '../../shared/form-helpers';

/** Order 订单状态机枚举（值用于行内按钮 ifShow 比较） */
export const OrderStatus = {
  CANCELLATION_PENDING: 'CANCELLATION_PENDING',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
  INVENTORY_RESERVED: 'INVENTORY_RESERVED',
  PAYMENT_CONFIRMED: 'PAYMENT_CONFIRMED',
  PLACED: 'PLACED',
  SHIPPED: 'SHIPPED',
};

export function useOrderFormSchema(): VbenFormSchema[] {
  return [
    codeInput('orderNo', '订单号'),
    codeInput('buyerId', '规范买家 ID'),
    statusSelect('status', Object.values(OrderStatus)),
  ];
}

export function useOrderColumns(): VxeTableGridOptions['columns'] {
  return withCloudMoldTableColumns([
    {
      field: 'orderNo',
      fixed: 'left',
      minWidth: 170,
      slots: { default: 'order-no' },
      title: '订单号',
    },
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
    {
      field: 'paymentStatus',
      minWidth: 130,
      slots: { default: 'payment-status' },
      title: '支付状态',
    },
    { field: 'fulfillmentId', minWidth: 180, title: '履约 ID' },
    {
      field: 'fulfillmentStatus',
      minWidth: 130,
      slots: { default: 'fulfillment-status' },
      title: '履约状态',
    },
    { field: 'shipmentId', minWidth: 180, title: '发运 ID' },
    { field: 'refundId', minWidth: 180, title: '退款 ID' },
    { field: 'cancellationSagaId', minWidth: 180, title: '取消 Saga' },
    { field: 'aggregateVersion', minWidth: 80, title: '版本' },
    timeColumn('createdAt', '创建时间'),
    timeColumn('updatedAt', '更新时间'),
    {
      field: 'action',
      fixed: 'right',
      minWidth: 160,
      slots: { default: 'action' },
      title: '操作',
    },
  ]);
}
