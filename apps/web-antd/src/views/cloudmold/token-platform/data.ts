import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { codeInput, statusInput, timeColumn } from '../shared/form-helpers';

export const tokenAccountStatusMeta: Record<
  string,
  { color: string; label: string }
> = {
  ACTIVE: { color: 'success', label: '活跃' },
  CLOSED: { color: 'default', label: '已关闭' },
};

export function useTokenAccountFormSchema(): VbenFormSchema[] {
  return [
    codeInput('accountId', '账户 ID'),
    codeInput('principalId', '持有者主体'),
    statusInput(),
  ];
}

export function useTokenAccountColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'accountId',
      fixed: 'left',
      minWidth: 220,
      slots: { default: 'account-id' },
      title: '账户 ID',
    },
    { field: 'principalId', minWidth: 180, title: '持有者主体' },
    { field: 'balanceMicrounits', minWidth: 160, title: '余额(微单位)' },
    {
      field: 'status',
      minWidth: 100,
      slots: { default: 'status' },
      title: '状态',
    },
    { field: 'aggregateVersion', minWidth: 80, title: '版本' },
    timeColumn('createdAt', '创建时间'),
    timeColumn('updatedAt', '更新时间'),
  ];
}
