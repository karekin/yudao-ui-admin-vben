import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { codeInput, statusInput, timeColumn } from '../../shared/form-helpers';

export function useFulfillmentFormSchema(): VbenFormSchema[] {
  return [
    codeInput('fulfillmentNo', '履约单号'),
    codeInput('orderNo', '订单号'),
    codeInput('warehouseId', '仓库 ID'),
    codeInput('waybillNo', '运单号'),
    statusInput(),
  ];
}

export function useFulfillmentColumns(): VxeTableGridOptions['columns'] {
  return [
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
    { field: 'firstSliceShipmentStatus', minWidth: 130, title: '发运状态' },
    { field: 'carrierCode', minWidth: 110, title: '承运商' },
    { field: 'waybillNo', minWidth: 160, title: '运单号' },
    timeColumn('promisedDeliveryAt', '承诺送达'),
    { field: 'cancellationRef', minWidth: 180, title: '取消引用' },
    { field: 'aggregateVersion', minWidth: 80, title: '版本' },
    timeColumn('updatedAt', '更新时间'),
    {
      field: 'action',
      fixed: 'right',
      minWidth: 80,
      slots: { default: 'action' },
      title: '操作',
    },
  ];
}
