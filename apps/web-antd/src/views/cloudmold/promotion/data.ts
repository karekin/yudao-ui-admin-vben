import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { codeInput, statusInput, timeColumn } from '../shared/form-helpers';

export const promotionStatusMeta: Record<
  string,
  { color: string; label: string }
> = {
  ACTIVE: { color: 'processing', label: '进行中' },
  CANCELLED: { color: 'error', label: '已取消' },
  COMPLETED: { color: 'success', label: '已完成' },
  DRAFT: { color: 'default', label: '草稿' },
  PAUSED: { color: 'warning', label: '已暂停' },
};

/** 营销活动状态机枚举（对齐后端 campaign status，值用于行内按钮 ifShow 比较） */
export const PromotionCampaignStatus = {
  ACTIVE: 'ACTIVE',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
  DRAFT: 'DRAFT',
  PAUSED: 'PAUSED',
};

export function usePromotionCampaignFormSchema(): VbenFormSchema[] {
  return [
    codeInput('campaignId', '活动 ID'),
    codeInput('campaignCode', '活动编码'),
    codeInput('name', '活动名称'),
    codeInput('campaignKind', '活动类型'),
    statusInput(),
  ];
}

export function usePromotionCampaignColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'campaignId',
      fixed: 'left',
      minWidth: 220,
      slots: { default: 'campaign-id' },
      title: '活动 ID',
    },
    { field: 'campaignCode', minWidth: 170, title: '活动编码' },
    { field: 'name', minWidth: 180, title: '活动名称' },
    { field: 'campaignKind', minWidth: 120, title: '类型' },
    {
      field: 'status',
      minWidth: 120,
      slots: { default: 'status' },
      title: '状态',
    },
    timeColumn('startsAt', '开始时间'),
    timeColumn('endsAt', '结束时间'),
    { field: 'aggregateVersion', minWidth: 80, title: '版本' },
    timeColumn('createdAt', '创建时间'),
    timeColumn('updatedAt', '更新时间'),
    {
      field: 'action',
      fixed: 'right',
      minWidth: 160,
      slots: { default: 'action' },
      title: '操作',
    },
  ];
}
