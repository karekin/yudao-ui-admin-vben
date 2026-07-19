import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { codeInput, statusInput, timeColumn } from '../shared/form-helpers';

export const alertStatusMeta: Record<string, { color: string; label: string }> =
  {
    CLAIMED: { color: 'processing', label: '已认领' },
    CLOSED_NO_ACTION: { color: 'default', label: '已关闭(无需处理)' },
    INVALID: { color: 'default', label: '无效' },
    NOTIFIED: { color: 'warning', label: '已通知' },
    OPEN: { color: 'error', label: '待处理' },
    RESOLVED: { color: 'success', label: '已解决' },
  };

export const alertSeverityMeta: Record<
  string,
  { color: string; label: string }
> = {
  CRITICAL: { color: 'error', label: '致命' },
  HIGH: { color: 'warning', label: '高' },
  LOW: { color: 'default', label: '低' },
  MEDIUM: { color: 'processing', label: '中' },
};

export function useOperationsAlertFormSchema(): VbenFormSchema[] {
  return [
    codeInput('alertId', '告警 ID'),
    codeInput('alertCode', '告警编码'),
    codeInput('sourceType', '来源类型'),
    codeInput('severity', '严重程度'),
    codeInput('category', '类目'),
    codeInput('currentActorPrincipalId', '处理人主体'),
    statusInput(),
  ];
}

export function useOperationsAlertColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'alertId',
      fixed: 'left',
      minWidth: 220,
      slots: { default: 'alert-id' },
      title: '告警 ID',
    },
    { field: 'alertCode', minWidth: 170, title: '告警编码' },
    { field: 'sourceType', minWidth: 140, title: '来源类型' },
    {
      field: 'severity',
      minWidth: 100,
      slots: { default: 'severity' },
      title: '严重程度',
    },
    { field: 'category', minWidth: 140, title: '类目' },
    { field: 'subcategory', minWidth: 140, title: '子类目' },
    {
      field: 'status',
      minWidth: 130,
      slots: { default: 'status' },
      title: '状态',
    },
    { field: 'currentActorPrincipalId', minWidth: 180, title: '处理人主体' },
    timeColumn('openedAt', '开启时间'),
    timeColumn('terminalAt', '终态时间'),
    { field: 'aggregateVersion', minWidth: 80, title: '版本' },
    timeColumn('createdAt', '创建时间'),
    timeColumn('updatedAt', '更新时间'),
  ];
}
