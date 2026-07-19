import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { codeInput, statusInput, timeColumn } from '../shared/form-helpers';

export const gamificationAccountStatusMeta: Record<
  string,
  { color: string; label: string }
> = {
  ACTIVE: { color: 'success', label: '活跃' },
};

export function useGamificationAccountFormSchema(): VbenFormSchema[] {
  return [
    codeInput('accountId', '账户 ID'),
    codeInput('gameId', '游戏 ID'),
    codeInput('ownerType', '持有方类型'),
    codeInput('ownerRef', '持有方引用'),
    codeInput('currencyCode', '货币代码'),
    statusInput(),
  ];
}

export function useGamificationAccountColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'accountId',
      fixed: 'left',
      minWidth: 220,
      slots: { default: 'account-id' },
      title: '账户 ID',
    },
    { field: 'gameId', minWidth: 180, title: '游戏 ID' },
    { field: 'ownerType', minWidth: 120, title: '持有方类型' },
    { field: 'ownerRef', minWidth: 180, title: '持有方引用' },
    { field: 'currencyCode', minWidth: 180, title: '货币代码' },
    { field: 'balanceMicrounits', minWidth: 150, title: '余额(微单位)' },
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
