import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { enumColumn, withCloudMoldTableColumns } from '../shared/form-helpers';

export const catalogStatusMeta: Record<
  number,
  { color: string; label: string }
> = {
  0: { color: 'default', label: '草稿' },
  10: { color: 'success', label: '生效' },
  20: { color: 'warning', label: '停用' },
  90: { color: 'error', label: '归档' },
};

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'skuCode',
      label: 'SKU 编码',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '输入规范 SKU 编码',
      },
    },
    {
      fieldName: 'spuCode',
      label: 'SPU 编码',
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '输入规范 SPU 编码',
      },
    },
    {
      fieldName: 'status',
      label: '生命周期',
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: Object.entries(catalogStatusMeta).map(([value, meta]) => ({
          label: meta.label,
          value: Number(value),
        })),
        placeholder: '全部状态',
      },
    },
  ];
}

export function useGridColumns(): VxeTableGridOptions['columns'] {
  return withCloudMoldTableColumns([
    {
      field: 'skuCode',
      fixed: 'left',
      minWidth: 190,
      slots: { default: 'sku-code' },
      title: '规范 SKU',
    },
    {
      field: 'productName',
      title: '商品名称',
      minWidth: 180,
    },
    {
      field: 'styleCode',
      title: '款式',
      minWidth: 140,
    },
    {
      field: 'spuCode',
      title: 'SPU',
      minWidth: 160,
    },
    {
      field: 'colorName',
      title: '颜色',
      minWidth: 110,
      formatter: ({ row }) => `${row.colorName} (${row.colorCode})`,
    },
    {
      field: 'sizeName',
      title: '尺码',
      minWidth: 110,
      formatter: ({ row }) => `${row.sizeName} (${row.sizeCode})`,
    },
    {
      field: 'primaryBarcode',
      title: '主条码',
      minWidth: 150,
    },
    enumColumn('baseUomCode', '计量单位', 100),
    {
      field: 'catalogStatus',
      title: '生命周期',
      minWidth: 100,
      slots: { default: 'catalog-status' },
    },
    {
      field: 'aggregateVersion',
      title: '聚合版本',
      minWidth: 100,
    },
    {
      field: 'updatedAt',
      title: '更新时间',
      minWidth: 170,
      formatter: 'formatDateTime',
    },
    {
      field: 'action',
      fixed: 'right',
      minWidth: 80,
      slots: { default: 'action' },
      title: '操作',
    },
  ]);
}
