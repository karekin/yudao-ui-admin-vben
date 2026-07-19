import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { codeInput, statusInput, timeColumn } from '../shared/form-helpers';

/**
 * 身份主体类型（对齐后端 principal.principal_type 约束）。
 */
export const principalTypeMeta: Record<
  string,
  { color: string; label: string }
> = {
  MEMBER: { color: 'blue', label: '会员' },
  MERCHANT_OPERATOR: { color: 'cyan', label: '商家操作员' },
  PLATFORM_OPERATOR: { color: 'purple', label: '平台操作员' },
  WAREHOUSE_OPERATOR: { color: 'geekblue', label: '仓库操作员' },
};

export const principalStatusMeta: Record<
  string,
  { color: string; label: string }
> = {
  ACTIVE: { color: 'success', label: '生效' },
  DISABLED: { color: 'default', label: '停用' },
};

export const sourceStatusMeta: Record<
  string,
  { color: string; label: string }
> = {
  ACTIVE: { color: 'success', label: '生效' },
  REVOKED: { color: 'warning', label: '已注销' },
};

/**
 * 身份操作记录状态（后端 tinyint：0=待处理 / 10=成功）。
 */
export const operationStatusMeta: Record<
  number,
  { color: string; label: string }
> = {
  0: { color: 'processing', label: '待处理' },
  10: { color: 'success', label: '成功' },
};

export function usePrincipalFormSchema(): VbenFormSchema[] {
  return [codeInput('principalType', '主体类型'), statusInput()];
}

export function useSourceFormSchema(): VbenFormSchema[] {
  return [
    codeInput('principalId', '身份主体 ID'),
    codeInput('sourceSystem', '来源系统'),
    codeInput('sourceType', '来源类型'),
    statusInput(),
  ];
}

export function useOperationFormSchema(): VbenFormSchema[] {
  return [
    codeInput('principalId', '身份主体 ID'),
    codeInput('commandType', '命令类型'),
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: Object.entries(operationStatusMeta).map(([value, meta]) => ({
          label: meta.label,
          value: Number(value),
        })),
      },
      fieldName: 'status',
      label: '操作状态',
    },
  ];
}

export function usePrincipalColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'principalId',
      fixed: 'left',
      minWidth: 220,
      slots: { default: 'principal-id' },
      title: '规范身份主体 ID',
    },
    {
      field: 'principalType',
      minWidth: 140,
      slots: { default: 'principal-type' },
      title: '主体类型',
    },
    {
      field: 'status',
      minWidth: 110,
      slots: { default: 'principal-status' },
      title: '状态',
    },
    { field: 'tenantId', minWidth: 110, title: '租户 ID' },
    { field: 'version', minWidth: 80, title: '版本' },
    timeColumn('createdAt', '创建时间'),
    timeColumn('updatedAt', '更新时间'),
  ];
}

export function useSourceColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'sourceIdentityId',
      fixed: 'left',
      minWidth: 220,
      slots: { default: 'source-id' },
      title: '规范来源身份 ID',
    },
    { field: 'principalType', minWidth: 130, title: '主体类型' },
    { field: 'sourceSystem', minWidth: 120, title: '来源系统' },
    { field: 'sourceType', minWidth: 110, title: '来源类型' },
    { field: 'sourceId', minWidth: 180, title: '来源外部 ID' },
    {
      field: 'status',
      minWidth: 110,
      slots: { default: 'source-status' },
      title: '状态',
    },
    { field: 'principalId', minWidth: 220, title: '身份主体 ID' },
    timeColumn('validFrom', '生效开始'),
    timeColumn('validTo', '生效结束'),
    { field: 'version', minWidth: 80, title: '版本' },
    timeColumn('updatedAt', '更新时间'),
  ];
}

export function useOperationColumns(): VxeTableGridOptions['columns'] {
  return [
    { field: 'operationId', fixed: 'left', minWidth: 110, title: '操作 ID' },
    {
      field: 'idempotencyKey',
      minWidth: 220,
      slots: { default: 'idempotency-key' },
      title: '幂等键',
    },
    { field: 'commandType', minWidth: 150, title: '命令类型' },
    {
      field: 'status',
      minWidth: 110,
      slots: { default: 'operation-status' },
      title: '状态',
    },
    { field: 'principalId', minWidth: 220, title: '身份主体 ID' },
    timeColumn('createdAt', '创建时间'),
    timeColumn('updatedAt', '更新时间'),
  ];
}
