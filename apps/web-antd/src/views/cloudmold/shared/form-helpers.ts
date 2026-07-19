import type { VbenFormSchema } from '#/adapter/form';

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

/** 金额列：后端分为单位，统一用 vben 注册的 formatFenToYuanAmount 转元 */
export const moneyColumn = (field: string, title: string) => ({
  field,
  formatter: 'formatFenToYuanAmount',
  minWidth: 120,
  title,
});

/** 时间列：统一用 vben 注册的 formatDateTime 格式化（带时区） */
export const timeColumn = (field: string, title: string) => ({
  field,
  formatter: 'formatDateTime',
  minWidth: 170,
  title,
});
