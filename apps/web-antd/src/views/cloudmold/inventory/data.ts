import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

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

const codeInput = (fieldName: string, label: string): VbenFormSchema => ({
  component: 'Input',
  componentProps: { allowClear: true, placeholder: `输入${label}` },
  fieldName,
  label,
});

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
        ].map((value) => ({ label: value, value })),
      },
      fieldName: 'commandType',
      label: '动作',
    },
  ];
}

export function useBalanceColumns(): VxeTableGridOptions['columns'] {
  return [
    { field: 'skuCode', fixed: 'left', minWidth: 190, title: '规范 SKU' },
    { field: 'spuCode', minWidth: 150, title: 'SPU' },
    { field: 'warehouseCode', minWidth: 140, title: '仓库' },
    { field: 'locationCode', minWidth: 140, title: '库位' },
    { field: 'lotCode', minWidth: 140, title: '批次' },
    { field: 'ownerType', minWidth: 110, title: '货主类型' },
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
    {
      field: 'allocationEligibility',
      minWidth: 170,
      title: '分配资格',
    },
    {
      field: 'inTransitQuantity',
      minWidth: 110,
      slots: { default: 'quantity' },
      title: '在途',
    },
    { field: 'baseUomCode', minWidth: 90, title: 'UOM' },
    { field: 'aggregateVersion', minWidth: 90, title: '版本' },
    {
      field: 'updatedAt',
      formatter: 'formatDateTime',
      minWidth: 170,
      title: '更新时间',
    },
  ];
}

export function useReservationColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'reservationId',
      fixed: 'left',
      minWidth: 220,
      title: '预占 ID',
    },
    { field: 'allocationId', minWidth: 220, title: '分配 ID' },
    { field: 'businessType', minWidth: 130, title: '业务类型' },
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
    { field: 'baseUomCode', minWidth: 90, title: 'UOM' },
    { field: 'version', minWidth: 90, title: '版本' },
    {
      field: 'updatedAt',
      formatter: 'formatDateTime',
      minWidth: 170,
      title: '更新时间',
    },
  ];
}

export function useLedgerColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'ledgerEntryId',
      fixed: 'left',
      minWidth: 110,
      title: '分录 ID',
    },
    { field: 'commandType', minWidth: 140, title: '动作' },
    { field: 'entryRole', minWidth: 90, title: '分录角色' },
    { field: 'businessNo', minWidth: 180, title: '业务单号' },
    { field: 'businessType', minWidth: 130, title: '业务类型' },
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
    { field: 'baseUomCode', minWidth: 90, title: 'UOM' },
    { field: 'aggregateVersion', minWidth: 90, title: '版本' },
    {
      field: 'occurredAt',
      formatter: 'formatDateTime',
      minWidth: 170,
      title: '发生时间',
    },
  ];
}
