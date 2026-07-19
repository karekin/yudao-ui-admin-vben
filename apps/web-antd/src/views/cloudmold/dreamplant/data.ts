import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { codeInput, statusInput, timeColumn } from '../shared/form-helpers';

export const explorationStatusMeta: Record<
  string,
  { color: string; label: string }
> = {
  CANCELLED: { color: 'default', label: '已取消' },
  FAILED: { color: 'error', label: '失败' },
  NEEDS_REVIEW: { color: 'warning', label: '待复核' },
  QUEUED: { color: 'default', label: '排队中' },
  RUNNING: { color: 'processing', label: '运行中' },
  SUCCEEDED: { color: 'success', label: '成功' },
};

export function useDreamPlantExplorationFormSchema(): VbenFormSchema[] {
  return [
    codeInput('explorationRunId', '探索运行 ID'),
    codeInput('mapKey', '世界地图键'),
    codeInput('requestedByPrincipalId', '提交者'),
    statusInput(),
  ];
}

export function useDreamPlantExplorationColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'explorationRunId',
      fixed: 'left',
      minWidth: 220,
      slots: { default: 'exploration-run-id' },
      title: '探索运行 ID',
    },
    { field: 'mapKey', minWidth: 160, title: '世界地图键' },
    { field: 'intent', minWidth: 240, title: '意图' },
    { field: 'requestedByPrincipalId', minWidth: 180, title: '提交者' },
    {
      field: 'status',
      minWidth: 100,
      slots: { default: 'status' },
      title: '状态',
    },
    timeColumn('startedAt', '开始时间'),
    timeColumn('completedAt', '完成时间'),
    timeColumn('createdAt', '创建时间'),
    timeColumn('updatedAt', '更新时间'),
  ];
}
