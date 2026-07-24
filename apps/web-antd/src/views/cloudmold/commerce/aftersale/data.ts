import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import {
  codeInput,
  enumColumn,
  moneyColumn,
  statusSelect,
  timeColumn,
  withCloudMoldTableColumns,
} from '../../shared/form-helpers';

/** AfterSale 售后 case 状态机枚举（前端状态字段是 caseStatus，非 status） */
export const AfterSaleCaseStatus = {
  APPROVED: 'APPROVED',
  REQUESTED: 'REQUESTED',
  RESOLUTION_PENDING: 'RESOLUTION_PENDING',
};

export function useAfterSaleFormSchema(): VbenFormSchema[] {
  return [
    codeInput('afterSaleNo', '售后单号'),
    codeInput('orderNo', '订单号'),
    statusSelect('caseStatus', Object.values(AfterSaleCaseStatus), '售后状态'),
    statusSelect(
      'refundStatus',
      ['REQUESTED', 'SUCCEEDED', 'FAILED'],
      '退款状态',
    ),
  ];
}

export function useAfterSaleColumns(): VxeTableGridOptions['columns'] {
  return withCloudMoldTableColumns([
    {
      field: 'afterSaleNo',
      fixed: 'left',
      minWidth: 170,
      slots: { default: 'after-sale-no' },
      title: '售后单号',
    },
    { field: 'orderNo', minWidth: 170, title: '订单号' },
    {
      field: 'caseStatus',
      minWidth: 130,
      slots: { default: 'status' },
      title: '售后状态',
    },
    {
      field: 'refundStatus',
      minWidth: 130,
      slots: { default: 'refund-status' },
      title: '退款状态',
    },
    enumColumn('afterSaleType', '售后类型', 120),
    enumColumn('reasonCode', '售后原因', 140),
    enumColumn('responsibility', '责任方', 140),
    { field: 'canonicalSkuId', minWidth: 180, title: '规范 SKU ID' },
    { field: 'quantity', minWidth: 100, title: '数量' },
    moneyColumn('approvedAmountMinor', '批准金额（元）'),
    { field: 'returnFulfillmentId', minWidth: 180, title: '退货履约 ID' },
    {
      field: 'resolutionSagaStatus',
      minWidth: 140,
      slots: { default: 'saga-status' },
      title: '处理状态',
    },
    enumColumn('resolutionSagaActiveStep', '当前步骤', 150),
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
    {
      field: 'action',
      fixed: 'right',
      minWidth: 80,
      slots: { default: 'action' },
      title: '操作',
    },
  ]);
}
