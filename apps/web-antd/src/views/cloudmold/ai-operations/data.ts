import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { codeInput, statusInput, timeColumn } from '../shared/form-helpers';

export const workflowRunStatusMeta: Record<
  string,
  { color: string; label: string }
> = {
  CANCELLED: { color: 'default', label: '已取消' },
  FAILED: { color: 'error', label: '失败' },
  RUNNING: { color: 'processing', label: '运行中' },
  SUCCEEDED: { color: 'success', label: '成功' },
};

export function useAiWorkflowRunFormSchema(): VbenFormSchema[] {
  return [
    codeInput('runId', '运行 ID'),
    codeInput('runKey', '业务键'),
    codeInput('applicationId', '应用 ID'),
    codeInput('workflowId', '工作流 ID'),
    codeInput('triggerType', '触发类型'),
    statusInput(),
  ];
}

export function useAiWorkflowRunColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'runId',
      fixed: 'left',
      minWidth: 220,
      slots: { default: 'run-id' },
      title: '运行 ID',
    },
    { field: 'runKey', minWidth: 180, title: '业务键' },
    { field: 'applicationId', minWidth: 180, title: '应用 ID' },
    { field: 'workflowId', minWidth: 180, title: '工作流 ID' },
    { field: 'workflowVersion', minWidth: 120, title: '工作流版本' },
    { field: 'triggerType', minWidth: 120, title: '触发类型' },
    {
      field: 'status',
      minWidth: 100,
      slots: { default: 'status' },
      title: '状态',
    },
    { field: 'errorCode', minWidth: 160, title: '错误码' },
    timeColumn('startedAt', '开始时间'),
    timeColumn('finishedAt', '结束时间'),
  ];
}
