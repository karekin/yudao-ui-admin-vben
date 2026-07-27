import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloudMoldAiOperationsApi } from '#/api/cloudmold/ai-operations';

import {
  codeInput,
  enumColumn,
  statusInput,
  timeColumn,
  withCloudMoldTableColumns,
} from '../shared/form-helpers';

export const aiOperationsConsoleNotice =
  '工作流由后台管理系统发起；DeerFlow 负责 Agent 管理与编排，CloudMold / SkillTask 保存运行实例和执行证据。';

export const managedWorkflowStatusMeta: Record<
  string,
  { color: string; label: string }
> = {
  ACTIVE: { color: 'success', label: '托管中' },
  COMPLETED: { color: 'success', label: '已完成' },
  DISABLED: { color: 'default', label: '已停用' },
  FAILED: { color: 'error', label: '失败' },
  RUNNING: { color: 'processing', label: '运行中' },
  SUSPENDED: { color: 'warning', label: '已挂起' },
};

export const workflowDefinitionStatusMeta: Record<
  string,
  { color: string; label: string }
> = {
  ACTIVE: { color: 'success', label: '生效' },
  PUBLISHED: { color: 'success', label: '已发布' },
  RETIRED: { color: 'default', label: '已退役' },
  SUSPENDED: { color: 'warning', label: '已暂停' },
};

export const workflowRunStatusMeta: Record<
  string,
  { color: string; label: string }
> = {
  CANCELLED: { color: 'default', label: '已取消' },
  FAILED: { color: 'error', label: '失败' },
  NEEDS_REVIEW: { color: 'warning', label: '需人工复核' },
  PAUSED: { color: 'warning', label: '已暂停' },
  QUEUED: { color: 'default', label: '排队中' },
  RUNNING: { color: 'processing', label: '运行中' },
  SUCCEEDED: { color: 'success', label: '成功' },
  WAITING_APPROVAL: { color: 'warning', label: '等待审批' },
  WAITING_CHILD: { color: 'processing', label: '等待子任务' },
};

export const invocationOutcomeMeta: Record<
  string,
  { color: string; label: string }
> = {
  CANCELLED: { color: 'default', label: '已取消' },
  FAILED: { color: 'error', label: '失败' },
  SUCCEEDED: { color: 'success', label: '成功' },
};

export const feedbackOutcomeMeta: Record<
  string,
  { color: string; label: string }
> = {
  NEGATIVE: { color: 'error', label: '负向' },
  NEUTRAL: { color: 'default', label: '中性' },
  POSITIVE: { color: 'success', label: '正向' },
  UNKNOWN: { color: 'warning', label: '未知' },
};

export const approvalStatusMeta: Record<
  string,
  { color: string; label: string }
> = {
  APPROVED: { color: 'success', label: '已批准' },
  NOT_REQUIRED: { color: 'default', label: '无需审批' },
  PENDING: { color: 'processing', label: '待审批' },
  REJECTED: { color: 'error', label: '已驳回' },
};

export function approvalGateSummary(status?: null | string) {
  switch (status) {
    case 'APPROVED': {
      return '已放行';
    }
    case 'NOT_REQUIRED': {
      return '无需审批';
    }
    case 'PENDING': {
      return '等待 BPM 审批或安全确认';
    }
    case 'REJECTED': {
      return '已驳回';
    }
    default: {
      return '未返回审批状态';
    }
  }
}

export function normalizeManagedWorkflowList(
  payload:
    | CloudMoldAiOperationsApi.ManagedWorkflow[]
    | CloudMoldAiOperationsApi.ManagedWorkflowListEnvelope
    | null
    | undefined,
) {
  if (!payload) {
    return [];
  }
  if (Array.isArray(payload)) {
    return payload;
  }
  return payload.items ?? payload.list ?? payload.records ?? payload.data ?? [];
}

export function useManagedWorkflowColumns(): VxeTableGridOptions['columns'] {
  return withCloudMoldTableColumns([
    {
      field: 'displayName',
      fixed: 'left',
      minWidth: 170,
      title: '中文名称',
    },
    { field: 'description', minWidth: 300, title: '用途说明' },
    { field: 'skillVersion', minWidth: 80, title: '版本' },
    { field: 'riskLevel', minWidth: 90, title: '风险等级' },
    {
      field: 'stepCount',
      minWidth: 110,
      slots: { default: 'managed-workflow-steps' },
      title: '执行步骤',
    },
    {
      field: 'approvalRequired',
      minWidth: 105,
      slots: { default: 'managed-workflow-approval' },
      title: '审批卡口',
    },
    {
      field: 'action',
      fixed: 'right',
      minWidth: 72,
      slots: { default: 'managed-workflow-action' },
      title: '操作',
    },
  ]);
}

export function useManagedWorkflowFormSchema(): VbenFormSchema[] {
  return [codeInput('skillId', 'Skill ID'), codeInput('riskLevel', '风险等级')];
}

export function useTemporalScheduleColumns(): VxeTableGridOptions['columns'] {
  return withCloudMoldTableColumns([
    {
      field: 'displayName',
      fixed: 'left',
      minWidth: 280,
      slots: { default: 'temporal-name' },
      title: '定时任务',
    },
    {
      field: 'skillId',
      minWidth: 220,
      slots: { default: 'temporal-workflow' },
      title: '托管工作流',
    },
    {
      field: 'intervalSeconds',
      minWidth: 110,
      slots: { default: 'temporal-interval' },
      title: '执行周期',
    },
    {
      field: 'status',
      minWidth: 100,
      slots: { default: 'temporal-status' },
      title: '状态',
    },
    timeColumn('lastActionAt', '上次触发'),
    timeColumn('nextActionAt', '下次触发'),
    {
      field: 'action',
      fixed: 'right',
      minWidth: 160,
      slots: { default: 'temporal-action' },
      title: '操作',
    },
  ]);
}

export function useTemporalScheduleFormSchema(): VbenFormSchema[] {
  return [
    codeInput('scheduleId', 'Schedule ID'),
    codeInput('skillId', 'Skill ID'),
    statusInput(),
  ];
}

export function useWorkflowDefinitionFormSchema(): VbenFormSchema[] {
  return [
    codeInput('workflowId', '工作流 ID'),
    codeInput('workflowCode', '工作流编码'),
    codeInput('applicationId', '应用 ID'),
    codeInput('applicationCode', '应用编码'),
    codeInput('applicationStatus', '应用状态'),
  ];
}

export function useWorkflowDefinitionColumns(): VxeTableGridOptions['columns'] {
  return withCloudMoldTableColumns([
    {
      field: 'workflowId',
      fixed: 'left',
      minWidth: 220,
      slots: { default: 'workflow-id' },
      title: 'AI 工作流 ID',
    },
    { field: 'workflowCode', minWidth: 160, title: '编码' },
    { field: 'applicationCode', minWidth: 160, title: '应用编码' },
    { field: 'applicationName', minWidth: 180, title: '应用名称' },
    { field: 'workflowVersion', minWidth: 100, title: '版本' },
    { field: 'runCount', minWidth: 90, title: '运行数' },
    { field: 'runningRunCount', minWidth: 90, title: '运行中' },
    { field: 'succeededRunCount', minWidth: 90, title: '成功' },
    { field: 'failedRunCount', minWidth: 90, title: '失败' },
    {
      field: 'applicationStatus',
      minWidth: 110,
      slots: { default: 'workflow-status' },
      title: '应用状态',
    },
    {
      field: 'definitionRef',
      minWidth: 220,
      slots: { default: 'workflow-ref' },
      title: '定义引用',
    },
    timeColumn('publishedAt', '发布时间'),
  ]);
}

export function useWorkflowRunFormSchema(): VbenFormSchema[] {
  return [
    codeInput('runId', '运行 ID'),
    codeInput('runKey', '业务键'),
    codeInput('applicationId', '应用 ID'),
    codeInput('workflowId', '工作流 ID'),
    codeInput('triggerType', '触发类型'),
    statusInput(),
  ];
}

export function useWorkflowRunColumns(): VxeTableGridOptions['columns'] {
  return withCloudMoldTableColumns([
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
    enumColumn('triggerType', '触发类型', 120),
    {
      field: 'status',
      minWidth: 100,
      slots: { default: 'run-status' },
      title: '状态',
    },
    { field: 'errorCode', minWidth: 160, title: '错误码' },
    timeColumn('startedAt', '开始时间'),
    timeColumn('finishedAt', '结束时间'),
    {
      field: 'action',
      fixed: 'right',
      minWidth: 88,
      slots: { default: 'run-action' },
      title: '操作',
    },
  ]);
}

export function useManagedRunColumns(): VxeTableGridOptions['columns'] {
  return withCloudMoldTableColumns([
    {
      field: 'skillId',
      fixed: 'left',
      minWidth: 180,
      slots: { default: 'managed-run-workflow' },
      title: '工作流',
    },
    {
      field: 'businessOutcome',
      minWidth: 300,
      slots: { default: 'managed-run-outcome' },
      title: '业务结果',
    },
    {
      field: 'status',
      minWidth: 90,
      slots: { default: 'managed-run-status' },
      title: '状态',
    },
    {
      field: 'currentStepCode',
      minWidth: 130,
      slots: { default: 'managed-run-current-step' },
      title: '当前进度',
    },
    timeColumn('completedAt', '完成时间'),
    {
      field: 'action',
      fixed: 'right',
      minWidth: 72,
      slots: { default: 'managed-run-action' },
      title: '操作',
    },
  ]);
}

export function useManagedRunFormSchema(): VbenFormSchema[] {
  return [
    codeInput('taskId', '任务 ID'),
    codeInput('runId', '运行 ID'),
    codeInput('skillId', 'Skill ID'),
    codeInput('riskLevel', '风险等级'),
    statusInput(),
  ];
}

export function useManagedArtifactColumns(): VxeTableGridOptions['columns'] {
  return withCloudMoldTableColumns([
    {
      field: 'skillId',
      fixed: 'left',
      minWidth: 180,
      slots: { default: 'managed-artifact-workflow' },
      title: '工作流',
    },
    {
      field: 'businessOutcome',
      minWidth: 440,
      slots: { default: 'managed-artifact-outcome' },
      title: '业务产物',
    },
    {
      field: 'status',
      minWidth: 90,
      slots: { default: 'managed-artifact-status' },
      title: '状态',
    },
    timeColumn('completedAt', '完成时间'),
    {
      field: 'action',
      fixed: 'right',
      minWidth: 72,
      slots: { default: 'managed-artifact-action' },
      title: '操作',
    },
  ]);
}

export function useManagedObservationColumns(): VxeTableGridOptions['columns'] {
  return withCloudMoldTableColumns([
    {
      field: 'skillId',
      fixed: 'left',
      minWidth: 180,
      slots: { default: 'managed-observation-workflow' },
      title: '工作流',
    },
    {
      field: 'currentStepCode',
      minWidth: 200,
      slots: { default: 'managed-observation-current-step' },
      title: '当前进度',
    },
    {
      field: 'status',
      minWidth: 90,
      slots: { default: 'managed-observation-status' },
      title: '运行状态',
    },
    { field: 'attemptCount', minWidth: 80, title: '尝试次数' },
    timeColumn('updatedAt', '最近观测'),
    {
      field: 'action',
      fixed: 'right',
      minWidth: 72,
      slots: { default: 'managed-observation-action' },
      title: '操作',
    },
  ]);
}

export function useArtifactFormSchema(): VbenFormSchema[] {
  return [
    codeInput('runId', '运行 ID'),
    codeInput('feedbackType', '产物类型'),
    codeInput('workflowId', '工作流 ID'),
    codeInput('outcomeCode', '结果编码'),
  ];
}

export function useArtifactColumns(): VxeTableGridOptions['columns'] {
  return withCloudMoldTableColumns([
    {
      field: 'feedbackId',
      fixed: 'left',
      minWidth: 220,
      slots: { default: 'artifact-id' },
      title: '反馈产物 ID',
    },
    {
      field: 'runId',
      minWidth: 220,
      slots: { default: 'artifact-run-id' },
      title: '运行 ID',
    },
    enumColumn('feedbackType', '产物类型', 140),
    { field: 'workflowCode', minWidth: 160, title: '工作流' },
    {
      field: 'evidenceRef',
      minWidth: 220,
      slots: { default: 'artifact-ref' },
      title: '证据引用',
    },
    {
      field: 'outcomeCode',
      minWidth: 110,
      slots: { default: 'artifact-status' },
      title: '结果',
    },
    enumColumn('evaluatorType', '评估方', 120),
    timeColumn('occurredAt', '发生时间'),
    {
      field: 'action',
      fixed: 'right',
      minWidth: 88,
      slots: { default: 'artifact-action' },
      title: '操作',
    },
  ]);
}

export function useObservationFormSchema(): VbenFormSchema[] {
  return [
    codeInput('runId', '运行 ID'),
    codeInput('stepRef', '步骤'),
    codeInput('providerCode', '供应方'),
    codeInput('modelCode', '模型'),
    codeInput('outcome', '调用结果'),
  ];
}

export function useObservationColumns(): VxeTableGridOptions['columns'] {
  return withCloudMoldTableColumns([
    {
      field: 'attemptId',
      fixed: 'left',
      minWidth: 220,
      slots: { default: 'observation-id' },
      title: '调用 ID',
    },
    {
      field: 'runId',
      minWidth: 220,
      slots: { default: 'observation-run-id' },
      title: '运行 ID',
    },
    { field: 'stepRef', minWidth: 180, title: '步骤' },
    { field: 'providerCode', minWidth: 120, title: '供应方' },
    { field: 'modelCode', minWidth: 160, title: '模型' },
    {
      field: 'outcome',
      minWidth: 110,
      slots: { default: 'observation-outcome' },
      title: '结果',
    },
    { field: 'totalTokens', minWidth: 110, title: '总 Tokens' },
    { field: 'latencyMillis', minWidth: 110, title: '耗时 ms' },
    { field: 'costAmountMinor', minWidth: 110, title: '成本(分)' },
    { field: 'errorCode', minWidth: 150, title: '错误码' },
    timeColumn('occurredAt', '发生时间'),
    {
      field: 'action',
      fixed: 'right',
      minWidth: 88,
      slots: { default: 'observation-action' },
      title: '操作',
    },
  ]);
}
