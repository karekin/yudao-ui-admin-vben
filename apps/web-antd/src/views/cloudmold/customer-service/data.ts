import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { codeInput, statusInput, timeColumn } from '../shared/form-helpers';

export const ticketStatusMeta: Record<
  string,
  { color: string; label: string }
> = {
  CLOSED: { color: 'default', label: '已关闭' },
  IN_PROGRESS: { color: 'processing', label: '处理中' },
  OPEN: { color: 'warning', label: '待处理' },
  RESOLVED: { color: 'success', label: '已解决' },
};

export const ticketPriorityMeta: Record<
  string,
  { color: string; label: string }
> = {
  HIGH: { color: 'warning', label: '高' },
  LOW: { color: 'default', label: '低' },
  NORMAL: { color: 'processing', label: '中' },
  URGENT: { color: 'error', label: '紧急' },
};

/** 工单状态机枚举（值用于行内按钮 ifShow 比较） */
export const TicketStatus = {
  CLOSED: 'CLOSED',
  IN_PROGRESS: 'IN_PROGRESS',
  OPEN: 'OPEN',
  RESOLVED: 'RESOLVED',
};

export function useCustomerServiceTicketFormSchema(): VbenFormSchema[] {
  return [
    codeInput('ticketNo', '工单号'),
    codeInput('customerPrincipalId', '客户主体'),
    codeInput('assignedAgentPrincipalId', '受理坐席'),
    codeInput('categoryCode', '业务分类'),
    statusInput(),
  ];
}

export function useCustomerServiceTicketColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'ticketNo',
      fixed: 'left',
      minWidth: 170,
      slots: { default: 'ticket-no' },
      title: '工单号',
    },
    { field: 'customerPrincipalId', minWidth: 180, title: '客户主体' },
    {
      field: 'status',
      minWidth: 120,
      slots: { default: 'status' },
      title: '状态',
    },
    {
      field: 'priority',
      minWidth: 100,
      slots: { default: 'priority' },
      title: '优先级',
    },
    { field: 'channelCode', minWidth: 100, title: '渠道' },
    { field: 'categoryCode', minWidth: 140, title: '业务分类' },
    { field: 'assignedAgentPrincipalId', minWidth: 180, title: '受理坐席' },
    timeColumn('resolutionDeadlineAt', '解决时限'),
    { field: 'aggregateVersion', minWidth: 80, title: '版本' },
    timeColumn('createdAt', '创建时间'),
    timeColumn('updatedAt', '更新时间'),
    {
      field: 'action',
      fixed: 'right',
      minWidth: 140,
      slots: { default: 'action' },
      title: '操作',
    },
  ];
}
