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

const paymentStatuses = ['CAPTURED', 'PARTIALLY_REFUNDED', 'REFUNDED'];

export function usePaymentFormSchema(): VbenFormSchema[] {
  return [
    codeInput('paymentNo', '支付单号'),
    codeInput('orderId', '订单 ID'),
    codeInput('providerCode', '支付提供方'),
    statusSelect('status', paymentStatuses),
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

export function usePaymentColumns(): VxeTableGridOptions['columns'] {
  return withCloudMoldTableColumns([
    {
      field: 'paymentNo',
      fixed: 'left',
      minWidth: 170,
      slots: { default: 'payment-no' },
      title: '支付单号',
    },
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
    enumColumn('providerCode', '支付提供方', 130),
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
    {
      field: 'action',
      fixed: 'right',
      minWidth: 80,
      slots: { default: 'action' },
      title: '操作',
    },
  ]);
}
