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

const required = (_message: string): 'required' => 'required';

export function useSkuCreateFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'styleCode',
      label: '款式编码',
      rules: required('请输入款式编码'),
    },
    {
      component: 'Input',
      fieldName: 'styleName',
      label: '款式名称',
      rules: required('请输入款式名称'),
    },
    {
      component: 'Input',
      fieldName: 'planningCategoryRef',
      label: '企划类目',
      rules: required('请输入企划类目引用'),
    },
    {
      component: 'Input',
      fieldName: 'brandRef',
      label: '品牌引用',
      rules: required('请输入品牌引用'),
    },
    {
      component: 'InputNumber',
      fieldName: 'planningYear',
      label: '企划年份',
      rules: required('请输入企划年份'),
    },
    {
      component: 'Select',
      componentProps: {
        options: ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER', 'ALL_SEASON'].map(
          (value) => ({ label: value, value }),
        ),
      },
      fieldName: 'seasonCode',
      label: '季节',
      rules: required('请选择季节'),
    },
    {
      component: 'Input',
      fieldName: 'waveCode',
      label: '波段',
      rules: required('请输入波段'),
    },
    {
      component: 'Input',
      fieldName: 'spuCode',
      label: 'SPU 编码',
      rules: required('请输入 SPU 编码'),
    },
    {
      component: 'Input',
      fieldName: 'productName',
      label: '商品名称',
      rules: required('请输入商品名称'),
    },
    {
      component: 'Input',
      fieldName: 'salesCategoryRef',
      label: '销售类目',
      rules: required('请输入销售类目引用'),
    },
    {
      component: 'Input',
      fieldName: 'skuCode',
      label: 'SKU 编码',
      rules: required('请输入 SKU 编码'),
    },
    {
      component: 'Input',
      fieldName: 'barcode',
      label: '主条码',
      rules: required('请输入主条码'),
    },
    {
      component: 'Select',
      componentProps: {
        options: ['EAN13', 'EAN8', 'UPC', 'CODE128', 'INTERNAL'].map(
          (value) => ({ label: value, value }),
        ),
      },
      defaultValue: 'CODE128',
      fieldName: 'barcodeType',
      label: '条码类型',
      rules: required('请选择条码类型'),
    },
    {
      component: 'Input',
      fieldName: 'colorCode',
      label: '颜色编码',
      rules: required('请输入颜色编码'),
    },
    {
      component: 'Input',
      fieldName: 'colorName',
      label: '颜色名称',
      rules: required('请输入颜色名称'),
    },
    {
      component: 'Input',
      fieldName: 'sizeGroupCode',
      label: '尺码组编码',
      rules: required('请输入尺码组编码'),
    },
    {
      component: 'Input',
      fieldName: 'sizeGroupName',
      label: '尺码组名称',
      rules: required('请输入尺码组名称'),
    },
    {
      component: 'Input',
      fieldName: 'sizeCode',
      label: '尺码编码',
      rules: required('请输入尺码编码'),
    },
    {
      component: 'Input',
      fieldName: 'sizeName',
      label: '尺码名称',
      rules: required('请输入尺码名称'),
    },
    {
      component: 'InputNumber',
      defaultValue: 10,
      fieldName: 'sizeSort',
      label: '尺码排序',
      rules: required('请输入尺码排序'),
    },
    {
      component: 'Input',
      defaultValue: 'PCS',
      fieldName: 'baseUomCode',
      label: '基础单位',
      rules: required('请输入基础单位'),
    },
    {
      component: 'Switch',
      defaultValue: true,
      fieldName: 'activateNow',
      help: '按款式、颜色、尺码组、尺码、SPU、SKU 的依赖顺序自动推进到生效。',
      label: '创建后生效',
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
