<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { CloudMoldInventoryApi } from '#/api/cloudmold/inventory';
import type { CloudMoldQualityApi } from '#/api/cloudmold/quality';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Form,
  FormItem,
  Input,
  message,
  Modal,
  Progress,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
} from 'ant-design-vue';

import { getCloudMoldAfterSalePage } from '#/api/cloudmold/commerce';
import { getCloudMoldInventoryBalancePage } from '#/api/cloudmold/inventory';
import {
  executeQualityCommand,
  getQualityWorkItemPage,
} from '#/api/cloudmold/quality';

import {
  getWorkbenchMeta,
  matchesWorkbenchItem,
  qualityItemMeta,
  shortReference,
  statusMeta,
} from '../shared/operations-workbench';

defineOptions({ name: 'CloudMoldQualityControlCenter' });

interface QualityCommandForm {
  aggregateId?: string;
  applicableSkuId?: string;
  adjudicatorPrincipalId?: string;
  authenticatorPrincipalId?: string;
  brandCode?: string;
  canonicalSkuId?: string;
  categoryCode?: string;
  certificationLevel?: string;
  contentSha256?: string;
  decision?: string;
  defectCode?: string;
  dueDate?: Dayjs;
  effectiveFrom?: Dayjs;
  effectiveTo?: Dayjs;
  effectivenessEvidenceRef?: string;
  evidenceRef?: string;
  evidenceSha256?: string;
  expectedVersion?: number;
  inspectionTaskId?: string;
  lotId?: string;
  ownerPrincipalId?: string;
  principalId?: string;
  priority?: string;
  reasonCode?: string;
  resolutionCode?: string;
  rootCauseCode?: string;
  secondaryAuthenticatorPrincipalId?: string;
  standardCode?: string;
  standardId?: string;
  subjectRef?: string;
  subjectType?: string;
  warehouseId?: string;
}

const router = useRouter();
const simpleEmptyImage = Empty.PRESENTED_IMAGE_SIMPLE;
const loading = ref(false);
const loadError = ref('');
const qualityInventory = ref<CloudMoldInventoryApi.Balance[]>([]);
const pendingTotal = ref(0);
const damagedTotal = ref(0);
const rejectedTotal = ref(0);
const afterSaleTotal = ref(0);
const workItems = ref<CloudMoldQualityApi.WorkItem[]>([]);
const workItemTotal = ref(0);
const commandOpen = ref(false);
const commandSaving = ref(false);
const commandMode = ref('CREATE_STANDARD');
const commandForm = ref<QualityCommandForm>({});
const queueFilter = ref('INSPECTION');
const queueKeyword = ref('');

const qualityRows = computed(() =>
  qualityInventory.value
    .map((item) => ({
      ...item,
      quantity: Number(item.onHandQuantity ?? 0),
    }))
    .sort((left, right) =>
      left.qualityStatus.localeCompare(right.qualityStatus),
    ),
);

const inspectionTasks = computed(() =>
  workItems.value.filter((item) => item.itemType === 'INSPECTION_TASK'),
);
const activeInspectionCount = computed(
  () =>
    inspectionTasks.value.filter((item) =>
      [
        'ASSIGNED',
        'CONFLICTED',
        'CREATED',
        'DECIDED',
        'IN_PROGRESS',
        'RECHECK_REQUIRED',
      ].includes(item.status),
    ).length,
);
const recheckCount = computed(
  () =>
    inspectionTasks.value.filter((item) =>
      ['CONFLICTED', 'DECIDED', 'RECHECK_REQUIRED'].includes(item.status),
    ).length,
);
const qualityActionCount = computed(
  () =>
    workItems.value.filter(
      (item) =>
        ['CAPA', 'RECALL_ACTION'].includes(item.itemType) &&
        !['RESOLVED', 'VERIFIED'].includes(item.status),
    ).length,
);
const completedInspectionCount = computed(
  () =>
    inspectionTasks.value.filter((item) => item.status === 'COMPLETED').length,
);
const completionRate = computed(() =>
  inspectionTasks.value.length > 0
    ? Math.round(
        (completedInspectionCount.value / inspectionTasks.value.length) * 100,
      )
    : 0,
);
const filteredWorkItems = computed(() =>
  workItems.value.filter((item) => {
    const matchesGroup =
      queueFilter.value === 'ALL' ||
      (queueFilter.value === 'INSPECTION' &&
        item.itemType === 'INSPECTION_TASK') ||
      (queueFilter.value === 'ACTION' &&
        ['CAPA', 'RECALL_ACTION'].includes(item.itemType)) ||
      (queueFilter.value === 'GOVERNANCE' &&
        ['CERTIFICATION', 'STANDARD'].includes(item.itemType));
    return matchesGroup && matchesWorkbenchItem(item, queueKeyword.value);
  }),
);
const lastUpdatedAt = computed(() => {
  const timestamps = [
    ...workItems.value.map((item) => item.updatedAt),
    ...qualityInventory.value.map((item) => item.updatedAt),
  ].filter(Boolean);
  if (timestamps.length === 0) return '尚未同步';
  return new Date(
    Math.max(...timestamps.map((value) => new Date(value).getTime())),
  ).toLocaleString('zh-CN', { hour12: false });
});

const columns = [
  { key: 'inventory', title: '库存对象', width: 260 },
  { key: 'location', title: '仓库 / 库位', width: 220 },
  { dataIndex: 'qualityStatus', key: 'qualityStatus', title: '质量状态' },
  { key: 'quantity', title: '数量', width: 150 },
  { dataIndex: 'updatedAt', key: 'updatedAt', title: '最近更新', width: 180 },
  { key: 'action', title: '操作', width: 120 },
];

const workItemColumns = [
  { key: 'overview', title: '质量事项', width: 300 },
  { key: 'relatedRef', title: '关联对象', width: 220 },
  { key: 'status', title: '当前状态', width: 120 },
  { key: 'dueDate', title: '时效', width: 130 },
  { key: 'action', title: '下一步', width: 300 },
];

const queueOptions = [
  { label: '质检任务', value: 'INSPECTION' },
  { label: 'CAPA 与召回', value: 'ACTION' },
  { label: '标准与资质', value: 'GOVERNANCE' },
  { label: '全部事项', value: 'ALL' },
];

const commandTitles: Record<string, string> = {
  ACKNOWLEDGE_RECALL_ACTION: '认领召回行动',
  ADJUDICATE_INSPECTION_TASK: '第三方质检裁决',
  ASSIGN_INSPECTION_TASK: '分派质检任务',
  ASSIGN_RECHECK_REVIEWER: '分派独立复检',
  CERTIFY_AUTHENTICATOR: '认证鉴别师',
  COMPLETE_INSPECTION_TASK: '完成质检任务',
  CREATE_INSPECTION_TASK: '创建质检任务',
  CREATE_STANDARD: '新建鉴别标准',
  DECIDE_INSPECTION_TASK: '提交质检判定',
  OPEN_CAPA: '发起整改措施',
  OPEN_RECALL_ACTION: '发起批次召回',
  PUBLISH_STANDARD: '发布鉴别标准',
  REQUEST_RECHECK: '申请独立复检',
  RESOLVE_CAPA: '验证并关闭 CAPA',
  RESOLVE_RECALL_ACTION: '完成召回行动',
  REVOKE_AUTHENTICATOR: '撤销鉴别师资质',
  START_INSPECTION_TASK: '开始质检',
  SUBMIT_RECHECK_DECISION: '提交复检判定',
};

async function loadData() {
  loading.value = true;
  loadError.value = '';
  try {
    const [pending, damaged, rejected, afterSalePage, workItemPage] =
      await Promise.all([
        getCloudMoldInventoryBalancePage({
          pageNo: 1,
          pageSize: 50,
          qualityStatus: 'PENDING_QC',
        }),
        getCloudMoldInventoryBalancePage({
          pageNo: 1,
          pageSize: 50,
          qualityStatus: 'DAMAGED',
        }),
        getCloudMoldInventoryBalancePage({
          pageNo: 1,
          pageSize: 50,
          qualityStatus: 'REJECTED',
        }),
        getCloudMoldAfterSalePage({ pageNo: 1, pageSize: 50 }),
        getQualityWorkItemPage({ pageNo: 1, pageSize: 100 }),
      ]);
    pendingTotal.value = pending.total;
    damagedTotal.value = damaged.total;
    rejectedTotal.value = rejected.total;
    afterSaleTotal.value = afterSalePage.total;
    qualityInventory.value = [
      ...pending.list,
      ...damaged.list,
      ...rejected.list,
    ];
    workItems.value = workItemPage.list;
    workItemTotal.value = workItemPage.total;
  } catch (error) {
    loadError.value =
      error instanceof Error ? error.message : '鉴别质检数据加载失败';
  } finally {
    loading.value = false;
  }
}

function openCommand(mode: string, row?: Record<string, unknown>) {
  commandMode.value = mode;
  commandForm.value = row
    ? {
        aggregateId: String(row.aggregateId),
        expectedVersion: Number(row.aggregateVersion),
      }
    : {};
  commandOpen.value = true;
}

function isoDate(value: unknown) {
  if (!value || typeof value !== 'object' || !('format' in value)) return value;
  return (value as { format: (pattern: string) => string }).format(
    'YYYY-MM-DD',
  );
}

function buildCommand() {
  const values = commandForm.value;
  if (commandMode.value === 'CREATE_STANDARD') {
    return {
      operation: commandMode.value,
      standard: {
        applicableSkuId: values.applicableSkuId || undefined,
        brandCode: values.brandCode || undefined,
        categoryCode: values.categoryCode,
        contentSha256: values.contentSha256,
        standardCode: values.standardCode,
      },
    };
  }
  if (commandMode.value === 'CERTIFY_AUTHENTICATOR') {
    return {
      certification: {
        authenticatorPrincipalId: values.authenticatorPrincipalId,
        certificationLevel: values.certificationLevel,
        effectiveFrom: isoDate(values.effectiveFrom),
        effectiveTo: isoDate(values.effectiveTo),
        evidenceSha256: values.evidenceSha256,
        standardId: values.standardId,
      },
      operation: commandMode.value,
    };
  }
  if (commandMode.value === 'CREATE_INSPECTION_TASK') {
    return {
      inspectionTask: {
        canonicalSkuId: values.canonicalSkuId,
        lotId: values.lotId || undefined,
        priority: values.priority,
        standardId: values.standardId,
        subjectRef: values.subjectRef,
        subjectType: values.subjectType,
        warehouseId: values.warehouseId,
      },
      operation: commandMode.value,
    };
  }
  if (commandMode.value === 'OPEN_CAPA') {
    return {
      capa: {
        dueDate: isoDate(values.dueDate),
        inspectionTaskId: values.inspectionTaskId,
        ownerPrincipalId: values.ownerPrincipalId,
        rootCauseCode: values.rootCauseCode,
      },
      operation: commandMode.value,
    };
  }

  const aggregateId = String(values.aggregateId);
  const expectedVersion = Number(values.expectedVersion);
  if (commandMode.value === 'PUBLISH_STANDARD') {
    return {
      operation: commandMode.value,
      standard: {
        approverPrincipalId: values.principalId,
        expectedVersion,
        standardId: aggregateId,
      },
    };
  }
  if (commandMode.value === 'REVOKE_AUTHENTICATOR') {
    return {
      certification: {
        certificationId: aggregateId,
        expectedVersion,
        reasonCode: values.reasonCode,
      },
      operation: commandMode.value,
    };
  }
  if (commandMode.value === 'RESOLVE_CAPA') {
    return {
      capa: {
        capaId: aggregateId,
        effectivenessEvidenceRef: values.evidenceRef,
        expectedVersion,
      },
      operation: commandMode.value,
    };
  }
  if (
    [
      'ACKNOWLEDGE_RECALL_ACTION',
      'OPEN_RECALL_ACTION',
      'RESOLVE_RECALL_ACTION',
    ].includes(commandMode.value)
  ) {
    return {
      operation: commandMode.value,
      recallAction: {
        expectedVersion,
        inspectionTaskId:
          commandMode.value === 'OPEN_RECALL_ACTION' ? aggregateId : undefined,
        ownerPrincipalId: values.ownerPrincipalId,
        reasonCode: values.reasonCode,
        recallActionId:
          commandMode.value === 'OPEN_RECALL_ACTION' ? undefined : aggregateId,
        resolutionCode: values.resolutionCode,
      },
    };
  }
  const inspectionTask: Record<string, unknown> = {
    expectedVersion,
    taskId: aggregateId,
  };
  if (commandMode.value === 'ASSIGN_INSPECTION_TASK') {
    inspectionTask.authenticatorPrincipalId = values.principalId;
  } else if (commandMode.value === 'DECIDE_INSPECTION_TASK') {
    inspectionTask.decision = values.decision;
    inspectionTask.defectCode = values.defectCode || undefined;
    inspectionTask.evidenceRef = values.evidenceRef;
  } else if (
    ['ASSIGN_RECHECK_REVIEWER', 'REQUEST_RECHECK'].includes(commandMode.value)
  ) {
    inspectionTask.recheckReasonCode = values.reasonCode;
    inspectionTask.secondaryAuthenticatorPrincipalId =
      values.secondaryAuthenticatorPrincipalId;
  } else if (commandMode.value === 'SUBMIT_RECHECK_DECISION') {
    inspectionTask.decision = values.decision;
    inspectionTask.defectCode = values.defectCode || undefined;
    inspectionTask.evidenceRef = values.evidenceRef;
  } else if (commandMode.value === 'ADJUDICATE_INSPECTION_TASK') {
    inspectionTask.adjudicatorPrincipalId = values.adjudicatorPrincipalId;
    inspectionTask.groundTruthDecision = values.decision;
    inspectionTask.groundTruthDefectCode = values.defectCode || undefined;
    inspectionTask.groundTruthEvidenceRef = values.evidenceRef;
  }
  return { inspectionTask, operation: commandMode.value };
}

async function submitCommand() {
  commandSaving.value = true;
  try {
    const result = await executeQualityCommand(buildCommand());
    message.success(
      result.duplicate ? '命令已幂等处理' : `操作成功：${result.status}`,
    );
    commandOpen.value = false;
    await loadData();
  } catch (error) {
    message.error(
      error instanceof Error ? error.message : '鉴别质检命令执行失败',
    );
  } finally {
    commandSaving.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <!-- eslint-disable vue/html-closing-bracket-newline -->
  <Page auto-content-height>
    <div class="quality-workbench space-y-4">
      <section class="workbench-hero">
        <div>
          <div class="workbench-eyebrow">QUALITY OPERATIONS</div>
          <h1>鉴别质检工作台</h1>
          <p>
            统一处理待检、复检、裁决、整改与召回，让每个质量结论都有证据可追溯。
          </p>
          <div class="workbench-sync">
            数据更新：{{ lastUpdatedAt }} · {{ workItemTotal }} 个质量事项 ·
            {{ afterSaleTotal }} 个售后关联单
          </div>
        </div>
        <Space wrap>
          <Button @click="openCommand('CREATE_STANDARD')">新建标准</Button>
          <Button @click="openCommand('CERTIFY_AUTHENTICATOR')">
            维护资质
          </Button>
          <Button type="primary" @click="openCommand('CREATE_INSPECTION_TASK')">
            创建质检任务
          </Button>
        </Space>
      </section>

      <Alert
        v-if="loadError"
        closable
        show-icon
        type="error"
        :message="loadError"
      />

      <Row :gutter="[16, 16]">
        <Col :lg="6" :sm="12" :xs="24">
          <Card class="metric-card metric-card--blue" :loading="loading">
            <div class="metric-label">待办质检任务</div>
            <Statistic :value="activeInspectionCount" />
            <div class="metric-caption">待分派、执行中与待完成任务</div>
          </Card>
        </Col>
        <Col :lg="6" :sm="12" :xs="24">
          <Card class="metric-card metric-card--warning" :loading="loading">
            <div class="metric-label">待复核 / 裁决</div>
            <Statistic :value="recheckCount" />
            <div class="metric-caption">复检要求、待复核与判定冲突</div>
          </Card>
        </Col>
        <Col :lg="6" :sm="12" :xs="24">
          <Card class="metric-card metric-card--danger" :loading="loading">
            <div class="metric-label">整改与召回</div>
            <Statistic :value="qualityActionCount" />
            <div class="metric-caption">尚未验证关闭的质量行动</div>
          </Card>
        </Col>
        <Col :lg="6" :sm="12" :xs="24">
          <Card class="metric-card metric-card--purple" :loading="loading">
            <div class="metric-label">受控质量库存</div>
            <Statistic :value="pendingTotal + damagedTotal + rejectedTotal" />
            <div class="metric-caption">
              待检 {{ pendingTotal }} · 瑕疵 {{ damagedTotal }} · 拒收
              {{ rejectedTotal }}
            </div>
          </Card>
        </Col>
      </Row>

      <Card class="operations-card">
        <template #title>
          <div class="section-heading">
            <div>
              <strong>质量运营队列</strong>
              <span>按状态推进任务，每一行只展示当前合法动作</span>
            </div>
            <Space>
              <Tag color="blue">
                {{ filteredWorkItems.length }} / {{ workItemTotal }}
              </Tag>
              <Button :loading="loading" @click="loadData">刷新</Button>
            </Space>
          </div>
        </template>
        <div class="queue-toolbar">
          <Space wrap>
            <Select
              v-model:value="queueFilter"
              :options="queueOptions"
              class="queue-filter"
            />
            <Input
              v-model:value="queueKeyword"
              allow-clear
              class="queue-search"
              placeholder="搜索任务、标准、关联对象或状态"
            />
          </Space>
          <Space wrap>
            <Button @click="openCommand('OPEN_CAPA')">发起 CAPA</Button>
            <Button @click="router.push('/cloudmold/buyer-journey/aftersales')">
              查看售后质检
            </Button>
          </Space>
        </div>
        <Table
          :columns="workItemColumns"
          :data-source="filteredWorkItems"
          :loading="loading"
          :locale="{ emptyText: '当前筛选下没有质量事项' }"
          :pagination="{ pageSize: 8, showSizeChanger: false }"
          row-key="aggregateId"
          :scroll="{ x: 1050 }"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'overview'">
              <div class="object-cell">
                <div class="object-cell__title">
                  <Tag
                    :color="
                      getWorkbenchMeta(qualityItemMeta, record.itemType).color
                    "
                  >
                    {{
                      getWorkbenchMeta(qualityItemMeta, record.itemType).label
                    }}
                  </Tag>
                  <strong>{{ record.code || '未命名事项' }}</strong>
                </div>
                <span>
                  更新于
                  {{
                    new Date(record.updatedAt).toLocaleString('zh-CN', {
                      hour12: false,
                    })
                  }}
                </span>
              </div>
            </template>
            <template v-else-if="column.key === 'relatedRef'">
              <Tooltip :title="record.relatedRef || '暂无关联对象'">
                <span class="reference-text">
                  {{ shortReference(record.relatedRef) }}
                </span>
              </Tooltip>
            </template>
            <template v-else-if="column.key === 'status'">
              <Tag :color="getWorkbenchMeta(statusMeta, record.status).color">
                {{ getWorkbenchMeta(statusMeta, record.status).label }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'dueDate'">
              <span
                :class="{
                  'due-date--danger':
                    record.dueDate &&
                    new Date(record.dueDate).getTime() < Date.now() &&
                    !['COMPLETED', 'RESOLVED', 'VERIFIED'].includes(
                      record.status,
                    ),
                }"
              >
                {{ record.dueDate || '未设置' }}
              </span>
            </template>
            <template v-else-if="column.key === 'action'">
              <Space wrap>
                <Button
                  v-if="
                    record.itemType === 'STANDARD' && record.status === 'DRAFT'
                  "
                  size="small"
                  type="link"
                  @click="openCommand('PUBLISH_STANDARD', record)"
                >
                  发布
                </Button>
                <Button
                  v-if="
                    record.itemType === 'CERTIFICATION' &&
                    record.status === 'ACTIVE'
                  "
                  danger
                  size="small"
                  type="link"
                  @click="openCommand('REVOKE_AUTHENTICATOR', record)"
                >
                  撤销
                </Button>
                <Button
                  v-if="
                    record.itemType === 'INSPECTION_TASK' &&
                    record.status === 'CREATED'
                  "
                  size="small"
                  type="link"
                  @click="openCommand('ASSIGN_INSPECTION_TASK', record)"
                >
                  分派
                </Button>
                <Button
                  v-if="
                    record.itemType === 'INSPECTION_TASK' &&
                    record.status === 'ASSIGNED'
                  "
                  size="small"
                  type="link"
                  @click="openCommand('START_INSPECTION_TASK', record)"
                >
                  开始
                </Button>
                <Button
                  v-if="
                    record.itemType === 'INSPECTION_TASK' &&
                    record.status === 'IN_PROGRESS'
                  "
                  size="small"
                  type="link"
                  @click="openCommand('DECIDE_INSPECTION_TASK', record)"
                >
                  判定
                </Button>
                <Button
                  v-if="
                    record.itemType === 'INSPECTION_TASK' &&
                    record.status === 'DECIDED'
                  "
                  size="small"
                  type="link"
                  @click="openCommand('ASSIGN_RECHECK_REVIEWER', record)"
                >
                  分派复检
                </Button>
                <Button
                  v-if="
                    record.itemType === 'INSPECTION_TASK' &&
                    record.status === 'RECHECK_REQUIRED'
                  "
                  size="small"
                  type="link"
                  @click="openCommand('SUBMIT_RECHECK_DECISION', record)"
                >
                  提交复检
                </Button>
                <Button
                  v-if="
                    record.itemType === 'INSPECTION_TASK' &&
                    record.status === 'CONFLICTED'
                  "
                  danger
                  size="small"
                  type="link"
                  @click="openCommand('ADJUDICATE_INSPECTION_TASK', record)"
                >
                  第三方裁决
                </Button>
                <Button
                  v-if="
                    record.itemType === 'INSPECTION_TASK' &&
                    record.status === 'DECIDED'
                  "
                  size="small"
                  type="link"
                  @click="openCommand('COMPLETE_INSPECTION_TASK', record)"
                >
                  完成
                </Button>
                <Button
                  v-if="
                    record.itemType === 'INSPECTION_TASK' &&
                    record.status === 'DECIDED'
                  "
                  danger
                  size="small"
                  type="link"
                  @click="openCommand('OPEN_RECALL_ACTION', record)"
                >
                  发起批次召回
                </Button>
                <Button
                  v-if="record.itemType === 'CAPA' && record.status === 'OPEN'"
                  size="small"
                  type="link"
                  @click="openCommand('RESOLVE_CAPA', record)"
                >
                  验证关闭
                </Button>
                <Button
                  v-if="
                    record.itemType === 'RECALL_ACTION' &&
                    record.status === 'OPEN'
                  "
                  size="small"
                  type="link"
                  @click="openCommand('ACKNOWLEDGE_RECALL_ACTION', record)"
                >
                  认领召回
                </Button>
                <Button
                  v-if="
                    record.itemType === 'RECALL_ACTION' &&
                    ['OPEN', 'ACKNOWLEDGED'].includes(record.status)
                  "
                  size="small"
                  type="link"
                  @click="openCommand('RESOLVE_RECALL_ACTION', record)"
                >
                  完成召回
                </Button>
                <span
                  v-if="
                    ['COMPLETED', 'PUBLISHED', 'REVOKED', 'VERIFIED'].includes(
                      record.status,
                    )
                  "
                  class="action-complete"
                >
                  当前流程已完成
                </span>
              </Space>
            </template>
          </template>
        </Table>
      </Card>

      <Card class="operations-card">
        <template #title>
          <div class="section-heading">
            <div>
              <strong>质量库存待办</strong>
              <span>关联批次与库位，直接进入库存处置</span>
            </div>
            <Button
              type="primary"
              @click="
                router.push(
                  '/cloudmold/supply-chain/inventory-control/balances',
                )
              "
            >
              进入库存作业
            </Button>
          </div>
        </template>
        <div class="quality-health-strip">
          <div>
            <span>质检任务闭环率</span>
            <strong>{{ completionRate }}%</strong>
          </div>
          <Progress
            :percent="completionRate"
            :show-info="false"
            status="active"
          />
          <span>
            已完成 {{ completedInspectionCount }} /
            {{ inspectionTasks.length }} 个质检任务
          </span>
        </div>
        <Table
          v-if="qualityRows.length"
          :columns="columns"
          :data-source="qualityRows"
          :loading="loading"
          :pagination="{ pageSize: 8, showSizeChanger: false }"
          row-key="balanceId"
          :scroll="{ x: 1030 }"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'inventory'">
              <div class="object-cell">
                <strong>{{ record.skuCode }}</strong>
                <span>批次 {{ record.lotCode || '未指定' }}</span>
              </div>
            </template>
            <template v-else-if="column.key === 'location'">
              <div class="object-cell">
                <strong>{{
                  record.warehouseName || record.warehouseCode
                }}</strong>
                <span>{{ record.locationName || record.locationCode }}</span>
              </div>
            </template>
            <template v-else-if="column.key === 'qualityStatus'">
              <Tag
                :color="
                  record.qualityStatus === 'PENDING_QC'
                    ? 'blue'
                    : record.qualityStatus === 'DAMAGED'
                      ? 'orange'
                      : 'red'
                "
              >
                {{
                  record.qualityStatus === 'PENDING_QC'
                    ? '待质检'
                    : record.qualityStatus === 'DAMAGED'
                      ? '瑕疵'
                      : '拒收'
                }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'quantity'">
              <strong>{{ record.quantity }} {{ record.baseUomCode }}</strong>
            </template>
            <template v-else-if="column.key === 'updatedAt'">
              {{
                new Date(record.updatedAt).toLocaleString('zh-CN', {
                  hour12: false,
                })
              }}
            </template>
            <template v-else-if="column.key === 'action'">
              <Button
                type="link"
                @click="
                  router.push(
                    '/cloudmold/supply-chain/inventory-control/balances',
                  )
                "
              >
                去处理
              </Button>
            </template>
          </template>
        </Table>
        <Empty v-else :image="simpleEmptyImage">
          <template #description>
            <div class="empty-description">
              <strong>当前没有待处理质量库存</strong>
              <span
                >待检、瑕疵和拒收库存均已清空，可继续处理质量任务队列。</span
              >
            </div>
          </template>
          <Button @click="openCommand('CREATE_INSPECTION_TASK')">
            创建抽检任务
          </Button>
        </Empty>
      </Card>

      <Modal
        v-model:open="commandOpen"
        :confirm-loading="commandSaving"
        :title="commandTitles[commandMode] ?? '质量业务操作'"
        width="720px"
        @ok="submitCommand"
      >
        <Alert
          class="mb-4"
          show-icon
          type="info"
          :message="commandTitles[commandMode] ?? commandMode"
          description="请确认对象、责任人与证据引用。提交后将进入质量状态流并自动刷新工作台。"
        />
        <Form :label-col="{ span: 7 }" :wrapper-col="{ span: 16 }">
          <template v-if="commandMode === 'CREATE_STANDARD'">
            <FormItem label="标准编码" required>
              <Input v-model:value="commandForm.standardCode" />
            </FormItem>
            <FormItem label="品类代码" required>
              <Input v-model:value="commandForm.categoryCode" />
            </FormItem>
            <FormItem label="品牌代码">
              <Input v-model:value="commandForm.brandCode" />
            </FormItem>
            <FormItem label="适用规范 SKU">
              <Input v-model:value="commandForm.applicableSkuId" />
            </FormItem>
            <FormItem label="内容 SHA-256" required>
              <Input v-model:value="commandForm.contentSha256" />
            </FormItem>
          </template>
          <template v-else-if="commandMode === 'CERTIFY_AUTHENTICATOR'">
            <FormItem label="鉴别师主体 ID" required>
              <Input v-model:value="commandForm.authenticatorPrincipalId" />
            </FormItem>
            <FormItem label="标准 ID" required>
              <Input v-model:value="commandForm.standardId" />
            </FormItem>
            <FormItem label="资质等级" required>
              <Select
                v-model:value="commandForm.certificationLevel"
                :options="
                  ['JUNIOR', 'SENIOR', 'EXPERT'].map((value) => ({
                    label: value,
                    value,
                  }))
                "
              />
            </FormItem>
            <FormItem label="有效期" required>
              <Space>
                <DatePicker v-model:value="commandForm.effectiveFrom" />
                <DatePicker v-model:value="commandForm.effectiveTo" />
              </Space>
            </FormItem>
            <FormItem label="证据 SHA-256" required>
              <Input v-model:value="commandForm.evidenceSha256" />
            </FormItem>
          </template>
          <template v-else-if="commandMode === 'CREATE_INSPECTION_TASK'">
            <FormItem label="标准 ID" required>
              <Input v-model:value="commandForm.standardId" />
            </FormItem>
            <FormItem label="对象类型" required>
              <Select
                v-model:value="commandForm.subjectType"
                :options="
                  [
                    'INBOUND_ITEM',
                    'RETURN_ITEM',
                    'LISTING_SAMPLE',
                    'RISK_SAMPLE',
                  ].map((value) => ({ label: value, value }))
                "
              />
            </FormItem>
            <FormItem label="对象引用" required>
              <Input v-model:value="commandForm.subjectRef" />
            </FormItem>
            <FormItem label="规范 SKU / 批次" required>
              <Space>
                <Input
                  v-model:value="commandForm.canonicalSkuId"
                  placeholder="规范 SKU ID"
                />
                <Input
                  v-model:value="commandForm.lotId"
                  placeholder="批次 ID，可选"
                />
              </Space>
            </FormItem>
            <FormItem label="仓库 ID" required>
              <Input v-model:value="commandForm.warehouseId" />
            </FormItem>
            <FormItem label="优先级" required>
              <Select
                v-model:value="commandForm.priority"
                :options="
                  ['LOW', 'NORMAL', 'HIGH', 'URGENT'].map((value) => ({
                    label: value,
                    value,
                  }))
                "
              />
            </FormItem>
          </template>
          <template v-else-if="commandMode === 'OPEN_CAPA'">
            <FormItem label="失败质检任务 ID" required>
              <Input v-model:value="commandForm.inspectionTaskId" />
            </FormItem>
            <FormItem label="根因代码" required>
              <Input v-model:value="commandForm.rootCauseCode" />
            </FormItem>
            <FormItem label="责任人 ID" required>
              <Input v-model:value="commandForm.ownerPrincipalId" />
            </FormItem>
            <FormItem label="截止日" required>
              <DatePicker v-model:value="commandForm.dueDate" />
            </FormItem>
          </template>
          <template v-else>
            <FormItem label="聚合 ID">
              <Input :value="String(commandForm.aggregateId ?? '')" disabled />
            </FormItem>
            <FormItem label="预期版本">
              <Input
                :value="String(commandForm.expectedVersion ?? '')"
                disabled
              />
            </FormItem>
            <FormItem
              v-if="
                ['PUBLISH_STANDARD', 'ASSIGN_INSPECTION_TASK'].includes(
                  commandMode,
                )
              "
              label="操作主体 ID"
              required
            >
              <Input v-model:value="commandForm.principalId" />
            </FormItem>
            <FormItem
              v-if="
                [
                  'REVOKE_AUTHENTICATOR',
                  'REQUEST_RECHECK',
                  'ASSIGN_RECHECK_REVIEWER',
                  'OPEN_RECALL_ACTION',
                ].includes(commandMode)
              "
              label="原因代码"
              required
            >
              <Input v-model:value="commandForm.reasonCode" />
            </FormItem>
            <FormItem
              v-if="
                [
                  'DECIDE_INSPECTION_TASK',
                  'SUBMIT_RECHECK_DECISION',
                  'ADJUDICATE_INSPECTION_TASK',
                ].includes(commandMode)
              "
              label="判定"
              required
            >
              <Select
                v-model:value="commandForm.decision"
                :options="
                  ['PASS', 'FAIL'].map((value) => ({ label: value, value }))
                "
              />
            </FormItem>
            <FormItem
              v-if="
                [
                  'DECIDE_INSPECTION_TASK',
                  'SUBMIT_RECHECK_DECISION',
                  'ADJUDICATE_INSPECTION_TASK',
                ].includes(commandMode)
              "
              label="缺陷代码（失败必填）"
            >
              <Input v-model:value="commandForm.defectCode" />
            </FormItem>
            <FormItem
              v-if="
                [
                  'DECIDE_INSPECTION_TASK',
                  'SUBMIT_RECHECK_DECISION',
                  'ADJUDICATE_INSPECTION_TASK',
                  'RESOLVE_CAPA',
                ].includes(commandMode)
              "
              label="证据引用"
              required
            >
              <Input
                v-model:value="commandForm.evidenceRef"
                placeholder="sha256:<64位摘要> 或 restricted:<受限引用>"
              />
            </FormItem>
            <FormItem
              v-if="
                ['REQUEST_RECHECK', 'ASSIGN_RECHECK_REVIEWER'].includes(
                  commandMode,
                )
              "
              label="独立复检人 ID"
              required
            >
              <Input
                v-model:value="commandForm.secondaryAuthenticatorPrincipalId"
              />
            </FormItem>
            <FormItem
              v-if="commandMode === 'ADJUDICATE_INSPECTION_TASK'"
              label="第三方裁决人 ID"
              required
            >
              <Input v-model:value="commandForm.adjudicatorPrincipalId" />
            </FormItem>
            <FormItem
              v-if="
                [
                  'OPEN_RECALL_ACTION',
                  'ACKNOWLEDGE_RECALL_ACTION',
                  'RESOLVE_RECALL_ACTION',
                ].includes(commandMode)
              "
              label="召回责任人 ID"
              required
            >
              <Input v-model:value="commandForm.ownerPrincipalId" />
            </FormItem>
            <FormItem
              v-if="commandMode === 'RESOLVE_RECALL_ACTION'"
              label="召回解决代码"
              required
            >
              <Input v-model:value="commandForm.resolutionCode" />
            </FormItem>
          </template>
        </Form>
      </Modal>
    </div>
  </Page>
</template>

<style scoped>
.quality-workbench {
  --workbench-blue: #1677ff;
  --workbench-purple: #7a5af8;
  --workbench-orange: #d97904;
  --workbench-red: #e34935;
}

.workbench-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 112px;
  padding: 18px 24px;
  overflow: hidden;
  background:
    radial-gradient(circle at 80% 0%, rgb(122 90 248 / 18%), transparent 38%),
    linear-gradient(120deg, rgb(22 119 255 / 9%), transparent 55%);
  border: 1px solid rgb(122 90 248 / 30%);
  border-radius: 12px;
}

.workbench-hero > div:first-child {
  max-width: 68%;
}

.workbench-hero h1 {
  margin: 3px 0 4px;
  font-size: 24px;
  font-weight: 650;
  line-height: 1.35;
}

.workbench-hero p {
  margin: 0;
  color: var(--ant-color-text-secondary);
}

.workbench-eyebrow {
  font-size: 11px;
  font-weight: 700;
  color: var(--workbench-purple);
  letter-spacing: 0.12em;
}

.workbench-sync {
  margin-top: 14px;
  font-size: 12px;
  color: var(--ant-color-text-tertiary);
}

.metric-card {
  position: relative;
  min-height: 112px;
  overflow: hidden;
}

.metric-card::before {
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  content: '';
  background: var(--metric-color);
}

.metric-card--blue {
  --metric-color: var(--workbench-blue);
}

.metric-card--warning {
  --metric-color: var(--workbench-orange);
}

.metric-card--danger {
  --metric-color: var(--workbench-red);
}

.metric-card--purple {
  --metric-color: var(--workbench-purple);
}

.metric-label {
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--ant-color-text-secondary);
}

.metric-caption {
  margin-top: 8px;
  font-size: 12px;
  color: var(--ant-color-text-tertiary);
}

.operations-card :deep(.ant-card-head) {
  min-height: 64px;
}

.section-heading,
.queue-toolbar {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
}

.section-heading > div:first-child {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.section-heading span {
  font-size: 12px;
  font-weight: 400;
  color: var(--ant-color-text-tertiary);
}

.queue-toolbar {
  padding-bottom: 16px;
}

.queue-filter {
  width: 160px;
}

.queue-search {
  width: 300px;
}

.object-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.object-cell__title {
  display: flex;
  gap: 8px;
  align-items: center;
}

.object-cell span {
  font-size: 12px;
  color: var(--ant-color-text-tertiary);
}

.reference-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  color: var(--ant-color-text-secondary);
}

.action-complete {
  font-size: 12px;
  color: var(--ant-color-text-tertiary);
}

.due-date--danger {
  font-weight: 600;
  color: var(--workbench-red);
}

.quality-health-strip {
  display: grid;
  grid-template-columns: 150px minmax(220px, 1fr) auto;
  gap: 20px;
  align-items: center;
  padding: 4px 0 20px;
}

.quality-health-strip > div:first-child {
  display: flex;
  flex-direction: column;
}

.quality-health-strip > div:first-child span,
.quality-health-strip > span {
  font-size: 12px;
  color: var(--ant-color-text-tertiary);
}

.quality-health-strip strong {
  font-size: 24px;
}

.empty-description {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.empty-description span {
  color: var(--ant-color-text-tertiary);
}

@media (max-width: 900px) {
  .workbench-hero,
  .queue-toolbar,
  .section-heading {
    flex-direction: column;
    align-items: flex-start;
  }

  .workbench-hero > div:first-child {
    max-width: none;
  }

  .quality-health-strip {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>
