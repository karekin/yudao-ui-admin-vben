import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import {
  codeInput,
  enumColumn,
  withCloudMoldTableColumns,
} from '../shared/form-helpers';
import { cloudMoldEnumLabel } from '../shared/status-meta';

export const reservationStatusMeta: Record<
  number,
  { color: string; label: string }
> = {
  10: { color: 'processing', label: '生效中' },
  20: { color: 'success', label: '已提交' },
  30: { color: 'default', label: '已释放' },
};

export const stockStatusMeta: Record<string, { color: string; label: string }> =
  {
    NON_SELLABLE: { color: 'warning', label: '不可售' },
    SELLABLE: { color: 'success', label: '可售' },
  };

export const qualityStatusMeta: Record<
  string,
  { color: string; label: string }
> = {
  DAMAGED: { color: 'error', label: '残次' },
  PENDING_QC: { color: 'processing', label: '待质检' },
  QUALIFIED: { color: 'success', label: '合格' },
  REJECTED: { color: 'error', label: '拒收' },
};

export function useBalanceFormSchema(): VbenFormSchema[] {
  return [
    codeInput('skuCode', 'SKU 编码'),
    codeInput('warehouseCode', '仓库编码'),
    codeInput('locationCode', '库位编码'),
    codeInput('lotCode', '批次编码'),
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: Object.entries(stockStatusMeta).map(([value, meta]) => ({
          label: meta.label,
          value,
        })),
      },
      fieldName: 'stockStatus',
      label: '库存状态',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: Object.entries(qualityStatusMeta).map(([value, meta]) => ({
          label: meta.label,
          value,
        })),
      },
      fieldName: 'qualityStatus',
      label: '质量状态',
    },
  ];
}

export function useReservationFormSchema(): VbenFormSchema[] {
  return [
    codeInput('businessId', '业务 ID'),
    codeInput('skuCode', 'SKU 编码'),
    codeInput('warehouseCode', '仓库编码'),
    codeInput('lotCode', '批次编码'),
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: Object.entries(reservationStatusMeta).map(([value, meta]) => ({
          label: meta.label,
          value: Number(value),
        })),
      },
      fieldName: 'status',
      label: '预占状态',
    },
  ];
}

export function useLedgerFormSchema(): VbenFormSchema[] {
  return [
    codeInput('businessNo', '业务单号'),
    codeInput('skuCode', 'SKU 编码'),
    codeInput('warehouseCode', '仓库编码'),
    codeInput('lotCode', '批次编码'),
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          'RECEIVE',
          'RESERVE',
          'SHIP',
          'RETURN',
          'RELEASE',
          'MIGRATION_OPENING',
        ].map((value) => ({ label: cloudMoldEnumLabel(value), value })),
      },
      fieldName: 'commandType',
      label: '动作',
    },
  ];
}

export function useBalanceColumns(): VxeTableGridOptions['columns'] {
  return withCloudMoldTableColumns([
    { field: 'skuCode', fixed: 'left', minWidth: 190, title: '规范 SKU' },
    { field: 'spuCode', minWidth: 150, title: 'SPU' },
    { field: 'warehouseCode', minWidth: 140, title: '仓库' },
    { field: 'locationCode', minWidth: 140, title: '库位' },
    { field: 'lotCode', minWidth: 140, title: '批次' },
    enumColumn('ownerType', '货主类型', 110),
    { field: 'ownerId', minWidth: 200, title: '货主 ID' },
    {
      field: 'stockStatus',
      minWidth: 100,
      slots: { default: 'stock-status' },
      title: '库存状态',
    },
    {
      field: 'qualityStatus',
      minWidth: 100,
      slots: { default: 'quality-status' },
      title: '质量状态',
    },
    {
      field: 'onHandQuantity',
      minWidth: 110,
      slots: { default: 'quantity' },
      title: '在手',
    },
    {
      field: 'reservedQuantity',
      minWidth: 110,
      slots: { default: 'quantity' },
      title: '预占',
    },
    {
      field: 'availableQuantity',
      minWidth: 110,
      slots: { default: 'quantity' },
      title: '可用',
    },
    {
      field: 'allocatableQuantity',
      minWidth: 110,
      slots: { default: 'quantity' },
      title: '可分配',
    },
    enumColumn('allocationEligibility', '分配资格', 170),
    {
      field: 'inTransitQuantity',
      minWidth: 110,
      slots: { default: 'quantity' },
      title: '在途',
    },
    enumColumn('baseUomCode', '计量单位', 90),
    { field: 'aggregateVersion', minWidth: 90, title: '版本' },
    {
      field: 'updatedAt',
      formatter: 'formatDateTime',
      minWidth: 170,
      title: '更新时间',
    },
    {
      field: 'action',
      fixed: 'right',
      minWidth: 220,
      slots: { default: 'action' },
      title: '操作',
    },
  ]);
}

export function useReservationColumns(): VxeTableGridOptions['columns'] {
  return withCloudMoldTableColumns([
    {
      field: 'reservationId',
      fixed: 'left',
      minWidth: 220,
      title: '预占 ID',
    },
    { field: 'allocationId', minWidth: 220, title: '分配 ID' },
    enumColumn('businessType', '业务类型', 130),
    { field: 'businessId', minWidth: 180, title: '业务 ID' },
    { field: 'businessItemId', minWidth: 180, title: '业务行 ID' },
    { field: 'skuCode', minWidth: 180, title: '规范 SKU' },
    { field: 'warehouseCode', minWidth: 130, title: '仓库' },
    { field: 'locationCode', minWidth: 130, title: '库位' },
    { field: 'lotCode', minWidth: 130, title: '批次' },
    {
      field: 'quantity',
      minWidth: 110,
      slots: { default: 'quantity' },
      title: '预占数量',
    },
    {
      field: 'allocationQuantity',
      minWidth: 110,
      slots: { default: 'quantity' },
      title: '分配数量',
    },
    {
      field: 'status',
      minWidth: 100,
      slots: { default: 'reservation-status' },
      title: '状态',
    },
    {
      field: 'allocationStatus',
      minWidth: 100,
      slots: { default: 'allocation-status' },
      title: '分配状态',
    },
    enumColumn('baseUomCode', '计量单位', 90),
    { field: 'version', minWidth: 90, title: '版本' },
    {
      field: 'updatedAt',
      formatter: 'formatDateTime',
      minWidth: 170,
      title: '更新时间',
    },
    {
      field: 'action',
      fixed: 'right',
      minWidth: 140,
      slots: { default: 'action' },
      title: '操作',
    },
  ]);
}

export function useLedgerColumns(): VxeTableGridOptions['columns'] {
  return withCloudMoldTableColumns([
    {
      field: 'ledgerEntryId',
      fixed: 'left',
      minWidth: 110,
      title: '分录 ID',
    },
    enumColumn('commandType', '动作', 140),
    enumColumn('entryRole', '分录角色', 100),
    { field: 'businessNo', minWidth: 180, title: '业务单号' },
    enumColumn('businessType', '业务类型', 130),
    { field: 'skuCode', minWidth: 180, title: '规范 SKU' },
    { field: 'warehouseCode', minWidth: 130, title: '仓库' },
    { field: 'locationCode', minWidth: 130, title: '库位' },
    { field: 'lotCode', minWidth: 130, title: '批次' },
    {
      field: 'deltaOnHandQuantity',
      minWidth: 110,
      slots: { default: 'quantity' },
      title: '在手变化',
    },
    {
      field: 'deltaReservedQuantity',
      minWidth: 110,
      slots: { default: 'quantity' },
      title: '预占变化',
    },
    {
      field: 'deltaInTransitQuantity',
      minWidth: 110,
      slots: { default: 'quantity' },
      title: '在途变化',
    },
    enumColumn('baseUomCode', '计量单位', 90),
    { field: 'aggregateVersion', minWidth: 90, title: '版本' },
    {
      field: 'occurredAt',
      formatter: 'formatDateTime',
      minWidth: 170,
      title: '发生时间',
    },
  ]);
}
