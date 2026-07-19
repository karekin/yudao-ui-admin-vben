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

/** 通知活动状态机枚举（对齐后端 CAMPAIGN_STATUSES，无 CANCELLED，用于行内按钮 ifShow） */
export const NotificationCampaignStatus = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  DRAFT: 'DRAFT',
  PAUSED: 'PAUSED',
};

export function useNotificationCampaignCreateFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: { maxLength: 64, placeholder: '请输入活动编码' },
      fieldName: 'campaignCode',
      label: '活动编码',
      rules: 'required',
    },
    {
      component: 'Input',
      componentProps: { maxLength: 128, placeholder: '请输入活动名称' },
      fieldName: 'campaignName',
      label: '活动名称',
      rules: 'required',
    },
    {
      component: 'Select',
      componentProps: {
        options: [
          { label: 'App 推送', value: 'APP_PUSH' },
          { label: '短信', value: 'SMS' },
        ],
        placeholder: '请选择通知渠道',
      },
      fieldName: 'channel',
      label: '通知渠道',
      rules: 'required',
    },
  ];
}

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
    {
      field: 'action',
      fixed: 'right',
      minWidth: 140,
      slots: { default: 'action' },
      title: '操作',
    },
  ];
}
