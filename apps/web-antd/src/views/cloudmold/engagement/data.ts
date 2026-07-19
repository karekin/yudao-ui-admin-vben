import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { codeInput, statusInput, timeColumn } from '../shared/form-helpers';

export const notificationStatusMeta: Record<
  string,
  { color: string; label: string }
> = {
  ACTIVE: { color: 'processing', label: '进行中' },
  COMPLETED: { color: 'success', label: '已完成' },
  DRAFT: { color: 'default', label: '草稿' },
  PAUSED: { color: 'warning', label: '已暂停' },
};

export function useNotificationCampaignFormSchema(): VbenFormSchema[] {
  return [
    codeInput('campaignId', '活动 ID'),
    codeInput('campaignCode', '活动编码'),
    codeInput('campaignName', '活动名称'),
    codeInput('channel', '通知渠道'),
    statusInput(),
  ];
}

export function useNotificationCampaignColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'campaignId',
      fixed: 'left',
      minWidth: 220,
      slots: { default: 'campaign-id' },
      title: '活动 ID',
    },
    { field: 'campaignCode', minWidth: 170, title: '活动编码' },
    { field: 'campaignName', minWidth: 180, title: '活动名称' },
    { field: 'channel', minWidth: 100, title: '渠道' },
    {
      field: 'status',
      minWidth: 120,
      slots: { default: 'status' },
      title: '状态',
    },
    { field: 'sourceSystem', minWidth: 140, title: '来源系统' },
    { field: 'sourceType', minWidth: 140, title: '来源类型' },
    { field: 'sourceId', minWidth: 180, title: '来源 ID' },
    { field: 'aggregateVersion', minWidth: 80, title: '版本' },
    timeColumn('createdAt', '创建时间'),
    timeColumn('updatedAt', '更新时间'),
  ];
}
