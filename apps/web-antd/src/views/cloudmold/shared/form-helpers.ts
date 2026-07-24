import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { cloudMoldEnumLabel } from './status-meta';

/**
 * CloudMold 红区共享的表格筛选 / 列定义工厂。
 * 抽自原 commerce/data.ts 与 inventory/data.ts 中逐字符重复的实现，
 * 供所有 CloudMold 列表页复用，避免每个页面各写一份。
 */

/** 通用「输入编码/单号」筛选字段 */
export const codeInput = (
  fieldName: string,
  label: string,
): VbenFormSchema => ({
  component: 'Input',
  componentProps: { allowClear: true, placeholder: `输入${label}` },
  fieldName,
  label,
});

/** 通用「状态编码」筛选字段 */
export const statusInput = (fieldName = 'status'): VbenFormSchema =>
  codeInput(fieldName, '状态编码');

/** 中文状态下拉框；接口仍提交稳定的英文枚举值。 */
export const statusSelect = (
  fieldName = 'status',
  values: string[],
  label = '状态',
): VbenFormSchema => ({
  component: 'Select',
  componentProps: {
    allowClear: true,
    options: values.map((value) => ({
      label: cloudMoldEnumLabel(value),
      value,
    })),
    placeholder: '全部状态',
  },
  fieldName,
  label,
});

/** 金额列：后端分为单位，统一用 vben 注册的 formatFenToYuanAmount 转元 */
export const moneyColumn = (field: string, title: string) => ({
  field,
  formatter: 'formatFenToYuanAmount',
  minWidth: 120,
  title,
});

/** 代码值保留给接口，表格统一展示中文枚举名称。 */
export const enumColumn = (field: string, title: string, minWidth = 120) => ({
  field,
  formatter: ({ cellValue }: { cellValue: unknown }) =>
    cloudMoldEnumLabel(cellValue),
  minWidth,
  title,
});

/** 时间列：统一用 vben 注册的 formatDateTime 格式化（带时区） */
export const timeColumn = (field: string, title: string) => ({
  field,
  formatter: 'formatDateTime',
  minWidth: 170,
  title,
});

/**
 * CloudMold 列表默认保持单行，普通文本溢出时由 VXE Tooltip 展示完整值。
 * 已有自定义 slot 的状态、数量和操作列保持原交互，不重复套 Tooltip。
 */
export function withCloudMoldTableColumns(
  columns: VxeTableGridOptions['columns'],
): VxeTableGridOptions['columns'] {
  return columns?.map((column) => ({
    ...column,
    showHeaderOverflow: 'tooltip',
    showOverflow:
      column.field === 'action' || column.slots?.default ? false : 'tooltip',
  }));
}
