import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import {
  codeInput,
  moneyColumn,
  statusInput,
  timeColumn,
} from '../../shared/form-helpers';

export function useAfterSaleFormSchema(): VbenFormSchema[] {
  return [
    codeInput('afterSaleNo', '售后单号'),
    codeInput('orderNo', '订单号'),
    statusInput('caseStatus'),
    statusInput('refundStatus'),
  ];
}

export function useAfterSaleColumns(): VxeTableGridOptions['columns'] {
  return [
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
