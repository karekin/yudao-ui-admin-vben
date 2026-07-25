import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import {
  codeInput,
  enumColumn,
  statusSelect,
  timeColumn,
  withCloudMoldTableColumns,
} from '../../shared/form-helpers';

/** Fulfillment 履约状态机枚举（值用于行内按钮 ifShow 比较） */
export const FulfillmentStatus = {
  CANCELLATION_PENDING: 'CANCELLATION_PENDING',
  CANCELLED: 'CANCELLED',
  CREATED: 'CREATED',
  DELIVERED: 'DELIVERED',
  IN_TRANSIT: 'IN_TRANSIT',
  SHIPPED: 'SHIPPED',
};

export function useFulfillmentFormSchema(): VbenFormSchema[] {
  return [
    codeInput('fulfillmentNo', '履约单号'),
    codeInput('orderNo', '订单号'),
    codeInput('warehouseId', '仓库 ID'),
    codeInput('waybillNo', '运单号'),
    statusSelect('status', Object.values(FulfillmentStatus)),
  ];
}

export function useFulfillmentColumns(): VxeTableGridOptions['columns'] {
  return withCloudMoldTableColumns([
    {
      field: 'fulfillmentNo',
      fixed: 'left',
      minWidth: 170,
      slots: { default: 'fulfillment-no' },
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
    {
      field: 'firstSliceShipmentStatus',
      minWidth: 130,
      slots: { default: 'shipment-status' },
      title: '发运状态',
    },
    enumColumn('carrierCode', '承运商', 110),
    { field: 'waybillNo', minWidth: 160, title: '运单号' },
    timeColumn('promisedDeliveryAt', '承诺送达'),
    { field: 'cancellationRef', minWidth: 180, title: '取消引用' },
    { field: 'aggregateVersion', minWidth: 80, title: '版本' },
    timeColumn('updatedAt', '更新时间'),
    {
      field: 'action',
      fixed: 'right',
      minWidth: 190,
      slots: { default: 'action' },
      title: '操作',
    },
  ]);
}
