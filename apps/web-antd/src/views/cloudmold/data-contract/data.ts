import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { codeInput, timeColumn } from '../shared/form-helpers';

export const eventOutboxStatusMeta: Record<
  string,
  { color: string; label: string }
> = {
  '0': { color: 'warning', label: '待处理' },
  '10': { color: 'processing', label: '已认领' },
  '20': { color: 'success', label: '已发布' },
  '30': { color: 'error', label: '死信' },
};

export function useEventOutboxFormSchema(): VbenFormSchema[] {
  return [
    codeInput('eventId', '事件 ID'),
    codeInput('eventType', '事件类型'),
    codeInput('status', '状态码 0/10/20/30'),
    codeInput('aggregateType', '聚合类型'),
    codeInput('aggregateId', '聚合 ID'),
  ];
}

export function useEventOutboxColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'eventId',
      fixed: 'left',
      minWidth: 220,
      slots: { default: 'event-id' },
      title: '事件 ID',
    },
    { field: 'eventType', minWidth: 200, title: '事件类型' },
    { field: 'schemaVersion', minWidth: 100, title: 'Schema 版本' },
    { field: 'aggregateType', minWidth: 140, title: '聚合类型' },
    { field: 'aggregateId', minWidth: 200, title: '聚合 ID' },
    { field: 'aggregateVersion', minWidth: 100, title: '聚合版本' },
    {
      field: 'status',
      minWidth: 100,
      slots: { default: 'status' },
      title: '状态',
    },
    { field: 'destination', minWidth: 160, title: '目的地' },
    { field: 'attemptCount', minWidth: 100, title: '尝试次数' },
    timeColumn('occurredAt', '业务时间'),
    timeColumn('recordedAt', '记录时间'),
    timeColumn('publishedAt', '发布时间'),
  ];
}
