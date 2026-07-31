<script lang="ts" setup>
import type { PageResult } from '@vben/request';

import type { RoleCapabilityEntry } from './data';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloudMoldAgentControlApi } from '#/api/cloudmold/agent-control';
import type { CloudMoldAiOperationsApi } from '#/api/cloudmold/ai-operations';

import { onActivated, onDeactivated, onMounted, ref, watch } from 'vue';

import { useAccess } from '@vben/access';
import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import {
  Alert,
  Button,
  Card,
  Col,
  Collapse,
  Descriptions,
  DescriptionsItem,
  Drawer,
  Empty,
  message,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Tabs,
  Typography,
} from 'ant-design-vue';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getCloudMoldAgentApprovalBoardStats,
  getCloudMoldAgentBusinessCards,
  isAgentControlForbidden,
  isAgentControlUnavailable,
} from '#/api/cloudmold/agent-control';
import { grantApprover } from '#/api/cloudmold/agent-control/command';
import {
  getCloudMoldManagedRunDetail,
  getCloudMoldManagedRunPage,
  getCloudMoldManagedWorkflowList,
  getCloudMoldTemporalAutomationOverview,
  getCloudMoldTemporalScheduleList,
  pauseCloudMoldTemporalSchedule,
  resumeCloudMoldTemporalSchedule,
  triggerCloudMoldTemporalSchedule,
} from '#/api/cloudmold/ai-operations';
import { getSimpleUser } from '#/api/system/user';
import { router } from '#/router';
import { UserSelect } from '#/views/system/user/components';

import { buildApprovalDecisionPresentation } from '../agent-control/approval-presentation';
import CopyIdCell from '../shared/copy-id-cell.vue';
import EvidenceAlert from '../shared/evidence-alert.vue';
import StatusTag from '../shared/status-tag.vue';
import {
  agentControlRoleLabel,
  aiOperationsConsoleNotice,
  approvalGateSummary,
  approvalStatusMeta,
  buildApprovalRoleOptions,
  buildRoleCapabilityMap,
  managedWorkflowOwnerRoleLabel,
  normalizeManagedWorkflowList,
  temporalBusinessAutonomySummary,
  temporalDiscoverySourceSummary,
  temporalDispatchOutcomeSummary,
  temporalGapSummary,
  temporalScheduleStateSummary,
  toCoveragePercent,
  useManagedRunFormSchema,
  useManagedWorkflowColumns,
  useManagedWorkflowFormSchema,
  useTemporalAutomationOverviewColumns,
  useTemporalAutomationOverviewFormSchema,
  useTemporalScheduleColumns,
  useTemporalScheduleFormSchema,
  workflowRunStatusMeta,
} from './data';

import '../shared/tabbed-grid.css';

defineOptions({ name: 'CloudMoldAiWorkflowRun' });

type SectionFlags = {
  loadFailed: boolean;
  unavailable: boolean;
};

function isEndpointUnavailable(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const candidate = error as {
    code?: number;
    data?: { code?: number };
    response?: { data?: { code?: number }; status?: number };
  };
  return (
    candidate.code === 404 ||
    candidate.data?.code === 404 ||
    candidate.response?.data?.code === 404 ||
    candidate.response?.status === 404
  );
}

function emptyPage<T>(currentPage: number, pageSize: number): PageResult<T> {
  void currentPage;
  void pageSize;
  return {
    list: [],
    total: 0,
  };
}

function paginateItems<T>(
  items: T[],
  currentPage: number,
  pageSize: number,
): PageResult<T> {
  const start = (currentPage - 1) * pageSize;
  return {
    list: items.slice(start, start + pageSize),
    total: items.length,
  };
}

function resetFlags(flags: SectionFlags) {
  flags.loadFailed = false;
  flags.unavailable = false;
}

function applyFailure(flags: SectionFlags, error: unknown) {
  flags.unavailable = isEndpointUnavailable(error);
  flags.loadFailed = !flags.unavailable;
}

function getMeta(
  metadata: Record<string, { color: string; label: string }>,
  status: null | string | undefined,
) {
  const normalized = normalizeBusinessStatus(status);
  if (!normalized) {
    return { color: 'default', label: '-' };
  }
  if (isWaitingStatus(normalized) || normalized === 'PREPARE') {
    return { color: 'warning', label: '等待中' };
  }
  if (normalized === 'PENDING_CONFIRMATION') {
    return { color: 'processing', label: '等待确认' };
  }
  return metadata[normalized] ?? { color: 'default', label: normalized };
}

function matchFilter(value: null | string | undefined, keyword: unknown) {
  if (!keyword) {
    return true;
  }
  return String(value ?? '')
    .toLowerCase()
    .includes(String(keyword).trim().toLowerCase());
}

const activeTab = ref('managed-workflows');
const { hasAccessByCodes } = useAccess();
const userStore = useUserStore();

const managedWorkflowFlags = ref<SectionFlags>({
  loadFailed: false,
  unavailable: false,
});
const managedRunFlags = ref<SectionFlags>({
  loadFailed: false,
  unavailable: false,
});
const managedArtifactFlags = ref<SectionFlags>({
  loadFailed: false,
  unavailable: false,
});
const managedObservationFlags = ref<SectionFlags>({
  loadFailed: false,
  unavailable: false,
});
const temporalScheduleFlags = ref<SectionFlags>({
  loadFailed: false,
  unavailable: false,
});
const temporalAutomationFlags = ref<SectionFlags>({
  loadFailed: false,
  unavailable: false,
});
const temporalAutomationLoading = ref(false);
const temporalAutomationOverview =
  ref<CloudMoldAiOperationsApi.TemporalAutomationOverview>();

const workflowDetailOpen = ref(false);
const selectedWorkflow = ref<CloudMoldAiOperationsApi.ManagedWorkflow>();
const managedWorkflowNames = ref<Record<string, string>>({});
const roleCapabilityEntries = ref<RoleCapabilityEntry[]>([]);
const roleCapabilityLoading = ref(false);
const roleAutomationEvidenceUnavailable = ref(false);
const roleCapabilityFlags = ref<SectionFlags>({
  loadFailed: false,
  unavailable: false,
});

function workflowName(skillId?: string) {
  if (!skillId) return '未识别工作流';
  return managedWorkflowNames.value[skillId] ?? skillId;
}

function openWorkflowDetail(
  workflow: CloudMoldAiOperationsApi.ManagedWorkflow,
) {
  selectedWorkflow.value = workflow;
  workflowDetailOpen.value = true;
}

function registeredRoleCount() {
  return roleCapabilityEntries.value.filter((entry) => entry.workflowCount > 0)
    .length;
}

function foundationRoleCount() {
  return roleCapabilityEntries.value.filter(
    (entry) => entry.capabilityStage === 'FOUNDATION_REQUIRED',
  ).length;
}

function registeredWorkflowCount() {
  return roleCapabilityEntries.value.reduce(
    (total, entry) => total + entry.workflowCount,
    0,
  );
}

async function loadRoleCapabilities() {
  resetFlags(roleCapabilityFlags.value);
  roleCapabilityLoading.value = true;
  try {
    const workflows = normalizeManagedWorkflowList(
      await getCloudMoldManagedWorkflowList(),
    );
    roleAutomationEvidenceUnavailable.value = false;
    let automationWorkflows: CloudMoldAiOperationsApi.TemporalAutomationWorkflow[] =
      [];
    try {
      const automationOverview = await getCloudMoldTemporalAutomationOverview();
      automationWorkflows = automationOverview.workflows ?? [];
    } catch {
      roleAutomationEvidenceUnavailable.value = true;
    }
    roleCapabilityEntries.value = buildRoleCapabilityMap(
      workflows,
      automationWorkflows,
    );
    managedWorkflowNames.value = Object.fromEntries(
      workflows.map((item) => [item.skillId, item.displayName]),
    );
  } catch (error) {
    roleCapabilityEntries.value = [];
    roleAutomationEvidenceUnavailable.value = false;
    applyFailure(roleCapabilityFlags.value, error);
  } finally {
    roleCapabilityLoading.value = false;
  }
}

const [TemporalAutomationGrid, temporalAutomationGridApi] = useVbenVxeGrid({
  formOptions: {
    collapsed: true,
    collapsedRows: 1,
    schema: useTemporalAutomationOverviewFormSchema(),
    showCollapseButton: true,
  },
  gridOptions: {
    columns: useTemporalAutomationOverviewColumns(),
    height: 520,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          resetFlags(temporalAutomationFlags.value);
          temporalAutomationLoading.value = true;
          try {
            const overview = await getCloudMoldTemporalAutomationOverview();
            temporalAutomationOverview.value = overview;
            const items = (overview.workflows ?? []).filter(
              (item) =>
                matchFilter(item.skillId, formValues.skillId) &&
                matchFilter(item.scheduleState, formValues.scheduleState) &&
                matchFilter(
                  item.businessAutonomyState,
                  formValues.businessAutonomyState,
                ),
            );
            return paginateItems(items, page.currentPage, page.pageSize);
          } catch (error) {
            temporalAutomationOverview.value = undefined;
            applyFailure(temporalAutomationFlags.value, error);
            return emptyPage(page.currentPage, page.pageSize);
          } finally {
            temporalAutomationLoading.value = false;
          }
        },
      },
    },
    rowConfig: { height: 64, isHover: true, keyField: 'skillId' },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<CloudMoldAiOperationsApi.TemporalAutomationWorkflow>,
});

const [TemporalScheduleGrid, temporalScheduleGridApi] = useVbenVxeGrid({
  formOptions: {
    collapsed: true,
    collapsedRows: 1,
    schema: useTemporalScheduleFormSchema(),
    showCollapseButton: true,
  },
  gridOptions: {
    columns: useTemporalScheduleColumns(),
    height: 600,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          resetFlags(temporalScheduleFlags.value);
          try {
            const schedules = await getCloudMoldTemporalScheduleList();
            const items = schedules.filter(
              (item) =>
                matchFilter(item.scheduleId, formValues.scheduleId) &&
                matchFilter(item.skillId, formValues.skillId) &&
                matchFilter(item.status, formValues.status),
            );
            return paginateItems(items, page.currentPage, page.pageSize);
          } catch (error) {
            applyFailure(temporalScheduleFlags.value, error);
            return emptyPage(page.currentPage, page.pageSize);
          }
        },
      },
    },
    rowConfig: { height: 58, isHover: true, keyField: 'scheduleId' },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<CloudMoldAiOperationsApi.TemporalSchedule>,
});

async function operateTemporalSchedule(
  action: 'pause' | 'resume' | 'trigger',
  scheduleId: string,
) {
  if (action === 'pause') {
    await pauseCloudMoldTemporalSchedule(scheduleId);
  } else if (action === 'resume') {
    await resumeCloudMoldTemporalSchedule(scheduleId);
  } else {
    await triggerCloudMoldTemporalSchedule(scheduleId);
  }
  let successMessage = '已恢复';
  if (action === 'trigger') {
    successMessage = '已立即触发';
  } else if (action === 'pause') {
    successMessage = '已暂停';
  }
  message.success(successMessage);
  temporalScheduleGridApi.query();
  temporalAutomationGridApi.query();
}

const detailOpen = ref(false);
const detailLoading = ref(false);
const detailData = ref<CloudMoldAiOperationsApi.ManagedRunDetail>();
const detailError = ref('');
const detailWorkflowName = ref('');

function normalizeBusinessStatus(status?: null | string) {
  return status?.trim().toUpperCase();
}

function isWaitingStatus(status?: null | string) {
  return (
    !!status &&
    (status.startsWith('WAITING_') ||
      ['PENDING', 'PENDING_CONFIRMATION', 'PREPARE', 'QUEUED'].includes(status))
  );
}

function businessProgressLabel(
  run: Partial<CloudMoldAiOperationsApi.ManagedRun> & { status?: string },
) {
  const status = normalizeBusinessStatus(run.status);
  if (!status) return '准备中';
  if (status === 'SUCCEEDED') return '执行完成';
  if (status === 'RUNNING') return run.currentStepCode || '执行中';
  if (isWaitingStatus(status)) return '等待中';
  if (status === 'NEEDS_REVIEW') return '待人工复核';
  if (status === 'FAILED') return '执行失败';
  if (status === 'PAUSED') return '已暂停';
  if (status === 'CANCELLED') return '已取消';
  return run.currentStepCode || status;
}

function formatWhen(value?: null | string) {
  if (!value) return '-';
  return new Date(value).toLocaleString('zh-CN', { hour12: false });
}

function runCompletionLabel(run: CloudMoldAiOperationsApi.ManagedRun) {
  return formatWhen(run.completedAt || run.updatedAt || run.createdAt);
}

function detailOutcomeHeadline(
  detail?: CloudMoldAiOperationsApi.ManagedRunDetail,
) {
  return (
    detail?.task.businessOutcome?.headline ||
    detail?.businessPhases?.find((phase) => phase.businessOutcome?.headline)
      ?.businessOutcome?.headline ||
    '业务结果生成中'
  );
}

function detailOutcomeSummary(
  detail?: CloudMoldAiOperationsApi.ManagedRunDetail,
) {
  return (
    detail?.task.businessOutcome?.summary ||
    detail?.businessPhases?.find((phase) => phase.businessOutcome?.summary)
      ?.businessOutcome?.summary ||
    '当前运行尚未沉淀出明确业务结果摘要。'
  );
}

function collectBusinessObjects(
  detail?: CloudMoldAiOperationsApi.ManagedRunDetail,
) {
  const map = new Map<string, CloudMoldAiOperationsApi.ManagedBusinessObject>();
  const push = (item?: CloudMoldAiOperationsApi.ManagedBusinessObject) => {
    if (!item) return;
    const key = [
      item.objectType || '',
      item.businessId || '',
      item.businessCode || '',
      item.label || '',
    ].join('::');
    if (!map.has(key)) map.set(key, item);
  };
  detail?.task.businessOutcome?.businessObjects?.forEach(push);
  detail?.businessPhases?.forEach((phase) => {
    phase.businessOutcome?.businessObjects?.forEach(push);
    phase.actions?.forEach((action) => action.businessObjects?.forEach(push));
  });
  return [...map.values()];
}

function buildBusinessTimeline(
  detail?: CloudMoldAiOperationsApi.ManagedRunDetail,
) {
  const rows =
    detail?.businessPhases?.map((phase, index) => ({
      key: `${phase.phaseCode || 'phase'}-${index}`,
      title: phase.displayName || phase.phaseCode || `阶段 ${index + 1}`,
      status: phase.status,
      description:
        phase.businessOutcome?.summary ||
        phase.description ||
        (phase.actions?.length
          ? `包含 ${phase.actions.length} 个业务动作`
          : '等待该阶段沉淀业务结果'),
      startedAt: phase.startedAt,
      completedAt: phase.completedAt,
    })) || [];
  if (rows.length > 0) return rows;
  if (!detail?.task) return [];
  return [
    {
      key: detail.task.taskId,
      title: '当前运行',
      status: detail.task.status,
      description: detailOutcomeSummary(detail),
      startedAt: detail.task.startedAt || detail.task.createdAt,
      completedAt: detail.task.completedAt,
    },
  ];
}

function buildApprovalResponsibility(
  detail?: CloudMoldAiOperationsApi.ManagedRunDetail,
) {
  const approvalPhase = detail?.businessPhases?.find(
    (phase) => phase.approvalRequired || isWaitingStatus(phase.approvalStatus),
  );
  const waiting = isWaitingStatus(detail?.task.status);
  let approvalStatus = '无需审批';
  if (approvalPhase) {
    approvalStatus = getMeta(
      workflowRunStatusMeta,
      approvalPhase.approvalStatus,
    ).label;
  } else if (waiting) {
    approvalStatus = '等待中';
  }
  return [
    {
      label: '风险等级',
      value: approvalPhase?.riskLevel || detail?.task.riskLevel || '-',
    },
    {
      label: '审批状态',
      value: approvalStatus,
    },
    {
      label: '责任岗位',
      value: approvalPhase?.phaseCode
        ? roleName(approvalPhase.phaseCode) || approvalPhase.phaseCode
        : '由托管工作流定义',
    },
    {
      label: '当前进度',
      value: detail?.task ? businessProgressLabel(detail.task) : '-',
    },
  ];
}

async function openRunDetail(
  runId: string,
  source: CloudMoldAiOperationsApi.RunSource,
  workflowName?: string,
) {
  if (source !== 'managed') {
    return;
  }
  detailOpen.value = true;
  detailLoading.value = true;
  detailError.value = '';
  detailData.value = undefined;
  detailWorkflowName.value = workflowName || '';
  try {
    detailData.value = await getCloudMoldManagedRunDetail(runId);
  } catch (error) {
    detailError.value =
      error instanceof Error ? error.message : '详情加载失败，请稍后重试';
  } finally {
    detailLoading.value = false;
  }
}

function managedRunColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'skillId',
      fixed: 'left',
      minWidth: 180,
      slots: { default: 'managed-run-workflow' },
      title: '工作流',
    },
    {
      field: 'businessOutcome',
      minWidth: 320,
      slots: { default: 'managed-run-outcome' },
      title: '业务结果',
    },
    {
      field: 'status',
      minWidth: 100,
      slots: { default: 'managed-run-status' },
      title: '状态',
    },
    {
      field: 'currentStepCode',
      minWidth: 160,
      slots: { default: 'managed-run-current-step' },
      title: '进度',
    },
    {
      field: 'completedAt',
      minWidth: 180,
      slots: { default: 'managed-run-completed' },
      title: 'SLA / 完成时间',
    },
    {
      field: 'action',
      fixed: 'right',
      minWidth: 72,
      slots: { default: 'managed-run-action' },
      title: '操作',
    },
  ];
}

function managedArtifactColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'skillId',
      fixed: 'left',
      minWidth: 180,
      slots: { default: 'managed-artifact-workflow' },
      title: '工作流',
    },
    {
      field: 'businessOutcome',
      minWidth: 360,
      slots: { default: 'managed-artifact-outcome' },
      title: '业务结果',
    },
    {
      field: 'status',
      minWidth: 100,
      slots: { default: 'managed-artifact-status' },
      title: '状态',
    },
    {
      field: 'completedAt',
      minWidth: 180,
      slots: { default: 'managed-artifact-completed' },
      title: 'SLA / 完成时间',
    },
    {
      field: 'action',
      fixed: 'right',
      minWidth: 72,
      slots: { default: 'managed-artifact-action' },
      title: '操作',
    },
  ];
}

function managedObservationColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'skillId',
      fixed: 'left',
      minWidth: 180,
      slots: { default: 'managed-observation-workflow' },
      title: '工作流',
    },
    {
      field: 'businessOutcome',
      minWidth: 320,
      slots: { default: 'managed-observation-outcome' },
      title: '业务结果',
    },
    {
      field: 'status',
      minWidth: 100,
      slots: { default: 'managed-observation-status' },
      title: '状态',
    },
    {
      field: 'currentStepCode',
      minWidth: 160,
      slots: { default: 'managed-observation-current-step' },
      title: '进度',
    },
    {
      field: 'updatedAt',
      minWidth: 180,
      slots: { default: 'managed-observation-completed' },
      title: 'SLA / 最近观测',
    },
    {
      field: 'action',
      fixed: 'right',
      minWidth: 72,
      slots: { default: 'managed-observation-action' },
      title: '操作',
    },
  ];
}

const [ManagedWorkflowGrid, managedWorkflowGridApi] = useVbenVxeGrid({
  formOptions: {
    collapsed: true,
    collapsedRows: 1,
    schema: useManagedWorkflowFormSchema(),
    showCollapseButton: true,
  },
  gridOptions: {
    columns: useManagedWorkflowColumns(),
    height: 600,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          resetFlags(managedWorkflowFlags.value);
          try {
            const items = normalizeManagedWorkflowList(
              await getCloudMoldManagedWorkflowList(),
            );
            managedWorkflowNames.value = Object.fromEntries(
              items.map((item) => [item.skillId, item.displayName]),
            );
            const filteredItems = items.filter((item) => {
              return (
                matchFilter(item.skillId, formValues.skillId) &&
                matchFilter(item.ownerRole, formValues.ownerRole) &&
                matchFilter(item.riskLevel, formValues.riskLevel)
              );
            });
            return paginateItems(
              filteredItems,
              page.currentPage,
              page.pageSize,
            );
          } catch (error) {
            applyFailure(managedWorkflowFlags.value, error);
            return emptyPage(page.currentPage, page.pageSize);
          }
        },
      },
    },
    rowConfig: {
      height: 58,
      isHover: true,
      keyField: 'definitionClosureSha256',
    },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<CloudMoldAiOperationsApi.ManagedWorkflow>,
});

const [ManagedRunGrid] = useVbenVxeGrid({
  formOptions: {
    collapsed: true,
    collapsedRows: 1,
    schema: useManagedRunFormSchema(),
    showCollapseButton: true,
  },
  gridOptions: {
    columns: managedRunColumns(),
    height: 600,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          resetFlags(managedRunFlags.value);
          try {
            return await getCloudMoldManagedRunPage({
              pageNo: page.currentPage,
              pageSize: page.pageSize,
              ...formValues,
            });
          } catch (error) {
            applyFailure(managedRunFlags.value, error);
            return emptyPage(page.currentPage, page.pageSize);
          }
        },
      },
    },
    rowConfig: { height: 58, isHover: true, keyField: 'taskId' },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<CloudMoldAiOperationsApi.ManagedRun>,
});

const [ManagedArtifactGrid] = useVbenVxeGrid({
  formOptions: {
    collapsed: true,
    collapsedRows: 1,
    schema: useManagedRunFormSchema(),
    showCollapseButton: true,
  },
  gridOptions: {
    columns: managedArtifactColumns(),
    height: 600,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          resetFlags(managedArtifactFlags.value);
          try {
            return await getCloudMoldManagedRunPage({
              pageNo: page.currentPage,
              pageSize: page.pageSize,
              ...formValues,
            });
          } catch (error) {
            applyFailure(managedArtifactFlags.value, error);
            return emptyPage(page.currentPage, page.pageSize);
          }
        },
      },
    },
    rowConfig: { height: 64, isHover: true, keyField: 'taskId' },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<CloudMoldAiOperationsApi.ManagedRun>,
});

const [ManagedObservationGrid] = useVbenVxeGrid({
  formOptions: {
    collapsed: true,
    collapsedRows: 1,
    schema: useManagedRunFormSchema(),
    showCollapseButton: true,
  },
  gridOptions: {
    columns: managedObservationColumns(),
    height: 600,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          resetFlags(managedObservationFlags.value);
          try {
            return await getCloudMoldManagedRunPage({
              pageNo: page.currentPage,
              pageSize: page.pageSize,
              ...formValues,
            });
          } catch (error) {
            applyFailure(managedObservationFlags.value, error);
            return emptyPage(page.currentPage, page.pageSize);
          }
        },
      },
    },
    rowConfig: { height: 58, isHover: true, keyField: 'taskId' },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<CloudMoldAiOperationsApi.ManagedRun>,
});

const cards = ref<CloudMoldAgentControlApi.BusinessCard[]>([]);
const approvalBoardStats = ref<CloudMoldAgentControlApi.ApprovalBoardStats>();
const cardsLoading = ref(false);
const cardsLoaded = ref(false);
const cardsLoadFailed = ref(false);
const cardsUnavailable = ref(false);
const cardsUnauthorized = ref(false);
const roleCode = ref<string>();
const cardType = ref<CloudMoldAgentControlApi.CardType>('APPROVAL');
const approvalAssignOpen = ref(false);
const approvalAssigning = ref(false);
const approvalAssigneeUserId = ref<number>();
const selectedApprovalCard = ref<CloudMoldAgentControlApi.BusinessCard>();
const approvalUserNames = ref<Record<number, string>>({});

const roleOptions = buildApprovalRoleOptions();

const typeOptions = [
  { label: '待审批', value: 'APPROVAL' },
  { label: '岗位交接', value: 'HANDOFF' },
  { label: '业务结果', value: 'RESULT' },
];

const statusNames: Record<string, string> = {
  ACCEPTED: '已接单',
  APPROVED: '已批准',
  COMPLETED: '已完成',
  PENDING: '待处理',
  REJECTED: '已拒绝',
};

function roleName(code?: string) {
  return agentControlRoleLabel(code);
}

function statusColor(status: string) {
  if (['ACCEPTED', 'APPROVED', 'COMPLETED'].includes(status)) return 'green';
  if (status === 'PENDING') return 'gold';
  if (status === 'REJECTED') return 'red';
  return 'blue';
}

function formatTime(value?: string) {
  if (!value) return '-';
  return new Date(value).toLocaleString('zh-CN', { hour12: false });
}

function activeAssigneeUserIds(value?: string) {
  return (value ?? '')
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isSafeInteger(item) && item > 0);
}

function approvalUserName(userId?: number) {
  if (!userId) return '审批人待指定';
  return approvalUserNames.value[userId] ?? '审批人名称加载中…';
}

function activeAssigneeNames(value?: string) {
  return activeAssigneeUserIds(value)
    .map((userId) => approvalUserName(userId))
    .join('、');
}

async function loadApprovalUserNames(
  items: CloudMoldAgentControlApi.BusinessCard[],
) {
  const userIds = new Set<number>();
  items.forEach((item) => {
    if (item.approverUserId) userIds.add(item.approverUserId);
    activeAssigneeUserIds(item.activeAssigneeUserIds).forEach((userId) =>
      userIds.add(userId),
    );
  });
  await Promise.all(
    [...userIds]
      .filter((userId) => !approvalUserNames.value[userId])
      .map(async (userId) => {
        try {
          const user = await getSimpleUser(userId);
          approvalUserNames.value = {
            ...approvalUserNames.value,
            [userId]: user.nickname || user.username || '未知审批人',
          };
        } catch {
          approvalUserNames.value = {
            ...approvalUserNames.value,
            [userId]: '未知审批人',
          };
        }
      }),
  );
}

function approvalWorkflowSummary(item: CloudMoldAgentControlApi.BusinessCard) {
  if (
    item.workflowStatus === 'APPROVED_ATTESTED' &&
    item.status === 'APPROVED'
  ) {
    return '审批已安全确认，等待 Temporal / Agent 执行';
  }
  if (item.workflowStatus === 'START_UNCERTAIN') {
    return 'BPM 发起结果不确定，自动重试已禁用；请先对账后再处理';
  }
  if (item.activeAssigneeUserIds) {
    return `审批流程进行中，当前等待会签人 ${activeAssigneeNames(item.activeAssigneeUserIds)} 办理`;
  }
  if (item.processInstanceId || item.workflowStatus === 'RUNNING') {
    return `已进入工作流程，等待审批人 ${approvalUserName(item.approverUserId)} 办理`;
  }
  if (item.workflowStatus === 'START_REQUESTED') {
    return '等待治理员指定本次审批人';
  }
  if (item.workflowStatus === 'BPM_APPROVED_PENDING_ATTESTATION') {
    return 'BPM 已通过，正在完成安全确认';
  }
  return approvalGateSummary(item.status);
}

function approvalDecision(item: CloudMoldAgentControlApi.BusinessCard) {
  return buildApprovalDecisionPresentation(item);
}

function scrollToManagedObservation() {
  document
    .querySelector('#managed-observation-detail')
    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function openApproval(item: CloudMoldAgentControlApi.BusinessCard) {
  if (!item.processInstanceId) return;
  router.push({
    name: 'BpmProcessInstanceDetail',
    query: { id: item.processInstanceId },
  });
}

function openApprovalAssignment(item: CloudMoldAgentControlApi.BusinessCard) {
  selectedApprovalCard.value = item;
  approvalAssigneeUserId.value = undefined;
  approvalAssignOpen.value = true;
}

async function confirmApprovalAssignment() {
  const item = selectedApprovalCard.value;
  if (!item || !approvalAssigneeUserId.value) {
    message.warning('请选择审批人');
    return;
  }
  if (!item.scopeHash) {
    message.error('审批冻结范围缺失，不能指定审批人');
    return;
  }
  approvalAssigning.value = true;
  try {
    await grantApprover(
      approvalAssigneeUserId.value,
      item.cardId,
      item.roleCode,
      item.actionCode,
      item.riskLevel,
      item.scopeHash,
      new Date(Date.now() - 60_000).toISOString(),
      new Date(Date.now() + 24 * 60 * 60_000).toISOString(),
    );
    message.success('审批人已指定，工作流程待办正在生成');
    approvalAssignOpen.value = false;
    window.setTimeout(loadApprovalCards, 2500);
  } catch (error) {
    message.error(
      `指定失败：${error instanceof Error ? error.message : '请稍后重试'}`,
    );
  } finally {
    approvalAssigning.value = false;
  }
}

async function loadApprovalCards() {
  if (!hasAccessByCodes(['cloudmold:agent-control:query'])) {
    cards.value = [];
    cardsLoadFailed.value = false;
    cardsUnavailable.value = false;
    cardsUnauthorized.value = true;
    cardsLoading.value = false;
    cardsLoaded.value = true;
    return;
  }
  cardsLoading.value = true;
  try {
    const [pendingCards, stats] = await Promise.all([
      getCloudMoldAgentBusinessCards({
        cardType: cardType.value,
        limit: 100,
        roleCode: roleCode.value,
        status: 'PENDING',
      }),
      getCloudMoldAgentApprovalBoardStats(),
    ]);
    cards.value = pendingCards;
    approvalBoardStats.value = stats;
    await loadApprovalUserNames(cards.value);
    cardsLoadFailed.value = false;
    cardsUnavailable.value = false;
    cardsUnauthorized.value = false;
  } catch (error) {
    cards.value = [];
    approvalBoardStats.value = undefined;
    cardsUnauthorized.value = isAgentControlForbidden(error);
    cardsUnavailable.value =
      isAgentControlUnavailable(error) || isEndpointUnavailable(error);
    cardsLoadFailed.value = !cardsUnauthorized.value && !cardsUnavailable.value;
  } finally {
    cardsLoading.value = false;
    cardsLoaded.value = true;
  }
}

watch(activeTab, (tab) => {
  if (tab === 'role-capabilities') {
    loadRoleCapabilities();
  }
  if (tab === 'managed-workflows') {
    managedWorkflowGridApi.query();
  }
  if (tab === 'observations-approval' && !cardsLoaded.value) {
    loadApprovalCards();
  }
});

function refreshManagedWorkflowsOnFocus() {
  if (activeTab.value === 'managed-workflows') {
    managedWorkflowGridApi.query();
  }
  if (activeTab.value === 'role-capabilities') {
    loadRoleCapabilities();
  }
}

onActivated(() => {
  refreshManagedWorkflowsOnFocus();
  window.addEventListener('focus', refreshManagedWorkflowsOnFocus);
});

onDeactivated(() => {
  window.removeEventListener('focus', refreshManagedWorkflowsOnFocus);
});

onMounted(() => {
  if (activeTab.value === 'observations-approval') {
    loadApprovalCards();
  }
});
</script>

<template>
  <Page auto-content-height content-class="flex min-h-0 flex-col">
    <EvidenceAlert
      message="AI 运营控制台"
      :description="aiOperationsConsoleNotice"
    />

    <Tabs
      v-model:active-key="activeTab"
      class="cloudmold-grid-tabs min-h-0 w-full flex-1"
    >
      <Tabs.TabPane key="temporal-schedules" tab="定时任务">
        <div class="flex min-h-0 flex-col gap-4">
          <Alert
            type="info"
            show-icon
            message="调度、候选与业务自治分层计量"
            description="Temporal 调度健康只说明每日计划可触发；候选源覆盖说明业务对象能够进入队列；只有已形成业务终态实证的工作流才计入自治实证。候选已分发或本次无到期对象都不等于业务自治成功。"
          />
          <Alert
            v-if="temporalAutomationFlags.unavailable"
            type="warning"
            show-icon
            message="自动化总览能力尚未启用"
            description="调度控制仍可使用；总览接口启用后将展示调度覆盖、候选源覆盖、自治实证和逐工作流缺口。"
          />
          <Alert
            v-else-if="temporalAutomationFlags.loadFailed"
            type="error"
            show-icon
            message="自动化总览加载失败"
            description="请检查后端服务后重试。调度配置与业务自治实证不会被合并推断。"
          />
          <Alert
            v-if="temporalScheduleFlags.unavailable"
            type="warning"
            show-icon
            message="Temporal 调度能力尚未启用"
            description="启用后可在此查看全部托管工作流的每日发现计划、输入策略、上次/下次触发时间和暂停状态。"
          />
          <Alert
            v-else-if="temporalScheduleFlags.loadFailed"
            type="error"
            show-icon
            message="Temporal 定时任务加载失败"
            description="请检查 Temporal 服务和后端连接状态后重试。"
          />

          <Row v-if="temporalAutomationOverview" :gutter="[16, 16]">
            <Col :lg="8" :xs="24">
              <Card
                class="h-full"
                :bordered="false"
                :loading="temporalAutomationLoading"
                size="small"
              >
                <Statistic
                  title="调度覆盖率"
                  suffix="%"
                  :value="
                    toCoveragePercent(
                      temporalAutomationOverview.scheduleCoverageRate,
                    )
                  "
                />
                <div class="mt-2 text-xs text-muted-foreground">
                  健康 {{ temporalAutomationOverview.healthyScheduleCount }} /
                  {{ temporalAutomationOverview.registeredCount }}，已创建
                  {{ temporalAutomationOverview.scheduledCount }} 个调度
                </div>
              </Card>
            </Col>
            <Col :lg="8" :xs="24">
              <Card
                class="h-full"
                :bordered="false"
                :loading="temporalAutomationLoading"
                size="small"
              >
                <Statistic
                  title="候选源覆盖率"
                  suffix="%"
                  :value="
                    toCoveragePercent(
                      temporalAutomationOverview.candidateSourceCoverageRate,
                    )
                  "
                />
                <div class="mt-2 text-xs text-muted-foreground">
                  {{ temporalAutomationOverview.candidateSourceConnectedCount }}
                  / {{ temporalAutomationOverview.registeredCount }}
                  个工作流已接入可识别候选源
                </div>
              </Card>
            </Col>
            <Col :lg="8" :xs="24">
              <Card
                class="h-full"
                :bordered="false"
                :loading="temporalAutomationLoading"
                size="small"
              >
                <Statistic
                  title="自治实证覆盖率"
                  suffix="%"
                  :value="
                    toCoveragePercent(
                      temporalAutomationOverview.autonomyProofCoverageRate,
                    )
                  "
                />
                <div class="mt-2 text-xs text-muted-foreground">
                  {{ temporalAutomationOverview.autonomyProvenCount }} /
                  {{ temporalAutomationOverview.registeredCount }}
                  个工作流已有业务终态实证
                </div>
              </Card>
            </Col>
          </Row>

          <TemporalAutomationGrid table-title="自动化总览">
            <template #automation-workflow="{ row }">
              <div class="min-w-0 py-1">
                <div class="truncate font-medium text-foreground">
                  {{ row.displayName }}
                </div>
                <div
                  class="truncate text-xs text-muted-foreground"
                  :title="row.skillId"
                >
                  {{ row.skillId }} · {{ row.skillVersion }}
                </div>
              </div>
            </template>
            <template #automation-schedule="{ row }">
              <StatusTag
                v-bind="temporalScheduleStateSummary(row.scheduleState)"
              />
            </template>
            <template #automation-source="{ row }">
              <StatusTag
                v-bind="temporalDiscoverySourceSummary(row.discoverySource)"
              />
            </template>
            <template #automation-dispatch="{ row }">
              <StatusTag
                v-bind="temporalDispatchOutcomeSummary(row.lastDispatchOutcome)"
              />
            </template>
            <template #automation-candidates="{ row }">
              <div class="text-sm">
                候选 {{ row.candidateCount }} · 已分发
                {{ row.dispatchedCount }}
              </div>
              <div
                :class="
                  row.failedCount > 0
                    ? 'text-xs text-destructive'
                    : 'text-xs text-muted-foreground'
                "
              >
                失败 {{ row.failedCount }}
              </div>
            </template>
            <template #automation-autonomy="{ row }">
              <StatusTag
                v-bind="
                  temporalBusinessAutonomySummary(row.businessAutonomyState)
                "
              />
            </template>
            <template #automation-gaps="{ row }">
              <Space v-if="row.gapCodes?.length" wrap :size="[4, 4]">
                <StatusTag
                  v-for="gap in row.gapCodes"
                  :key="gap"
                  color="warning"
                  :label="temporalGapSummary(gap)"
                />
              </Space>
              <StatusTag v-else color="success" label="无已知缺口" />
            </template>
            <template #automation-proof="{ row }">
              <CopyIdCell
                v-if="row.proofRef"
                :value="row.proofRef"
                label="自治实证引用"
              />
              <span v-else class="text-muted-foreground">尚无实证</span>
            </template>
          </TemporalAutomationGrid>

          <TemporalScheduleGrid table-title="Temporal 调度控制">
            <template #temporal-name="{ row }">
              <div class="min-w-0 py-1">
                <div class="truncate font-medium text-foreground">
                  {{ row.displayName }}
                </div>
                <div class="truncate text-xs text-muted-foreground">
                  {{ row.description }}
                </div>
              </div>
            </template>
            <template #temporal-workflow="{ row }">
              <div class="truncate" :title="row.skillId">
                {{ workflowName(row.skillId) }}
              </div>
            </template>
            <template #temporal-interval="{ row }">
              <div>
                <div>
                  {{
                    row.cronExpression
                      ? `每日（${row.timeZone}）`
                      : row.intervalSeconds === 3600
                        ? '每小时'
                        : `${row.intervalSeconds} 秒`
                  }}
                </div>
                <div
                  v-if="row.cronExpression"
                  class="text-xs text-muted-foreground"
                >
                  {{ row.cronExpression }}
                </div>
              </div>
            </template>
            <template #temporal-strategy="{ row }">
              <StatusTag
                v-bind="
                  row.inputStrategy === 'TENANT_AGGREGATE'
                    ? { color: 'success', label: '租户汇总输入' }
                    : row.inputStrategy === 'EVENT_BACKLOG'
                      ? { color: 'processing', label: '事件候选队列' }
                      : row.inputStrategy === 'DOMAIN_BACKLOG'
                        ? { color: 'processing', label: '领域业务待办' }
                        : row.inputStrategy === 'ROTATING_BUSINESS_SCENARIO'
                          ? { color: 'success', label: '轮换业务场景' }
                          : { color: 'default', label: '固定输入' }
                "
              />
            </template>
            <template #temporal-status="{ row }">
              <StatusTag
                v-bind="
                  row.status === 'DRIFTED'
                    ? { color: 'error', label: '配置漂移' }
                    : row.paused
                      ? { color: 'warning', label: '已暂停' }
                      : { color: 'success', label: '调度运行中' }
                "
              />
            </template>
            <template #temporal-action="{ row }">
              <TableAction
                :actions="[
                  {
                    label: '立即触发',
                    onClick: () =>
                      operateTemporalSchedule('trigger', row.scheduleId),
                    type: 'link',
                  },
                  {
                    label: row.paused ? '恢复' : '暂停',
                    onClick: () =>
                      operateTemporalSchedule(
                        row.paused ? 'resume' : 'pause',
                        row.scheduleId,
                      ),
                    type: 'link',
                  },
                ]"
              />
            </template>
          </TemporalScheduleGrid>
        </div>
      </Tabs.TabPane>

      <Tabs.TabPane key="role-capabilities" tab="岗位能力地图">
        <div class="flex min-h-0 flex-col gap-4">
          <Alert
            type="info"
            show-icon
            message="把工作流还原为日常经营岗位"
            description="每张卡片对应一个主要经营岗位，展示它能编排的日常职责、可回读的内部权威产物，以及必须由外部系统或人工确认的事实门禁。“已登记”只表示托管定义存在，不等于已审批、已首跑或已形成业务结果。"
          />
          <Alert
            v-if="roleCapabilityFlags.unavailable"
            type="warning"
            show-icon
            message="岗位能力地图暂时无法读取托管注册表"
            description="请在托管工作流接口恢复后刷新；页面不会以静态文案替代真实登记状态。"
          />
          <Alert
            v-else-if="roleCapabilityFlags.loadFailed"
            type="error"
            show-icon
            message="岗位能力地图加载失败"
            description="请检查 AI 运营查询权限和后端服务后重试。"
          />
          <Alert
            v-if="roleAutomationEvidenceUnavailable"
            type="warning"
            show-icon
            message="岗位定义已读取，自动化实证暂不可读取"
            description="当前仍会展示登记与事实门禁；调度、候选源和自治实证不会被猜测为成功。"
          />
          <Row v-if="!roleCapabilityFlags.unavailable" :gutter="[16, 16]">
            <Col :xs="24" :sm="8">
              <Card :loading="roleCapabilityLoading" size="small">
                <Statistic
                  title="已托管经营岗位"
                  :value="registeredRoleCount()"
                  :suffix="`/ ${roleCapabilityEntries.length || 40}`"
                />
              </Card>
            </Col>
            <Col :xs="24" :sm="8">
              <Card :loading="roleCapabilityLoading" size="small">
                <Statistic
                  title="已映射托管工作流"
                  :value="registeredWorkflowCount()"
                  suffix="条"
                />
              </Card>
            </Col>
            <Col :xs="24" :sm="8">
              <Card :loading="roleCapabilityLoading" size="small">
                <Statistic
                  title="待建设横向岗位"
                  :value="foundationRoleCount()"
                  suffix="个"
                />
              </Card>
            </Col>
          </Row>
          <Empty
            v-if="
              !roleCapabilityLoading &&
              !roleCapabilityEntries.length &&
              !roleCapabilityFlags.loadFailed &&
              !roleCapabilityFlags.unavailable
            "
            description="尚未返回托管工作流注册表"
          />
          <Row v-else :gutter="[16, 16]">
            <Col
              v-for="entry in roleCapabilityEntries"
              :key="entry.ownerRole"
              :xs="24"
              :lg="12"
              :xl="8"
            >
              <Card class="h-full" size="small">
                <Space direction="vertical" class="w-full" :size="8">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <Typography.Text strong>
                        {{ managedWorkflowOwnerRoleLabel(entry.ownerRole) }}
                      </Typography.Text>
                      <div class="mt-1 text-xs text-muted-foreground">
                        {{ entry.domain }}
                      </div>
                    </div>
                    <StatusTag
                      v-bind="
                        entry.capabilityStage === 'FOUNDATION_REQUIRED'
                          ? {
                              color: 'default',
                              label: '待建设：缺少权威数据源',
                            }
                          : entry.workflowCount > 0
                            ? {
                                color: 'success',
                                label: `已登记 ${entry.workflowCount} 条`,
                              }
                            : { color: 'warning', label: '待补齐定义' }
                      "
                    />
                  </div>
                  <Typography.Paragraph class="mb-0" :ellipsis="{ rows: 2 }">
                    <Typography.Text strong>日常职责：</Typography.Text>
                    {{ entry.dailyDuty }}
                  </Typography.Paragraph>
                  <Typography.Paragraph class="mb-0" :ellipsis="{ rows: 2 }">
                    <Typography.Text strong>可验证产物：</Typography.Text>
                    {{ entry.verifiableOutcome }}
                  </Typography.Paragraph>
                  <Typography.Paragraph class="mb-0" :ellipsis="{ rows: 2 }">
                    <Typography.Text strong>外部事实门禁：</Typography.Text>
                    {{ entry.externalFactGate }}
                  </Typography.Paragraph>
                  <template v-if="entry.foundationRequirements">
                    <Typography.Paragraph class="mb-0" :ellipsis="{ rows: 2 }">
                      <Typography.Text strong>需接通：</Typography.Text>
                      {{
                        entry.foundationRequirements.authoritySources.join('、')
                      }}
                    </Typography.Paragraph>
                    <Typography.Paragraph class="mb-0" :ellipsis="{ rows: 2 }">
                      <Typography.Text strong>受控产物：</Typography.Text>
                      {{ entry.foundationRequirements.controlledArtifact }}
                    </Typography.Paragraph>
                    <Typography.Text type="secondary" class="text-xs">
                      {{ entry.foundationRequirements.approvalBoundary }}
                    </Typography.Text>
                  </template>
                  <template v-if="entry.automation.length">
                    <Space wrap>
                      <StatusTag
                        v-bind="
                          temporalScheduleStateSummary(
                            entry.automation[0]?.scheduleState,
                          )
                        "
                      />
                      <StatusTag
                        v-bind="
                          temporalBusinessAutonomySummary(
                            entry.automation[0]?.businessAutonomyState,
                          )
                        "
                      />
                    </Space>
                    <Typography.Text type="secondary" class="text-xs">
                      候选 {{ entry.automation[0]?.candidateCount ?? 0 }} 个；
                      {{
                        temporalDiscoverySourceSummary(
                          entry.automation[0]?.discoverySource,
                        ).label
                      }}
                    </Typography.Text>
                  </template>
                  <Typography.Text v-else type="secondary" class="text-xs">
                    {{
                      entry.capabilityStage === 'FOUNDATION_REQUIRED'
                        ? '尚未建立候选源、受控写入点和责任人门禁'
                        : roleAutomationEvidenceUnavailable
                          ? '自动化实证暂不可读取'
                          : '尚未形成自动化观测，不计入运行成功'
                    }}
                  </Typography.Text>
                  <Typography.Text
                    v-if="entry.workflowCount"
                    type="secondary"
                    class="block truncate text-xs"
                    :title="entry.workflowIds.join('、')"
                  >
                    {{ entry.workflowIds.join('、') }}
                  </Typography.Text>
                </Space>
              </Card>
            </Col>
          </Row>
        </div>
      </Tabs.TabPane>

      <Tabs.TabPane key="managed-workflows" tab="托管工作流">
        <div class="flex min-h-0 flex-col gap-4">
          <Alert
            v-if="managedWorkflowFlags.unavailable"
            type="warning"
            show-icon
            message="托管工作流事实接口暂未接入"
            description="当前优先托管视图已预留接线；接口可用后将直接读取 SkillTask registry 的脱敏事实。"
          />
          <Alert
            v-else-if="managedWorkflowFlags.loadFailed"
            type="error"
            show-icon
            message="托管工作流加载失败"
            description="请检查后端服务与权限后重试。"
          />
          <ManagedWorkflowGrid table-title="托管工作流">
            <template #managed-workflow-owner-role="{ row }">
              <span :title="row.ownerRole">
                {{ managedWorkflowOwnerRoleLabel(row.ownerRole) }}
              </span>
            </template>
            <template #managed-workflow-steps="{ row }">
              {{ row.stepCount }} 步（{{ row.writeStepCount }} 个写操作）
            </template>
            <template #managed-workflow-approval="{ row }">
              <StatusTag
                v-bind="
                  row.approvalRequired
                    ? { color: 'warning', label: '需要 BPM' }
                    : { color: 'success', label: '无需审批' }
                "
              />
            </template>
            <template #managed-workflow-action="{ row }">
              <TableAction
                :actions="[
                  {
                    label: '详情',
                    onClick: () => openWorkflowDetail(row),
                    type: 'link',
                  },
                ]"
              />
            </template>
          </ManagedWorkflowGrid>
        </div>
      </Tabs.TabPane>

      <Tabs.TabPane key="runs" tab="运行实例">
        <div class="flex min-h-0 flex-col gap-4">
          <Alert
            v-if="managedRunFlags.unavailable"
            type="warning"
            show-icon
            message="托管运行实例接口暂未接入"
            description="运行实例页仍保留 AI 遥测视角；托管接口到位后将优先展示 SkillTask instance 事实。"
          />
          <Alert
            v-else-if="managedRunFlags.loadFailed"
            type="error"
            show-icon
            message="托管运行实例加载失败"
            description="请检查后端服务与权限后重试。"
          />
          <ManagedRunGrid table-title="托管运行实例">
            <template #managed-run-workflow="{ row }">
              <div class="truncate" :title="row.skillId">
                {{ workflowName(row.skillId) }}
              </div>
            </template>
            <template #managed-run-outcome="{ row }">
              <div class="min-w-0 py-1">
                <div class="truncate font-medium text-foreground">
                  {{ row.businessOutcome?.headline || '业务结果生成中' }}
                </div>
                <div class="truncate text-xs text-muted-foreground">
                  {{
                    row.businessOutcome?.summary || '任务完成后生成业务结果摘要'
                  }}
                </div>
              </div>
            </template>
            <template #managed-run-status="{ row }">
              <StatusTag v-bind="getMeta(workflowRunStatusMeta, row.status)" />
            </template>
            <template #managed-run-current-step="{ row }">
              <span class="truncate" :title="row.currentStepCode">
                {{
                  row.status === 'SUCCEEDED'
                    ? '执行完成'
                    : businessProgressLabel(row)
                }}
              </span>
            </template>
            <template #managed-run-completed="{ row }">
              {{ runCompletionLabel(row) }}
            </template>
            <template #managed-run-action="{ row }">
              <TableAction
                :actions="[
                  {
                    label: '详情',
                    onClick: () =>
                      openRunDetail(
                        row.taskId,
                        'managed',
                        workflowName(row.skillId),
                      ),
                    type: 'link',
                  },
                ]"
              />
            </template>
          </ManagedRunGrid>
        </div>
      </Tabs.TabPane>

      <Tabs.TabPane key="artifacts" tab="运行产物">
        <div class="flex min-h-0 flex-col gap-4">
          <Alert
            v-if="managedArtifactFlags.unavailable"
            type="warning"
            show-icon
            message="SkillTask 终态产物接口暂未接通"
            description="托管产物展示脱敏后的业务结果；原始负载不直接返回。"
          />
          <Alert
            v-else-if="managedArtifactFlags.loadFailed"
            type="error"
            show-icon
            message="SkillTask 终态产物加载失败"
            description="请检查 SkillTask 执行服务与跨服务读取链路后重试。"
          />
          <ManagedArtifactGrid table-title="Agent 业务产物">
            <template #managed-artifact-workflow="{ row }">
              <div class="truncate" :title="row.skillId">
                {{ workflowName(row.skillId) }}
              </div>
            </template>
            <template #managed-artifact-outcome="{ row }">
              <div class="min-w-0 py-1">
                <div class="truncate font-medium text-foreground">
                  {{ row.businessOutcome?.headline || '业务结果生成中' }}
                </div>
                <div class="truncate text-xs text-muted-foreground">
                  {{
                    row.businessOutcome?.summary || '任务完成后生成业务结果摘要'
                  }}
                </div>
              </div>
            </template>
            <template #managed-artifact-status="{ row }">
              <StatusTag v-bind="getMeta(workflowRunStatusMeta, row.status)" />
            </template>
            <template #managed-artifact-completed="{ row }">
              {{ runCompletionLabel(row) }}
            </template>
            <template #managed-artifact-action="{ row }">
              <TableAction
                :actions="[
                  {
                    label: '详情',
                    onClick: () =>
                      openRunDetail(
                        row.taskId,
                        'managed',
                        workflowName(row.skillId),
                      ),
                    type: 'link',
                  },
                ]"
              />
            </template>
          </ManagedArtifactGrid>
        </div>
      </Tabs.TabPane>

      <Tabs.TabPane key="observations-approval" tab="观测与审批">
        <section class="approval-workspace">
          <div class="approval-hero">
            <div class="approval-hero-copy">
              <div class="approval-hero-crumb">AI 运营 / 观测与审批</div>
              <h2>审批工作台</h2>
              <p>
                聚焦需要人工判断的业务节点，清晰连接审批门禁、任务执行与运行观测。
              </p>
              <Space wrap>
                <Button
                  type="primary"
                  :loading="cardsLoading"
                  @click="loadApprovalCards"
                >
                  刷新队列
                </Button>
                <Button @click="scrollToManagedObservation">
                  查看运行观测
                </Button>
              </Space>
            </div>
            <div class="approval-focus-metric">
              <span>当前审批阻塞</span>
              <strong>{{ approvalBoardStats?.pendingTotal ?? '-' }}</strong>
              <small v-if="approvalBoardStats">
                {{ approvalBoardStats.bpmInProgress }} 项正在 BPM 审批
              </small>
              <small v-else>正在加载审批汇总</small>
            </div>
          </div>

          <div class="approval-gate-note" aria-label="BPM 审批门禁说明">
            <StatusTag color="processing" label="BPM 审批门禁" />
            <span>指定审批人 → 工作流程待办 → 人工办理 → 安全确认 → 自动恢复
              Agent</span>
            <span class="approval-gate-note-muted">
              已安全确认的记录会显示为“等待执行”，不会计入审批阻塞。
            </span>
          </div>

          <section v-if="approvalBoardStats" class="approval-funnel">
            <div class="approval-section-heading">
              <div>
                <span class="approval-eyebrow">审批链路</span>
                <h3>从风险识别到安全放行</h3>
              </div>
              <span class="approval-section-hint">实时汇总</span>
            </div>
            <div class="approval-metric-grid">
              <div class="approval-metric is-primary">
                <span>审批阻塞总数</span>
                <strong>{{ approvalBoardStats.pendingTotal }}</strong>
              </div>
              <div class="approval-metric">
                <span>BPM 审批中</span>
                <strong>{{ approvalBoardStats.bpmInProgress }}</strong>
              </div>
              <div class="approval-metric">
                <span>待指定审批人</span>
                <strong>{{
                  approvalBoardStats.approverAssignmentRequired
                }}</strong>
              </div>
              <div class="approval-metric">
                <span>启动结果待对账</span>
                <strong>{{ approvalBoardStats.startUncertain }}</strong>
              </div>
              <div class="approval-metric">
                <span>终态待安全确认</span>
                <strong>{{
                  approvalBoardStats.bpmTerminalPendingSafety
                }}</strong>
              </div>
              <div class="approval-metric">
                <span>已放行待执行</span>
                <strong>{{
                  approvalBoardStats.releasedWaitingExecution
                }}</strong>
              </div>
            </div>
          </section>

          <Alert
            v-if="cardsUnavailable"
            banner
            type="warning"
            show-icon
            message="审批能力当前未启用，运行观测仍可使用"
          />
          <Alert
            v-else-if="cardsUnauthorized"
            banner
            type="warning"
            show-icon
            message="当前账号缺少审批查询权限，请重新登录以刷新最新权限"
          />
          <Alert
            v-else-if="cardsLoadFailed"
            banner
            type="error"
            show-icon
            message="审批卡片加载失败"
          />

          <div class="approval-workbench">
            <section
              v-if="!cardsUnavailable && !cardsUnauthorized"
              class="approval-queue"
            >
              <div class="approval-queue-heading">
                <div>
                  <span class="approval-eyebrow">优先处理</span>
                  <h3>待处理事项</h3>
                </div>
                <Space wrap>
                  <Select
                    v-model:value="roleCode"
                    class="approval-filter"
                    allow-clear
                    placeholder="选择岗位"
                    :options="roleOptions"
                    @change="loadApprovalCards"
                  />
                  <Select
                    v-model:value="cardType"
                    class="approval-filter"
                    allow-clear
                    placeholder="选择事项"
                    :options="typeOptions"
                    @change="loadApprovalCards"
                  />
                </Space>
              </div>

              <Empty
                v-if="!cardsLoading && !cards.length"
                class="approval-empty-state"
                description="当前没有待处理审批卡片"
              />
              <div v-else class="approval-card-list">
                <article
                  v-for="item in cards"
                  :key="item.cardId"
                  class="approval-card"
                >
                  <div class="approval-card-topline">
                    <StatusTag
                      v-bind="getMeta(approvalStatusMeta, item.status)"
                    />
                    <span class="approval-card-role">{{
                      roleName(item.roleCode)
                    }}</span>
                  </div>
                  <h4>{{ approvalDecision(item)?.title || item.title }}</h4>
                  <p class="approval-card-workflow">
                    {{ approvalWorkflowSummary(item) }}
                  </p>
                  <div
                    v-if="
                      item.cardType === 'APPROVAL' && approvalDecision(item)
                    "
                    class="approval-card-decision"
                  >
                    <div>
                      <span>要完成什么</span>
                      <p>{{ approvalDecision(item)?.objective }}</p>
                    </div>
                    <div>
                      <span>高风险原因</span>
                      <p>{{ approvalDecision(item)?.riskReason }}</p>
                    </div>
                  </div>
                  <Typography.Paragraph
                    class="approval-card-summary"
                    :ellipsis="{ rows: 2, expandable: true }"
                  >
                    {{
                      item.summary ||
                      '当前卡片只保留岗位、风险和摘要，不展示原始票据或技术上下文。'
                    }}
                  </Typography.Paragraph>
                  <div class="approval-card-footer">
                    <Space wrap>
                      <StatusTag
                        v-bind="{
                          color: statusColor(item.status),
                          label: statusNames[item.status] ?? item.status,
                        }"
                      />
                      <span>{{ formatTime(item.occurredAt) }}</span>
                    </Space>
                    <Button
                      v-if="item.processInstanceId"
                      size="small"
                      type="link"
                      @click="openApproval(item)"
                    >
                      审阅业务影响与流程
                    </Button>
                    <Button
                      v-else-if="
                        item.cardType === 'APPROVAL' &&
                        item.status === 'PENDING' &&
                        item.workflowStatus === 'START_REQUESTED' &&
                        hasAccessByCodes(['cloudmold:agent-control:govern']) &&
                        Number(userStore.userInfo?.id) !== item.requesterUserId
                      "
                      size="small"
                      type="link"
                      @click="openApprovalAssignment(item)"
                    >
                      指定审批人
                    </Button>
                    <Typography.Text
                      v-else-if="item.workflowStatus === 'START_UNCERTAIN'"
                      type="warning"
                    >
                      需对账
                    </Typography.Text>
                  </div>
                </article>
              </div>
            </section>

            <aside class="approval-observation-aside">
              <div>
                <span class="approval-eyebrow">运行观测</span>
                <h3>Agent 执行护栏</h3>
                <p>
                  审批状态、当前步骤与重试情况在下方 SkillTask 明细中统一核查。
                </p>
              </div>
              <div
                class="approval-observation-status"
                :class="{
                  'is-unavailable':
                    managedObservationFlags.unavailable ||
                    managedObservationFlags.loadFailed,
                }"
              >
                <span class="approval-observation-dot"></span>
                <div>
                  <strong>
                    {{
                      managedObservationFlags.unavailable ||
                      managedObservationFlags.loadFailed
                        ? '观测链路需要检查'
                        : '观测链路已就绪'
                    }}
                  </strong>
                  <p>
                    {{
                      managedObservationFlags.unavailable ||
                      managedObservationFlags.loadFailed
                        ? '请检查下方提示并恢复 SkillTask 运行观测接口。'
                        : '支持按运行状态、工作流和时间范围快速检索。'
                    }}
                  </p>
                </div>
              </div>
              <div class="approval-safety-rule">
                <span>安全放行规则</span>
                <p>仅在审批通过并完成安全确认后，Agent 才会恢复执行。</p>
              </div>
              <Button block @click="scrollToManagedObservation">
                打开运行明细
              </Button>
            </aside>
          </div>

          <section
            id="managed-observation-detail"
            class="approval-observation-detail"
          >
            <div class="approval-section-heading">
              <div>
                <span class="approval-eyebrow">SkillTask</span>
                <h3>运行观测明细</h3>
              </div>
              <span class="approval-section-hint">状态、步骤与重试记录</span>
            </div>
            <Alert
              v-if="managedObservationFlags.unavailable"
              type="warning"
              show-icon
              message="SkillTask 运行观测接口暂未接通"
              description="托管观测只展示状态、当前步骤、尝试次数和更新时间。"
            />
            <Alert
              v-else-if="managedObservationFlags.loadFailed"
              type="error"
              show-icon
              message="SkillTask 运行观测加载失败"
              description="请检查 SkillTask 执行服务与跨服务读取链路后重试。"
            />
            <ManagedObservationGrid table-title="SkillTask 运行观测">
              <template #managed-observation-workflow="{ row }">
                <div class="truncate" :title="row.skillId">
                  {{ workflowName(row.skillId) }}
                </div>
              </template>
              <template #managed-observation-outcome="{ row }">
                <div class="min-w-0 py-1">
                  <div class="truncate font-medium text-foreground">
                    {{ row.businessOutcome?.headline || '业务结果生成中' }}
                  </div>
                  <div class="truncate text-xs text-muted-foreground">
                    {{
                      row.businessOutcome?.summary || '等待业务阶段沉淀结果摘要'
                    }}
                  </div>
                </div>
              </template>
              <template #managed-observation-current-step="{ row }">
                <span class="truncate" :title="row.currentStepCode">
                  {{
                    row.status === 'SUCCEEDED'
                      ? '全部阶段完成'
                      : businessProgressLabel(row)
                  }}
                </span>
              </template>
              <template #managed-observation-status="{ row }">
                <StatusTag
                  v-bind="getMeta(workflowRunStatusMeta, row.status)"
                />
              </template>
              <template #managed-observation-completed="{ row }">
                {{ runCompletionLabel(row) }}
              </template>
              <template #managed-observation-action="{ row }">
                <TableAction
                  :actions="[
                    {
                      label: '详情',
                      onClick: () =>
                        openRunDetail(
                          row.taskId,
                          'managed',
                          workflowName(row.skillId),
                        ),
                      type: 'link',
                    },
                  ]"
                />
              </template>
            </ManagedObservationGrid>
          </section>
        </section>
      </Tabs.TabPane>
    </Tabs>

    <Drawer
      v-model:open="detailOpen"
      :title="detailWorkflowName || detailOutcomeHeadline(detailData)"
      width="760"
    >
      <div class="flex flex-col gap-4">
        <Alert
          v-if="detailError"
          type="error"
          show-icon
          :message="detailError"
        />
        <template v-else-if="detailData">
          <Card size="small" title="业务结果">
            <Space direction="vertical" class="w-full" :size="8">
              <Typography.Title :level="5" class="mb-0">
                {{ detailOutcomeHeadline(detailData) }}
              </Typography.Title>
              <Typography.Paragraph class="mb-0 text-sm text-muted-foreground">
                {{ detailOutcomeSummary(detailData) }}
              </Typography.Paragraph>
              <Space
                v-if="detailData.task.businessOutcome?.metrics?.length"
                wrap
                :size="[8, 8]"
              >
                <StatusTag
                  v-for="metric in detailData.task.businessOutcome?.metrics"
                  :key="`${metric.label}-${metric.value}`"
                  color="processing"
                  :label="`${metric.label}：${metric.value}`"
                />
              </Space>
            </Space>
          </Card>

          <Card size="small" title="业务时间线">
            <div
              v-for="phase in buildBusinessTimeline(detailData)"
              :key="phase.key"
              class="border-b border-border py-3 last:border-b-0"
            >
              <div class="flex items-center justify-between gap-3">
                <Space>
                  <Typography.Text strong>{{ phase.title }}</Typography.Text>
                  <StatusTag
                    v-bind="getMeta(workflowRunStatusMeta, phase.status)"
                  />
                </Space>
                <Typography.Text type="secondary">
                  {{ formatWhen(phase.completedAt || phase.startedAt) }}
                </Typography.Text>
              </div>
              <Typography.Paragraph
                class="mb-0 mt-2 text-sm text-muted-foreground"
              >
                {{ phase.description }}
              </Typography.Paragraph>
            </div>
          </Card>

          <Card size="small" title="审批与责任">
            <Descriptions :column="2" bordered size="small">
              <DescriptionsItem
                v-for="item in buildApprovalResponsibility(detailData)"
                :key="item.label"
                :label="item.label"
              >
                {{ item.value }}
              </DescriptionsItem>
            </Descriptions>
          </Card>

          <Card size="small" title="业务对象">
            <Empty
              v-if="!collectBusinessObjects(detailData).length"
              description="当前尚未沉淀明确业务对象"
            />
            <Descriptions v-else :column="1" bordered size="small">
              <DescriptionsItem
                v-for="(item, index) in collectBusinessObjects(detailData)"
                :key="`${item.objectType}-${item.businessId || item.businessCode || index}`"
                :label="item.label"
              >
                <Space wrap>
                  <StatusTag color="default" :label="item.objectType" />
                  <Typography.Text>
                    {{ item.businessCode || item.businessId || '待生成编号' }}
                  </Typography.Text>
                  <StatusTag
                    v-if="item.status"
                    v-bind="getMeta(workflowRunStatusMeta, item.status)"
                  />
                </Space>
              </DescriptionsItem>
            </Descriptions>
          </Card>

          <Collapse>
            <Collapse.Panel key="evidence" header="技术证据（默认折叠）">
              <Descriptions :column="1" bordered size="small">
                <DescriptionsItem label="任务 ID">
                  {{ detailData.task.taskId }}
                </DescriptionsItem>
                <DescriptionsItem label="运行 ID">
                  {{ detailData.task.runId || '-' }}
                </DescriptionsItem>
                <DescriptionsItem label="输入哈希">
                  {{ detailData.task.inputSha256 }}
                </DescriptionsItem>
                <DescriptionsItem label="定义哈希">
                  {{ detailData.task.definitionSha256 }}
                </DescriptionsItem>
                <DescriptionsItem label="终态哈希">
                  {{ detailData.task.terminalResultSha256 || '-' }}
                </DescriptionsItem>
              </Descriptions>
              <div class="mt-3 space-y-2">
                <div
                  v-for="step in detailData.steps"
                  :key="`${step.taskId}-${step.stepCode}`"
                  class="rounded border border-border px-3 py-2"
                >
                  <div class="flex items-center justify-between gap-3">
                    <Typography.Text strong>
                      {{ step.displayName || step.stepCode }}
                    </Typography.Text>
                    <StatusTag
                      v-bind="getMeta(workflowRunStatusMeta, step.status)"
                    />
                  </div>
                  <Typography.Paragraph
                    class="mb-0 mt-1 text-xs text-muted-foreground"
                  >
                    {{
                      step.resultSummary ||
                      step.resultSha256 ||
                      '暂无额外技术摘要'
                    }}
                  </Typography.Paragraph>
                </div>
              </div>
            </Collapse.Panel>
          </Collapse>
        </template>
        <Empty v-else-if="!detailLoading" description="暂无详情数据" />
      </div>
    </Drawer>

    <Modal
      v-model:open="approvalAssignOpen"
      title="指定本次审批人"
      ok-text="确认指定"
      cancel-text="取消"
      :confirm-loading="approvalAssigning"
      @ok="confirmApprovalAssignment"
    >
      <div class="space-y-3">
        <Typography.Paragraph type="secondary">
          每次审批只授予当前冻结动作；审批员必须与申请人、当前治理员不同。
        </Typography.Paragraph>
        <UserSelect
          v-model:value="approvalAssigneeUserId"
          class="w-full"
          placeholder="选择审批人"
        />
      </div>
    </Modal>

    <Drawer
      v-model:open="workflowDetailOpen"
      title="托管工作流详情"
      width="620"
    >
      <Descriptions v-if="selectedWorkflow" :column="1" bordered size="small">
        <DescriptionsItem label="中文名称">
          {{ selectedWorkflow.displayName }}
        </DescriptionsItem>
        <DescriptionsItem label="用途说明">
          {{ selectedWorkflow.description }}
        </DescriptionsItem>
        <DescriptionsItem label="负责岗位">
          {{ managedWorkflowOwnerRoleLabel(selectedWorkflow.ownerRole) }}
        </DescriptionsItem>
        <DescriptionsItem label="Skill ID">
          <CopyIdCell :value="selectedWorkflow.skillId" label="Skill ID" />
        </DescriptionsItem>
        <DescriptionsItem label="版本">
          {{ selectedWorkflow.skillVersion }}
        </DescriptionsItem>
        <DescriptionsItem label="风险等级">
          {{ selectedWorkflow.riskLevel }}
        </DescriptionsItem>
        <DescriptionsItem label="执行规模">
          {{ selectedWorkflow.stepCount }} 步，其中
          {{ selectedWorkflow.writeStepCount }} 个写操作；最多尝试
          {{ selectedWorkflow.maxAttempts }} 次
        </DescriptionsItem>
        <DescriptionsItem label="审批卡口">
          {{ selectedWorkflow.approvalRequired ? '需要 BPM 审批' : '无需审批' }}
        </DescriptionsItem>
        <DescriptionsItem label="运行架构">
          后台管理系统触发 · DeerFlow 编排 · SkillTask 持久化
        </DescriptionsItem>
        <DescriptionsItem label="定义闭包哈希">
          <CopyIdCell
            :value="selectedWorkflow.definitionClosureSha256"
            label="定义闭包哈希"
          />
        </DescriptionsItem>
      </Descriptions>
    </Drawer>
  </Page>
</template>

<style scoped>
.approval-workspace {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
  padding-bottom: 8px;
}

.approval-hero,
.approval-funnel,
.approval-queue,
.approval-observation-aside,
.approval-observation-detail {
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 16px;
}

.approval-hero {
  display: flex;
  gap: 24px;
  align-items: center;
  justify-content: space-between;
  padding: 28px 32px;
  overflow: hidden;
  background:
    radial-gradient(
      circle at right top,
      hsl(var(--primary) / 14%),
      transparent 35%
    ),
    linear-gradient(
      122deg,
      hsl(var(--card)) 0%,
      hsl(var(--background-deep)) 100%
    );
}

.approval-hero-copy {
  min-width: 0;
}

.approval-hero-crumb,
.approval-eyebrow {
  font-size: 12px;
  font-weight: 600;
  color: hsl(var(--primary));
  letter-spacing: 0.06em;
}

.approval-hero h2,
.approval-section-heading h3,
.approval-queue-heading h3,
.approval-observation-aside h3 {
  margin: 6px 0 0;
  font-size: 22px;
  font-weight: 650;
  line-height: 1.3;
  color: hsl(var(--foreground));
}

.approval-hero p,
.approval-observation-aside > div > p {
  max-width: 620px;
  margin: 8px 0 16px;
  line-height: 1.75;
  color: hsl(var(--muted-foreground));
}

.approval-focus-metric {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  min-width: 184px;
  padding: 4px 0 4px 24px;
  border-left: 1px solid hsl(var(--border));
}

.approval-focus-metric span,
.approval-focus-metric small,
.approval-section-hint,
.approval-metric span,
.approval-card-role,
.approval-card-footer,
.approval-card-decision span,
.approval-safety-rule span {
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.approval-focus-metric strong {
  font-size: 42px;
  font-weight: 650;
  line-height: 1.15;
  color: hsl(var(--primary));
}

.approval-gate-note {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  align-items: center;
  padding: 11px 14px;
  font-size: 13px;
  color: hsl(var(--foreground));
  background: hsl(var(--primary) / 6%);
  border: 1px solid hsl(var(--primary) / 26%);
  border-radius: 12px;
}

.approval-gate-note-muted {
  color: hsl(var(--muted-foreground));
}

.approval-funnel,
.approval-queue,
.approval-observation-aside,
.approval-observation-detail {
  padding: 20px;
}

.approval-section-heading,
.approval-queue-heading {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
}

.approval-section-heading h3,
.approval-queue-heading h3,
.approval-observation-aside h3 {
  font-size: 18px;
}

.approval-metric-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
  margin-top: 18px;
}

.approval-metric {
  min-width: 0;
  padding: 14px;
  background: hsl(var(--background-deep) / 45%);
  border: 1px solid hsl(var(--border));
  border-radius: 12px;
}

.approval-metric.is-primary {
  background: hsl(var(--primary) / 8%);
  border-color: hsl(var(--primary) / 26%);
}

.approval-metric span {
  display: block;
  min-height: 34px;
  line-height: 1.45;
}

.approval-metric strong {
  display: block;
  margin-top: 6px;
  font-size: 25px;
  font-weight: 650;
  line-height: 1;
  color: hsl(var(--foreground));
}

.approval-metric.is-primary strong {
  color: hsl(var(--primary));
}

.approval-workbench {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 340px);
  gap: 16px;
  align-items: start;
}

.approval-filter {
  width: 150px;
}

.approval-empty-state {
  padding: 42px 0;
}

.approval-card-list {
  display: grid;
  gap: 12px;
  margin-top: 18px;
}

.approval-card {
  padding: 16px;
  background: hsl(var(--background-deep) / 35%);
  border: 1px solid hsl(var(--border));
  border-radius: 12px;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.approval-card:hover {
  border-color: hsl(var(--primary) / 38%);
  box-shadow: 0 10px 28px hsl(var(--foreground) / 6%);
}

.approval-card-topline,
.approval-card-footer {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.approval-card h4 {
  margin: 10px 0 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.45;
  color: hsl(var(--foreground));
}

.approval-card-workflow {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: hsl(var(--muted-foreground));
}

.approval-card-decision {
  display: grid;
  gap: 9px;
  padding: 12px;
  margin-top: 12px;
  background: hsl(var(--muted) / 58%);
  border-radius: 10px;
}

.approval-card-decision span {
  font-weight: 600;
  color: hsl(var(--foreground));
}

.approval-card-decision p {
  margin: 3px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: hsl(var(--muted-foreground));
}

.approval-card-summary {
  margin: 12px 0 !important;
  font-size: 13px;
  line-height: 1.65;
  color: hsl(var(--muted-foreground));
}

.approval-card-footer {
  padding-top: 12px;
  border-top: 1px solid hsl(var(--border));
}

.approval-observation-aside {
  display: flex;
  flex-direction: column;
  gap: 18px;
  background:
    linear-gradient(180deg, hsl(var(--primary) / 8%), transparent 42%),
    hsl(var(--card));
}

.approval-observation-aside > div > p {
  margin-bottom: 0;
  font-size: 13px;
}

.approval-observation-status {
  display: flex;
  gap: 10px;
  padding: 13px;
  background: hsl(var(--success) / 8%);
  border: 1px solid hsl(var(--success) / 24%);
  border-radius: 12px;
}

.approval-observation-status.is-unavailable {
  background: hsl(var(--warning) / 9%);
  border-color: hsl(var(--warning) / 34%);
}

.approval-observation-dot {
  flex: 0 0 auto;
  width: 8px;
  height: 8px;
  margin-top: 6px;
  background: hsl(var(--success));
  border-radius: 50%;
  box-shadow: 0 0 0 4px hsl(var(--success) / 12%);
}

.approval-observation-status.is-unavailable .approval-observation-dot {
  background: hsl(var(--warning));
  box-shadow: 0 0 0 4px hsl(var(--warning) / 12%);
}

.approval-observation-status strong {
  font-size: 13px;
  color: hsl(var(--foreground));
}

.approval-observation-status p,
.approval-safety-rule p {
  margin: 3px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: hsl(var(--muted-foreground));
}

.approval-safety-rule {
  padding: 14px;
  background: hsl(var(--muted) / 58%);
  border-radius: 12px;
}

.approval-safety-rule span {
  font-weight: 600;
  color: hsl(var(--foreground));
}

.approval-observation-detail {
  scroll-margin-top: 20px;
}

.approval-observation-detail :deep(.vben-vxe-grid) {
  margin-top: 16px;
}

@media (max-width: 1440px) {
  .approval-metric-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 1024px) {
  .approval-workbench {
    grid-template-columns: 1fr;
  }

  .approval-observation-aside {
    min-height: auto;
  }
}

@media (max-width: 768px) {
  .approval-hero {
    flex-direction: column;
    align-items: flex-start;
    padding: 22px;
  }

  .approval-focus-metric {
    align-items: flex-start;
    padding: 16px 0 0;
    border-top: 1px solid hsl(var(--border));
    border-left: 0;
  }

  .approval-section-heading,
  .approval-queue-heading,
  .approval-card-footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .approval-metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .approval-filter {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .approval-funnel,
  .approval-queue,
  .approval-observation-aside,
  .approval-observation-detail {
    padding: 16px;
  }

  .approval-metric-grid {
    grid-template-columns: 1fr;
  }
}
</style>
