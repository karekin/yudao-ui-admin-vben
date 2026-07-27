<script lang="ts" setup>
import type { CloudMoldAiOperationsApi } from '#/api/cloudmold/ai-operations';

import { computed, ref, watch } from 'vue';

import { formatDateTime } from '@vben/utils';

import {
  Alert,
  Collapse,
  CollapsePanel,
  Descriptions,
  DescriptionsItem,
  Drawer,
  Result,
  Spin,
  Table,
  Tag,
  Timeline,
  TimelineItem,
} from 'ant-design-vue';

import {
  getCloudMoldAiWorkflowRunDetail,
  getCloudMoldManagedRunDetail,
} from '#/api/cloudmold/ai-operations';

import CopyIdCell from '../shared/copy-id-cell.vue';
import { cloudMoldEnumLabel } from '../shared/status-meta';
import StatusTag from '../shared/status-tag.vue';
import {
  aiOperationsConsoleNotice,
  feedbackOutcomeMeta,
  invocationOutcomeMeta,
  workflowRunStatusMeta,
} from './data';

import '../shared/detail-layout.css';

defineOptions({ name: 'CloudMoldAiWorkflowRunDetailDrawer' });

const props = defineProps<{
  open: boolean;
  runId: null | string;
  source: CloudMoldAiOperationsApi.RunSource;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
}>();

const detail = ref<
  | CloudMoldAiOperationsApi.ManagedRunDetail
  | CloudMoldAiOperationsApi.WorkflowRunDetail
  | null
>(null);
const loading = ref(false);
const loadFailed = ref(false);

const openProxy = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
});

function dash(value: null | number | string | undefined) {
  return value === undefined || value === null || value === '' ? '-' : value;
}

function formatNumber(value: null | number | string | undefined) {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  return String(value);
}

function formatMoney(
  amountMinor: null | number | string | undefined,
  currencyCode: null | string | undefined,
) {
  if (amountMinor === undefined || amountMinor === null || amountMinor === '') {
    return '-';
  }
  const normalized = Number(amountMinor) / 100;
  if (Number.isNaN(normalized)) {
    return `${amountMinor}`;
  }
  return `${normalized.toFixed(2)} ${dash(currencyCode)}`;
}

type StatusMeta = Record<string, { color: string; label: string }>;

function meta(status: null | string | undefined, dictionary: StatusMeta) {
  if (!status) {
    return { color: 'default', label: '-' };
  }
  return (
    dictionary[status] ?? {
      color: 'default',
      label: cloudMoldEnumLabel(status),
    }
  );
}

function detailValue<T = number | string>(
  ...keys: string[]
): null | T | undefined {
  const value = detail.value as null | Record<string, unknown>;
  if (!value) {
    return undefined;
  }
  const sources = [
    value,
    value.task,
    value.run,
    value.application,
    value.workflow,
  ].filter(
    (source): source is Record<string, unknown> =>
      typeof source === 'object' && source !== null,
  );
  for (const source of sources) {
    for (const key of keys) {
      const current = source[key];
      if (current !== undefined && current !== null && current !== '') {
        return current as T;
      }
    }
  }
  return undefined;
}

function detailArray<T>(...keys: string[]): T[] {
  const value = detail.value as null | Record<string, unknown>;
  if (!value) {
    return [];
  }
  for (const key of keys) {
    const current = value[key];
    if (Array.isArray(current)) {
      return current as T[];
    }
  }
  return [];
}

const orchestrationSurfaceLabel = computed(() => {
  if (props.source === 'managed') {
    return 'DEER_FLOW';
  }
  return dash(detailValue('workflowEngine', 'orchestrationSurface'));
});

const runLabel = computed(() =>
  props.source === 'managed' ? '托管任务详情' : 'AI 运行详情',
);

const invocations = computed(() =>
  detailArray<CloudMoldAiOperationsApi.RunObservation>(
    'invocations',
    'invocationAttempts',
  ),
);
const feedbacks = computed(() =>
  detailArray<CloudMoldAiOperationsApi.OutcomeFeedback>(
    'feedbacks',
    'feedbackArtifacts',
    'outcomeFeedbacks',
  ),
);
const steps = computed(() =>
  detailArray<CloudMoldAiOperationsApi.ManagedRunStep>('steps'),
);
const businessOutcome = computed(() => {
  if (props.source !== 'managed') {
    return undefined;
  }
  return (detail.value as CloudMoldAiOperationsApi.ManagedRunDetail | null)
    ?.task?.businessOutcome;
});
const businessObjects = computed(
  () => businessOutcome.value?.businessObjects ?? [],
);
const businessPhases = computed(() => {
  if (props.source !== 'managed') {
    return [];
  }
  return (
    (detail.value as CloudMoldAiOperationsApi.ManagedRunDetail | null)
      ?.businessPhases ?? []
  );
});
const statusHistory = computed(() =>
  detailArray<CloudMoldAiOperationsApi.StatusHistory>('statusHistory'),
);

const invocationColumns = [
  { dataIndex: 'attemptId', key: 'attemptId', title: '调用 ID' },
  { dataIndex: 'stepRef', key: 'stepRef', title: '步骤' },
  { dataIndex: 'providerCode', key: 'providerCode', title: '供应方' },
  { dataIndex: 'modelCode', key: 'modelCode', title: '模型' },
  { dataIndex: 'outcome', key: 'outcome', title: '结果' },
  { dataIndex: 'totalTokens', key: 'totalTokens', title: '总 Tokens' },
  { dataIndex: 'latencyMillis', key: 'latencyMillis', title: '耗时 ms' },
  { dataIndex: 'costAmountMinor', key: 'costAmountMinor', title: '成本' },
  { dataIndex: 'occurredAt', key: 'occurredAt', title: '发生时间' },
];

const feedbackColumns = [
  { dataIndex: 'feedbackId', key: 'feedbackId', title: '反馈 ID' },
  { dataIndex: 'feedbackType', key: 'feedbackType', title: '反馈类型' },
  { dataIndex: 'outcomeCode', key: 'outcomeCode', title: '结果' },
  { dataIndex: 'evaluatorType', key: 'evaluatorType', title: '评估方' },
  { dataIndex: 'evidenceRef', key: 'evidenceRef', title: '证据引用' },
  { dataIndex: 'occurredAt', key: 'occurredAt', title: '发生时间' },
];

const historyColumns = [
  { dataIndex: 'occurredAt', key: 'occurredAt', title: '发生时间' },
  { dataIndex: 'operationType', key: 'operationType', title: '状态动作' },
  { dataIndex: 'previousStatus', key: 'previousStatus', title: '前状态' },
  { dataIndex: 'currentStatus', key: 'currentStatus', title: '后状态' },
  { dataIndex: 'aggregateVersion', key: 'aggregateVersion', title: '版本' },
  { dataIndex: 'errorCode', key: 'errorCode', title: '错误码' },
];

const stepColumns = [
  { dataIndex: 'stepOrder', key: 'stepOrder', title: '序号' },
  { dataIndex: 'displayName', key: 'displayName', title: '业务步骤' },
  { dataIndex: 'status', key: 'status', title: '状态' },
  { dataIndex: 'resultSummary', key: 'resultSummary', title: '业务结果' },
  { dataIndex: 'attemptCount', key: 'attemptCount', title: '尝试次数' },
  { dataIndex: 'resultSha256', key: 'resultSha256', title: '审计证据' },
  { dataIndex: 'lastErrorCode', key: 'lastErrorCode', title: '错误码' },
  { dataIndex: 'completedAt', key: 'completedAt', title: '完成时间' },
];

const businessObjectColumns = [
  { dataIndex: 'label', key: 'label', title: '业务对象' },
  { dataIndex: 'businessCode', key: 'businessCode', title: '业务编码' },
  { dataIndex: 'businessId', key: 'businessId', title: '业务 ID' },
  { dataIndex: 'status', key: 'status', title: '终态' },
];

function timelineColor(status: string) {
  if (status === 'SUCCEEDED' || status === 'COMPLETED') {
    return 'green';
  }
  if (status === 'FAILED' || status === 'REJECTED') {
    return 'red';
  }
  if (
    status === 'NEEDS_REVIEW' ||
    status === 'WAITING_APPROVAL' ||
    status === 'WAITING'
  ) {
    return 'orange';
  }
  if (status === 'RUNNING') {
    return 'blue';
  }
  return 'gray';
}

function approvalLabel(status: string) {
  const labels: Record<string, string> = {
    APPROVED: '审批已放行',
    NEEDS_REVIEW: '需要人工复核',
    NOT_REQUIRED: '无需审批',
    REQUIRED: '待创建审批',
    WAITING_APPROVAL: '等待 BPM 审批',
  };
  return labels[status] ?? cloudMoldEnumLabel(status);
}

function operationLabel(operationType: null | string | undefined) {
  const labels: Record<string, string> = {
    ORCHESTRATE: '编排子流程',
    READ: '读取业务系统',
    WRITE: '写入业务系统',
  };
  return operationType
    ? (labels[operationType] ?? cloudMoldEnumLabel(operationType))
    : '-';
}

async function load() {
  if (!props.runId) {
    return;
  }
  loading.value = true;
  loadFailed.value = false;
  detail.value = null;
  try {
    detail.value =
      props.source === 'managed'
        ? await getCloudMoldManagedRunDetail(props.runId)
        : await getCloudMoldAiWorkflowRunDetail(props.runId);
  } catch {
    loadFailed.value = true;
  } finally {
    loading.value = false;
  }
}

watch(
  () => [props.open, props.runId, props.source] as const,
  ([isOpen]) => {
    if (isOpen) {
      load();
    }
  },
  { immediate: true },
);
</script>

<template>
  <Drawer
    v-model:open="openProxy"
    class="cloudmold-detail-drawer"
    :title="runLabel"
    placement="right"
    width="min(1120px, calc(100vw - 24px))"
    :destroy-on-close="true"
  >
    <Spin :spinning="loading">
      <Result
        v-if="loadFailed"
        status="error"
        title="详情加载失败"
        sub-title="请检查后端服务、权限和当前运行来源后重试。"
      />
      <Result
        v-else-if="!loading && !detail"
        status="info"
        title="未找到运行"
        sub-title="该运行不存在，或当前账号没有查看权限。"
      />
      <template v-else-if="detail">
        <Alert
          class="mb-4"
          type="info"
          show-icon
          :message="aiOperationsConsoleNotice"
          description="本抽屉只展示脱敏后的工作流元数据、观测证据和审批门禁状态，不呈现原始提示词、票据或技术负载。"
        />

        <template v-if="businessOutcome">
          <Alert
            class="mb-4"
            type="success"
            show-icon
            :message="businessOutcome.headline"
            :description="businessOutcome.summary"
          />
          <Descriptions
            v-if="businessOutcome.metrics.length"
            title="业务结果"
            :column="4"
            bordered
            size="small"
            class="mb-4"
          >
            <DescriptionsItem
              v-for="metric in businessOutcome.metrics"
              :key="metric.label"
              :label="metric.label"
            >
              {{ metric.value }}
            </DescriptionsItem>
          </Descriptions>
          <template v-if="businessObjects.length">
            <div class="mb-2 mt-4 font-medium">产出的业务对象</div>
            <Table
              :columns="businessObjectColumns"
              :data-source="businessObjects"
              :pagination="false"
              :row-key="
                (record) =>
                  record.businessId || record.businessCode || record.label
              "
              size="small"
              class="mb-4"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'businessId'">
                  <CopyIdCell :value="record.businessId" label="业务 ID" />
                </template>
                <template v-else-if="column.dataIndex === 'status'">
                  {{ cloudMoldEnumLabel(record.status) }}
                </template>
              </template>
            </Table>
          </template>
        </template>

        <template v-if="businessPhases.length">
          <div class="mb-3 mt-4 text-base font-medium">业务阶段与实际动作</div>
          <Timeline class="business-timeline">
            <TimelineItem
              v-for="phase in businessPhases"
              :key="`${phase.phaseOrder}-${phase.phaseCode}`"
              :color="timelineColor(phase.status)"
            >
              <div
                class="business-phase"
                :style="{ marginLeft: `${Math.max(0, phase.depth) * 16}px` }"
              >
                <div class="business-phase__header">
                  <span class="business-phase__index">
                    {{ phase.phaseOrder }}
                  </span>
                  <span class="font-medium">{{ phase.displayName }}</span>
                  <StatusTag
                    v-bind="meta(phase.status, workflowRunStatusMeta)"
                  />
                  <Tag
                    :color="
                      phase.approvalStatus === 'APPROVED'
                        ? 'green'
                        : phase.approvalStatus === 'NOT_REQUIRED'
                          ? 'default'
                          : 'orange'
                    "
                  >
                    {{ approvalLabel(phase.approvalStatus) }}
                  </Tag>
                </div>
                <div class="business-phase__description">
                  {{ phase.description }}
                </div>
                <div
                  v-if="phase.businessOutcome?.summary"
                  class="business-phase__outcome"
                >
                  {{ phase.businessOutcome.summary }}
                </div>
                <div v-if="phase.actions.length" class="business-actions">
                  <div
                    v-for="action in phase.actions"
                    :key="`${action.taskId}-${action.stepCode}`"
                    class="business-action"
                  >
                    <div class="business-action__header">
                      <span class="business-action__order">
                        {{ action.actionOrder }}
                      </span>
                      <span class="font-medium">{{ action.displayName }}</span>
                      <StatusTag
                        v-bind="meta(action.status, workflowRunStatusMeta)"
                      />
                    </div>
                    <div class="business-action__result">
                      {{ action.resultSummary }}
                    </div>
                    <div
                      v-if="action.businessObjects.length"
                      class="business-action__objects"
                    >
                      <Tag
                        v-for="object in action.businessObjects"
                        :key="`${object.objectType}-${object.businessId || object.businessCode}`"
                        color="blue"
                      >
                        {{ object.label }}：
                        {{ object.businessCode || object.businessId }}
                        <template v-if="object.status">
                          · {{ cloudMoldEnumLabel(object.status) }}
                        </template>
                      </Tag>
                    </div>
                    <div class="business-action__meta">
                      <span>{{ operationLabel(action.operationType) }}</span>
                      <span v-if="action.completedAt">
                        {{ formatDateTime(action.completedAt) }}
                      </span>
                      <span v-if="action.errorCode">
                        {{ action.errorCode }}
                      </span>
                    </div>
                  </div>
                </div>
                <Alert
                  v-else
                  class="mt-3"
                  type="info"
                  show-icon
                  message="该阶段尚未产生实际动作"
                  description="前序阶段尚未完成、审批尚未放行，或该子工作流尚未创建；这里不会用计划动作冒充已执行结果。"
                />
              </div>
            </TimelineItem>
          </Timeline>
        </template>

        <Descriptions
          title="运行总览"
          :column="2"
          bordered
          size="small"
          class="mb-4"
        >
          <DescriptionsItem label="任务 ID">
            <CopyIdCell :value="detailValue('taskId')" label="任务 ID" />
          </DescriptionsItem>
          <DescriptionsItem label="运行 ID">
            <CopyIdCell :value="detailValue('runId')" label="运行 ID" />
          </DescriptionsItem>
          <DescriptionsItem label="任务名称">
            {{ dash(detailValue('taskName', 'workflowName')) }}
          </DescriptionsItem>
          <DescriptionsItem label="运行状态">
            <StatusTag
              v-bind="
                meta(String(detailValue('status') ?? ''), workflowRunStatusMeta)
              "
            />
          </DescriptionsItem>
          <DescriptionsItem label="业务键">
            {{ dash(detailValue('runKey')) }}
          </DescriptionsItem>
          <DescriptionsItem label="触发类型">
            {{ cloudMoldEnumLabel(detailValue('triggerType')) }}
          </DescriptionsItem>
          <DescriptionsItem label="业务引用">
            {{ dash(detailValue('businessRef')) }}
          </DescriptionsItem>
          <DescriptionsItem label="错误码">
            {{ dash(detailValue('errorCode')) }}
          </DescriptionsItem>
          <DescriptionsItem label="开始时间">
            {{ formatDateTime(detailValue('startedAt') as string) }}
          </DescriptionsItem>
          <DescriptionsItem label="结束时间">
            {{
              detailValue('finishedAt', 'completedAt')
                ? formatDateTime(
                    detailValue('finishedAt', 'completedAt') as string,
                  )
                : '-'
            }}
          </DescriptionsItem>
          <DescriptionsItem label="审计证据哈希">
            <CopyIdCell
              :value="detailValue('terminalResultSha256')"
              label="审计证据哈希"
            />
          </DescriptionsItem>
        </Descriptions>

        <Descriptions
          title="工作流元数据"
          :column="2"
          bordered
          size="small"
          class="mb-4"
        >
          <DescriptionsItem label="应用 ID">
            <CopyIdCell :value="detailValue('applicationId')" label="应用 ID" />
          </DescriptionsItem>
          <DescriptionsItem label="工作流 ID">
            <CopyIdCell :value="detailValue('workflowId')" label="工作流 ID" />
          </DescriptionsItem>
          <DescriptionsItem label="编排引擎">
            {{ orchestrationSurfaceLabel }}
          </DescriptionsItem>
          <DescriptionsItem label="工作流引用">
            {{ dash(detailValue('definitionRef', 'workflowRef')) }}
          </DescriptionsItem>
          <DescriptionsItem label="Skill ID">
            {{ dash(detailValue('skillId')) }}
          </DescriptionsItem>
          <DescriptionsItem label="Skill 版本">
            {{ dash(detailValue('skillVersion', 'workflowVersion')) }}
          </DescriptionsItem>
          <DescriptionsItem label="期望调用数">
            {{ formatNumber(detailValue('expectedInvocationCount')) }}
          </DescriptionsItem>
          <DescriptionsItem label="聚合版本">
            {{ formatNumber(detailValue('aggregateVersion', 'version')) }}
          </DescriptionsItem>
          <DescriptionsItem label="更新时间">
            {{
              detailValue('updatedAt')
                ? formatDateTime(detailValue('updatedAt') as string)
                : '-'
            }}
          </DescriptionsItem>
          <DescriptionsItem label="创建时间">
            {{
              detailValue('createdAt')
                ? formatDateTime(detailValue('createdAt') as string)
                : '-'
            }}
          </DescriptionsItem>
        </Descriptions>

        <Collapse class="mt-4" :bordered="false">
          <CollapsePanel
            key="technical-evidence"
            header="技术执行证据（父任务步骤、模型调用、反馈与状态历史）"
          >
            <template v-if="steps.length">
              <div class="mb-2 font-medium">父任务技术步骤</div>
              <Table
                :columns="stepColumns"
                :data-source="steps"
                :pagination="false"
                row-key="stepCode"
                size="small"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.dataIndex === 'status'">
                    <StatusTag
                      v-bind="meta(record.status, workflowRunStatusMeta)"
                    />
                  </template>
                  <template v-else-if="column.dataIndex === 'resultSha256'">
                    <CopyIdCell :value="record.resultSha256" label="审计证据" />
                  </template>
                  <template v-else-if="column.dataIndex === 'completedAt'">
                    {{
                      record.completedAt
                        ? formatDateTime(record.completedAt)
                        : '-'
                    }}
                  </template>
                </template>
              </Table>
            </template>

            <div class="mb-2 mt-4 font-medium">模型调用与观测</div>
            <Table
              :columns="invocationColumns"
              :data-source="invocations"
              :pagination="false"
              row-key="attemptId"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'attemptId'">
                  <CopyIdCell :value="record.attemptId" label="调用 ID" />
                </template>
                <template v-else-if="column.dataIndex === 'outcome'">
                  <StatusTag
                    v-bind="meta(record.outcome, invocationOutcomeMeta)"
                  />
                </template>
                <template v-else-if="column.dataIndex === 'occurredAt'">
                  {{ formatDateTime(record.occurredAt) }}
                </template>
                <template v-else-if="column.dataIndex === 'costAmountMinor'">
                  {{ formatMoney(record.costAmountMinor, record.currencyCode) }}
                </template>
              </template>
            </Table>

            <div class="mb-2 mt-4 font-medium">反馈产物与证据</div>
            <Table
              :columns="feedbackColumns"
              :data-source="feedbacks"
              :pagination="false"
              :row-key="
                (record) =>
                  record.feedbackId || record.evidenceRef || 'feedback'
              "
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'feedbackId'">
                  <CopyIdCell :value="record.feedbackId" label="反馈 ID" />
                </template>
                <template v-else-if="column.dataIndex === 'outcomeCode'">
                  <StatusTag
                    v-bind="meta(record.outcomeCode, feedbackOutcomeMeta)"
                  />
                </template>
                <template v-else-if="column.dataIndex === 'evidenceRef'">
                  <CopyIdCell :value="record.evidenceRef" label="证据引用" />
                </template>
                <template v-else-if="column.dataIndex === 'occurredAt'">
                  {{ formatDateTime(record.occurredAt) }}
                </template>
              </template>
            </Table>

            <div class="mb-2 mt-4 font-medium">状态历史</div>
            <Table
              :columns="historyColumns"
              :data-source="statusHistory"
              :pagination="false"
              :row-key="
                (record) =>
                  record.historyId ||
                  `${record.operationType}-${record.occurredAt}`
              "
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.dataIndex === 'previousStatus'">
                  {{
                    record.previousStatus
                      ? cloudMoldEnumLabel(record.previousStatus)
                      : '-'
                  }}
                </template>
                <template v-else-if="column.dataIndex === 'currentStatus'">
                  <StatusTag
                    v-bind="meta(record.currentStatus, workflowRunStatusMeta)"
                  />
                </template>
                <template v-else-if="column.dataIndex === 'occurredAt'">
                  {{ formatDateTime(record.occurredAt) }}
                </template>
                <template v-else-if="column.dataIndex === 'operationType'">
                  {{ cloudMoldEnumLabel(record.operationType) }}
                </template>
              </template>
            </Table>
          </CollapsePanel>
        </Collapse>

        <Alert
          class="mt-4"
          type="info"
          show-icon
          message="审批门禁由 Agent Control 展示"
          description="请在“观测与审批”标签查看 BPM 卡片。详情接口不跨域拼接审批状态，避免把遥测或 SkillTask 记录误当作放行权威。"
        />
      </template>
    </Spin>
  </Drawer>
</template>

<style scoped>
.business-phase {
  padding: 14px 16px;
  border: 1px solid var(--ant-color-border-secondary, #f0f0f0);
  border-radius: 8px;
}

.business-phase__header,
.business-action__header {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.business-phase__index,
.business-action__order {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  font-size: 12px;
  color: #1677ff;
  background: #e6f4ff;
  border-radius: 999px;
}

.business-phase__description {
  margin-top: 8px;
  color: #667085;
}

.business-phase__outcome {
  padding: 8px 10px;
  margin-top: 10px;
  color: #3f6600;
  background: #f6ffed;
  border-radius: 6px;
}

.business-actions {
  display: grid;
  gap: 10px;
  margin-top: 12px;
}

.business-action {
  padding: 10px 12px;
  background: #fafafa;
  border-left: 3px solid #91caff;
  border-radius: 4px;
}

.business-action__result {
  margin: 6px 0;
  color: #344054;
}

.business-action__objects {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.business-action__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 6px;
  font-size: 12px;
  color: #98a2b3;
}
</style>
