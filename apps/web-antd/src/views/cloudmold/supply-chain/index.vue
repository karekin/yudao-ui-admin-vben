<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { CloudMoldCommerceApi } from '#/api/cloudmold/commerce';
import type { CloudMoldInventoryApi } from '#/api/cloudmold/inventory';
import type { CloudMoldSupplyPlanningApi } from '#/api/cloudmold/supply-planning';

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
  InputNumber,
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

import { getCloudMoldFulfillmentPage } from '#/api/cloudmold/commerce';
import { getCloudMoldInventoryBalancePage } from '#/api/cloudmold/inventory';
import {
  executeSupplyPlanningCommand,
  getSupplyPlanningWorkItemPage,
} from '#/api/cloudmold/supply-planning';

import {
  getWorkbenchMeta,
  matchesWorkbenchItem,
  shortReference,
  statusMeta,
  supplyItemMeta,
} from '../shared/operations-workbench';

defineOptions({ name: 'CloudMoldSupplyChainControlTower' });

interface SupplyCommandForm {
  aggregateId?: string;
  actualQuantity?: number;
  actualsSha256?: string;
  agedThresholdDays?: number;
  baselineSha256?: string;
  bucketStart?: Dayjs;
  bucketType?: string;
  budgetAmountMinor?: number;
  canonicalSkuId?: string;
  capacityQuantity?: number;
  constraintsSha256?: string;
  currencyCode?: string;
  decision?: string;
  demandForecastId?: string;
  expectedVersion?: number;
  forecastCode?: string;
  forecastQuantity?: number;
  horizonEnd?: Dayjs;
  horizonStart?: Dayjs;
  issueType?: string;
  inboundQuantity?: number;
  lowerQuantity?: number;
  minimumOrderQuantity?: number;
  modelRef?: string;
  planCode?: string;
  policyCode?: string;
  policySha256?: string;
  principalId?: string;
  ownerId?: string;
  ownerType?: string;
  resolutionCode?: string;
  severity?: string;
  safetyStockQuantity?: number;
  scenarioCode?: string;
  sourceBalanceId?: string;
  sourceWarehouseId?: string;
  targetServiceLevelBasisPoints?: number;
  targetType?: string;
  targetWarehouseId?: string;
  unitCostMinor?: number;
  uomCode?: string;
  upperQuantity?: number;
  warehouseId?: string;
  onHandQuantity?: number;
}

const router = useRouter();
const loading = ref(false);
const loadError = ref('');
const balances = ref<CloudMoldInventoryApi.Balance[]>([]);
const balanceTotal = ref(0);
const fulfillments = ref<CloudMoldCommerceApi.Fulfillment[]>([]);
const fulfillmentTotal = ref(0);
const workItems = ref<CloudMoldSupplyPlanningApi.WorkItem[]>([]);
const workItemTotal = ref(0);
const selectedScenarioPlanIds = ref<Set<string>>(new Set());
const commandOpen = ref(false);
const commandSaving = ref(false);
const commandMode = ref('CREATE_FORECAST');
const commandForm = ref<SupplyCommandForm>({});
const workItemKeyword = ref('');
const workItemType = ref('ALL');

const toNumber = (value?: string) => Number(value ?? 0);

const stockoutCount = computed(
  () =>
    balances.value.filter((item) => toNumber(item.availableQuantity) <= 0)
      .length,
);
const lowStockCount = computed(
  () =>
    balances.value.filter((item) => {
      const available = toNumber(item.availableQuantity);
      return available > 0 && available <= 5;
    }).length,
);
const pendingQcCount = computed(
  () =>
    balances.value.filter((item) => item.qualityStatus === 'PENDING_QC').length,
);
const exceptionFulfillmentCount = computed(
  () =>
    fulfillments.value.filter(
      (item) => !['CANCELLED', 'DELIVERED'].includes(item.status),
    ).length,
);
const healthyRate = computed(() => {
  if (balances.value.length === 0) return 0;
  const atRisk = balances.value.filter(
    (item) =>
      item.qualityStatus !== 'QUALIFIED' ||
      toNumber(item.availableQuantity) <= 5,
  ).length;
  return Math.max(
    0,
    Math.round(
      ((balances.value.length - atRisk) / balances.value.length) * 100,
    ),
  );
});

const actionableWorkItemCount = computed(
  () =>
    workItems.value.filter(
      (item) =>
        ![
          'COMPLETED',
          'CONVERTED',
          'PUBLISHED',
          'REJECTED',
          'RELEASED',
          'RESOLVED',
        ].includes(item.status),
    ).length,
);
const pendingDecisionCount = computed(
  () =>
    workItems.value.filter(
      (item) =>
        (item.itemType === 'REPLENISHMENT' &&
          ['APPROVED', 'PROPOSED'].includes(item.status)) ||
        (item.itemType === 'SUPPLY_PLAN' &&
          ['APPROVED', 'DRAFT'].includes(item.status)) ||
        (item.itemType === 'PLAN_SCENARIO' && item.status === 'EVALUATED'),
    ).length,
);
const openIssueCount = computed(
  () =>
    workItems.value.filter(
      (item) =>
        item.itemType === 'INVENTORY_ISSUE' &&
        ['ACKNOWLEDGED', 'OPEN'].includes(item.status),
    ).length,
);
const filteredWorkItems = computed(() =>
  workItems.value.filter(
    (item) =>
      (workItemType.value === 'ALL' || item.itemType === workItemType.value) &&
      matchesWorkbenchItem(item, workItemKeyword.value),
  ),
);
const lastUpdatedAt = computed(() => {
  const timestamps = [
    ...workItems.value.map((item) => item.updatedAt),
    ...balances.value.map((item) => item.updatedAt),
  ].filter(Boolean);
  if (timestamps.length === 0) return '尚未同步';
  return new Date(
    Math.max(...timestamps.map((value) => new Date(value).getTime())),
  ).toLocaleString('zh-CN', { hour12: false });
});

const riskRows = computed(() =>
  balances.value
    .map((item) => {
      const available = toNumber(item.availableQuantity);
      let risk = '健康';
      let priority = 4;
      if (item.qualityStatus !== 'QUALIFIED') {
        if (item.qualityStatus === 'PENDING_QC') {
          risk = '待质检';
        } else if (item.qualityStatus === 'DAMAGED') {
          risk = '瑕疵库存';
        } else {
          risk = '拒收库存';
        }
        priority = 1;
      } else if (available <= 0) {
        risk = '缺货';
        priority = 2;
      } else if (available <= 5) {
        risk = '低库存';
        priority = 3;
      }
      return { ...item, available, priority, risk };
    })
    .filter((item) => item.priority < 4)
    .toSorted((left, right) => left.priority - right.priority)
    .slice(0, 12),
);

const riskColumns = [
  { key: 'inventory', title: '库存对象', width: 260 },
  { key: 'location', title: '仓库 / 库位', width: 220 },
  { dataIndex: 'risk', key: 'risk', title: '风险' },
  { key: 'quantity', title: '库存量', width: 180 },
  { dataIndex: 'updatedAt', key: 'updatedAt', title: '最近更新', width: 180 },
  { key: 'action', title: '操作', width: 110 },
];

const workItemColumns = [
  { key: 'overview', title: '业务事项', width: 300 },
  { key: 'relatedRef', title: '关联对象', width: 190 },
  { key: 'status', title: '当前状态', width: 120 },
  { key: 'businessDate', title: '业务日期', width: 130 },
  { key: 'action', title: '下一步', width: 260 },
];

const workItemTypeOptions = [
  { label: '全部事项', value: 'ALL' },
  { label: '需求预测', value: 'FORECAST' },
  { label: 'S&OP 计划', value: 'SUPPLY_PLAN' },
  { label: '计划情景', value: 'PLAN_SCENARIO' },
  { label: '补货建议', value: 'REPLENISHMENT' },
  { label: '库存异常', value: 'INVENTORY_ISSUE' },
];

const commandTitles: Record<string, string> = {
  ACKNOWLEDGE_INVENTORY_ISSUE: '认领库存异常',
  APPROVE_SUPPLY_PLAN: '审批供应计划',
  CONVERT_REPLENISHMENT: '转换补货执行单',
  CREATE_FORECAST: '新建需求预测',
  CREATE_SUPPLY_PLAN: '新建 S&OP 计划',
  DECIDE_REPLENISHMENT: '审核补货建议',
  EVALUATE_FORECAST: '执行预测回测',
  EVALUATE_PLAN_SCENARIO: '新建计划情景测算',
  OPEN_INVENTORY_ISSUE: '登记库存异常',
  PUBLISH_FORECAST: '发布需求预测',
  RELEASE_SUPPLY_PLAN: '下达供应计划',
  RESOLVE_INVENTORY_ISSUE: '关闭库存异常',
  RUN_INVENTORY_HEALTH_SCAN: '运行库存健康扫描',
  SELECT_PLAN_SCENARIO: '选定计划情景',
};

const purchaseTargetType = 'PURCHASE_REQUEST' as const;
const transferTargetType = 'TRANSFER_REQUEST' as const;
const conversionTargetOptions = [
  {
    label: '采购申请',
    value: purchaseTargetType,
  },
  {
    label: '库存调拨单',
    value: transferTargetType,
  },
] satisfies Array<{
  label: string;
  value: CloudMoldSupplyPlanningApi.ReplenishmentConversionTargetType;
}>;

function getCommandDescription(mode: string) {
  if (mode === 'CONVERT_REPLENISHMENT') {
    return '仅消费已通过治理门禁且状态为 READY 的执行提案：采购路径创建 Procurement 采购申请，调拨路径创建 Warehouse 调拨申请与调拨单。';
  }
  return '请确认业务对象和输入参数。提交后将进入可审计状态流转，并自动刷新控制塔。';
}

function requireText(value: string | undefined, label: string) {
  if (!value?.trim()) {
    throw new Error(`${label}不能为空`);
  }
  return value.trim();
}

function requireTargetType(
  value: string | undefined,
): CloudMoldSupplyPlanningApi.ReplenishmentConversionTargetType {
  if (value === purchaseTargetType || value === transferTargetType) {
    return value;
  }
  throw new Error('请选择规范执行单据类型');
}

async function loadData() {
  loading.value = true;
  loadError.value = '';
  try {
    const [balancePage, fulfillmentPage, workItemPage, selectedScenarioPage] =
      await Promise.all([
        getCloudMoldInventoryBalancePage({
          onlyNonZero: true,
          pageNo: 1,
          pageSize: 100,
        }),
        getCloudMoldFulfillmentPage({ pageNo: 1, pageSize: 100 }),
        getSupplyPlanningWorkItemPage({ pageNo: 1, pageSize: 100 }),
        getSupplyPlanningWorkItemPage({
          itemType: 'PLAN_SCENARIO',
          pageNo: 1,
          pageSize: 100,
          status: 'SELECTED',
        }),
      ]);
    balances.value = balancePage.list;
    balanceTotal.value = balancePage.total;
    fulfillments.value = fulfillmentPage.list;
    fulfillmentTotal.value = fulfillmentPage.total;
    workItems.value = workItemPage.list;
    workItemTotal.value = workItemPage.total;
    selectedScenarioPlanIds.value = new Set(
      selectedScenarioPage.list.flatMap((item) =>
        item.relatedRef ? [item.relatedRef] : [],
      ),
    );
  } catch (error) {
    loadError.value =
      error instanceof Error ? error.message : '供应链数据加载失败';
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
  if (mode === 'CONVERT_REPLENISHMENT') {
    commandForm.value = {
      ...commandForm.value,
      targetType: commandForm.value.targetType ?? purchaseTargetType,
    };
  }
  if (!row && mode === 'RUN_INVENTORY_HEALTH_SCAN') {
    commandForm.value = {
      agedThresholdDays: 90,
      policyCode: 'INVENTORY_HEALTH_V1',
      policySha256:
        'ef27f3629dc9807ebc2a6b6771fcdd8ee13d89ae1b392b166222cedd472f7189',
    };
  }
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
  if (commandMode.value === 'CREATE_FORECAST') {
    return {
      operation: commandMode.value,
      forecast: {
        baselineSha256: values.baselineSha256,
        bucketType: values.bucketType,
        forecastCode: values.forecastCode,
        horizonEnd: isoDate(values.horizonEnd),
        horizonStart: isoDate(values.horizonStart),
        modelRef: values.modelRef,
        points: [
          {
            bucketStart: isoDate(values.bucketStart),
            canonicalSkuId: values.canonicalSkuId,
            forecastQuantity: values.forecastQuantity,
            lowerQuantity: values.lowerQuantity,
            uomCode: values.uomCode,
            upperQuantity: values.upperQuantity,
            warehouseId: values.warehouseId,
          },
        ],
      },
    };
  }
  if (commandMode.value === 'EVALUATE_FORECAST') {
    return {
      forecastEvaluation: {
        actuals: [
          {
            actualQuantity: values.actualQuantity,
            bucketStart: isoDate(values.bucketStart),
            canonicalSkuId: values.canonicalSkuId,
            uomCode: values.uomCode,
            warehouseId: values.warehouseId || undefined,
          },
        ],
        actualsSha256: values.actualsSha256,
        forecastId: values.aggregateId,
      },
      operation: commandMode.value,
    };
  }
  if (commandMode.value === 'CREATE_SUPPLY_PLAN') {
    return {
      operation: commandMode.value,
      supplyPlan: {
        budgetAmountMinor: values.budgetAmountMinor,
        constraintsSha256: values.constraintsSha256,
        currencyCode: values.currencyCode,
        demandForecastId: values.demandForecastId,
        horizonEnd: isoDate(values.horizonEnd),
        horizonStart: isoDate(values.horizonStart),
        planCode: values.planCode,
        targetServiceLevelBasisPoints: values.targetServiceLevelBasisPoints,
      },
    };
  }
  if (commandMode.value === 'EVALUATE_PLAN_SCENARIO') {
    return {
      operation: commandMode.value,
      planScenario: {
        capacityQuantity: values.capacityQuantity,
        canonicalSkuId: values.canonicalSkuId,
        forecastQuantity: values.forecastQuantity,
        inboundQuantity: values.inboundQuantity,
        minimumOrderQuantity: values.minimumOrderQuantity,
        onHandQuantity: values.onHandQuantity,
        parametersSha256: values.constraintsSha256,
        planId: values.aggregateId,
        safetyStockQuantity: values.safetyStockQuantity,
        scenarioCode: values.scenarioCode,
        unitCostMinor: values.unitCostMinor,
        uomCode: values.uomCode,
        warehouseId: values.warehouseId,
      },
    };
  }
  if (commandMode.value === 'RUN_INVENTORY_HEALTH_SCAN') {
    return {
      inventoryHealthScan: {
        agedThresholdDays: values.agedThresholdDays,
        observations: balances.value.map((item) => ({
          ageDays: 0,
          availableQuantity: Number(item.availableQuantity ?? 0),
          maximumStockQuantity: 100,
          pendingQualityInspection: item.qualityStatus === 'PENDING_QC',
          reorderPointQuantity: 5,
          sourceBalanceId: item.balanceId,
        })),
        policyCode: values.policyCode,
        policySha256: values.policySha256,
      },
      operation: commandMode.value,
    };
  }
  if (commandMode.value === 'OPEN_INVENTORY_ISSUE') {
    return {
      inventoryIssue: {
        issueType: values.issueType,
        severity: values.severity,
        sourceBalanceId: values.sourceBalanceId,
      },
      operation: commandMode.value,
    };
  }
  const aggregateId = String(values.aggregateId);
  const expectedVersion = Number(values.expectedVersion);
  if (commandMode.value === 'PUBLISH_FORECAST') {
    return {
      forecast: { expectedVersion, forecastId: aggregateId },
      operation: commandMode.value,
    };
  }
  if (commandMode.value === 'APPROVE_SUPPLY_PLAN') {
    return {
      operation: commandMode.value,
      supplyPlan: {
        approverPrincipalId: values.principalId,
        expectedVersion,
        planId: aggregateId,
      },
    };
  }
  if (commandMode.value === 'DECIDE_REPLENISHMENT') {
    return {
      operation: commandMode.value,
      replenishment: {
        decision: values.decision,
        decisionPrincipalId: values.principalId,
        expectedVersion,
        recommendationId: aggregateId,
      },
    };
  }
  if (commandMode.value === 'CONVERT_REPLENISHMENT') {
    const targetType = requireTargetType(values.targetType);
    const baseConversion = {
      convertedByPrincipalId: requireText(values.principalId, '操作人 ID'),
      expectedVersion,
      recommendationId: aggregateId,
      targetType,
    };
    if (targetType === purchaseTargetType) {
      return {
        operation: commandMode.value,
        replenishmentConversion: {
          ...baseConversion,
          targetType,
        },
      };
    }
    const sourceWarehouseId = requireText(
      values.sourceWarehouseId,
      '来源仓库 ID',
    );
    const targetWarehouseId = requireText(
      values.targetWarehouseId,
      '目标仓库 ID',
    );
    if (sourceWarehouseId === targetWarehouseId) {
      throw new Error('来源仓库与目标仓库不能相同');
    }
    return {
      operation: commandMode.value,
      replenishmentConversion: {
        ...baseConversion,
        ownerId: requireText(values.ownerId, '经营主体 ID'),
        ownerType: requireText(values.ownerType, '经营主体类型').toUpperCase(),
        sourceWarehouseId,
        targetType,
        targetWarehouseId,
      },
    };
  }
  if (commandMode.value === 'SELECT_PLAN_SCENARIO') {
    return {
      operation: commandMode.value,
      planScenario: {
        expectedVersion,
        scenarioId: aggregateId,
        selectedByPrincipalId: values.principalId,
      },
    };
  }
  if (commandMode.value === 'RELEASE_SUPPLY_PLAN') {
    return {
      operation: commandMode.value,
      supplyPlan: {
        expectedVersion,
        planId: aggregateId,
        releasePrincipalId: values.principalId,
      },
    };
  }
  return {
    inventoryIssue: {
      expectedVersion,
      issueId: aggregateId,
      ownerPrincipalId: values.principalId,
      resolutionCode: values.resolutionCode,
    },
    operation: commandMode.value,
  };
}

async function submitCommand() {
  commandSaving.value = true;
  try {
    const result = await executeSupplyPlanningCommand(buildCommand());
    message.success(
      result.duplicate ? '命令已幂等处理' : `操作成功：${result.status}`,
    );
    commandOpen.value = false;
    await loadData();
  } catch (error) {
    message.error(
      error instanceof Error ? error.message : '供应链命令执行失败',
    );
  } finally {
    commandSaving.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
  <Page auto-content-height>
    <div class="supply-tower space-y-4">
      <section class="workbench-hero">
        <div>
          <div class="workbench-eyebrow">SUPPLY CHAIN OPERATIONS</div>
          <h1>供应链控制塔</h1>
          <p>
            聚焦库存风险、供需决策和履约异常，从发现问题到下达执行形成闭环。
          </p>
          <div class="workbench-sync">
            数据更新：{{ lastUpdatedAt }} · {{ balanceTotal }} 个库存余额 ·
            {{ fulfillmentTotal }} 个履约单
          </div>
        </div>
        <Space wrap>
          <Button @click="openCommand('CREATE_FORECAST')">新建预测</Button>
          <Button @click="openCommand('CREATE_SUPPLY_PLAN')">新建计划</Button>
          <Button type="primary" :loading="loading" @click="loadData">
            刷新态势
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
          <Card class="metric-card metric-card--danger" :loading="loading">
            <div class="metric-label">库存风险</div>
            <Statistic :value="stockoutCount + lowStockCount" />
            <div class="metric-caption">
              缺货 {{ stockoutCount }} · 低库存 {{ lowStockCount }}
            </div>
          </Card>
        </Col>
        <Col :lg="6" :sm="12" :xs="24">
          <Card class="metric-card metric-card--warning" :loading="loading">
            <div class="metric-label">待决策事项</div>
            <Statistic :value="pendingDecisionCount" />
            <div class="metric-caption">计划审批、情景选择与补货决策</div>
          </Card>
        </Col>
        <Col :lg="6" :sm="12" :xs="24">
          <Card class="metric-card metric-card--blue" :loading="loading">
            <div class="metric-label">进行中任务</div>
            <Statistic :value="actionableWorkItemCount" />
            <div class="metric-caption">
              其中库存异常 {{ openIssueCount }} 项
            </div>
          </Card>
        </Col>
        <Col :lg="6" :sm="12" :xs="24">
          <Card class="metric-card metric-card--success" :loading="loading">
            <div class="metric-label">库存健康度</div>
            <Statistic suffix="%" :value="healthyRate" />
            <div class="metric-caption">
              待质检 {{ pendingQcCount }} · 进行中履约
              {{ exceptionFulfillmentCount }}
            </div>
          </Card>
        </Col>
      </Row>

      <Card class="operations-card">
        <template #title>
          <div class="section-heading">
            <div>
              <strong>计划与补货决策队列</strong>
              <span>按业务状态推进预测、计划和补货，不遗漏下一步</span>
            </div>
            <Tag color="blue">
              {{ filteredWorkItems.length }} / {{ workItemTotal }}
            </Tag>
          </div>
        </template>
        <div class="queue-toolbar">
          <Space wrap>
            <Select
              v-model:value="workItemType"
              :options="workItemTypeOptions"
              class="queue-filter"
            />
            <Input
              v-model:value="workItemKeyword"
              allow-clear
              class="queue-search"
              placeholder="搜索编码、状态或关联对象"
            />
          </Space>
          <Space wrap>
            <Button
              :disabled="balances.length === 0"
              @click="openCommand('RUN_INVENTORY_HEALTH_SCAN')"
            >
              运行健康扫描
            </Button>
            <Button danger @click="openCommand('OPEN_INVENTORY_ISSUE')">
              登记库存异常
            </Button>
          </Space>
        </div>
        <Table
          :columns="workItemColumns"
          :data-source="filteredWorkItems"
          :loading="loading"
          :locale="{ emptyText: '当前筛选下没有计划或补货事项' }"
          :pagination="{ pageSize: 8, showSizeChanger: false }"
          row-key="aggregateId"
          :scroll="{ x: 1000 }"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'overview'">
              <div class="object-cell">
                <div class="object-cell__title">
                  <Tag
                    :color="
                      getWorkbenchMeta(supplyItemMeta, record.itemType).color
                    "
                  >
                    {{
                      getWorkbenchMeta(supplyItemMeta, record.itemType).label
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
            <template v-else-if="column.key === 'businessDate'">
              {{ record.businessDate || '—' }}
            </template>
            <template v-else-if="column.key === 'action'">
              <Space>
                <Button
                  v-if="
                    record.itemType === 'FORECAST' && record.status === 'DRAFT'
                  "
                  size="small"
                  type="link"
                  @click="openCommand('PUBLISH_FORECAST', record)"
                >
                  发布
                </Button>
                <Button
                  v-if="
                    record.itemType === 'FORECAST' &&
                    record.status === 'PUBLISHED'
                  "
                  size="small"
                  type="link"
                  @click="openCommand('EVALUATE_FORECAST', record)"
                >
                  回测
                </Button>
                <Button
                  v-if="
                    record.itemType === 'SUPPLY_PLAN' &&
                    record.status === 'DRAFT'
                  "
                  size="small"
                  type="link"
                  @click="openCommand('EVALUATE_PLAN_SCENARIO', record)"
                >
                  情景测算
                </Button>
                <Button
                  v-if="
                    record.itemType === 'SUPPLY_PLAN' &&
                    record.status === 'DRAFT'
                  "
                  :disabled="!selectedScenarioPlanIds.has(record.aggregateId)"
                  size="small"
                  title="审批前必须先完成情景测算并选定情景"
                  type="link"
                  @click="openCommand('APPROVE_SUPPLY_PLAN', record)"
                >
                  审批
                </Button>
                <Button
                  v-if="
                    record.itemType === 'PLAN_SCENARIO' &&
                    record.status === 'EVALUATED'
                  "
                  size="small"
                  type="link"
                  @click="openCommand('SELECT_PLAN_SCENARIO', record)"
                >
                  选定情景
                </Button>
                <Button
                  v-if="
                    record.itemType === 'SUPPLY_PLAN' &&
                    record.status === 'APPROVED'
                  "
                  size="small"
                  type="link"
                  @click="openCommand('RELEASE_SUPPLY_PLAN', record)"
                >
                  发布并生成补货
                </Button>
                <Button
                  v-if="
                    record.itemType === 'REPLENISHMENT' &&
                    record.status === 'PROPOSED'
                  "
                  size="small"
                  type="link"
                  @click="openCommand('DECIDE_REPLENISHMENT', record)"
                >
                  决策
                </Button>
                <Button
                  v-if="
                    record.itemType === 'REPLENISHMENT' &&
                    record.status === 'APPROVED'
                  "
                  size="small"
                  type="link"
                  @click="openCommand('CONVERT_REPLENISHMENT', record)"
                >
                  转采购/调拨
                </Button>
                <Button
                  v-if="
                    record.itemType === 'INVENTORY_ISSUE' &&
                    record.status === 'OPEN'
                  "
                  size="small"
                  type="link"
                  @click="openCommand('ACKNOWLEDGE_INVENTORY_ISSUE', record)"
                >
                  认领
                </Button>
                <Button
                  v-if="
                    record.itemType === 'INVENTORY_ISSUE' &&
                    ['OPEN', 'ACKNOWLEDGED'].includes(record.status)
                  "
                  size="small"
                  type="link"
                  @click="openCommand('RESOLVE_INVENTORY_ISSUE', record)"
                >
                  解决
                </Button>
                <span
                  v-if="
                    [
                      'COMPLETED',
                      'PUBLISHED',
                      'REJECTED',
                      'RELEASED',
                      'RESOLVED',
                    ].includes(record.status)
                  "
                  class="action-complete"
                >
                  当前流程已完成
                </span>
                <span
                  v-if="
                    record.itemType === 'REPLENISHMENT' &&
                    record.status === 'CONVERTED'
                  "
                  class="action-complete"
                >
                  已创建规范采购申请或调拨单，等待下一业务事件
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
              <strong>库存风险雷达</strong>
              <span>优先处理影响可售库存和交付承诺的异常</span>
            </div>
            <Space>
              <Button
                @click="router.push('/cloudmold/supply-chain/warehouses')"
              >
                仓网视图
              </Button>
              <Button
                type="primary"
                @click="router.push('/cloudmold/supply-chain/inventory')"
              >
                进入库存作业
              </Button>
            </Space>
          </div>
        </template>
        <div class="health-strip">
          <div class="health-score">
            <span>总体健康度</span>
            <strong>{{ healthyRate }}%</strong>
          </div>
          <Progress
            class="health-progress"
            :percent="healthyRate"
            :show-info="false"
            :status="healthyRate >= 80 ? 'success' : 'exception'"
          />
          <div class="health-legend">
            <span><i class="dot dot--danger"></i>缺货 {{ stockoutCount }}</span>
            <span
              ><i class="dot dot--warning"></i>低库存 {{ lowStockCount }}</span
            >
            <span
              ><i class="dot dot--blue"></i>待质检 {{ pendingQcCount }}</span
            >
          </div>
        </div>
        <Table
          v-if="riskRows.length"
          :columns="riskColumns"
          :data-source="riskRows"
          :loading="loading"
          :pagination="false"
          row-key="balanceId"
          :scroll="{ x: 1040 }"
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
            <template v-else-if="column.key === 'risk'">
              <Tag
                :color="
                  record.risk === '待质检'
                    ? 'blue'
                    : record.risk === '缺货'
                      ? 'red'
                      : 'orange'
                "
              >
                {{ record.risk }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'quantity'">
              <strong>{{ record.available }} {{ record.baseUomCode }}</strong>
              <div class="quantity-caption">
                在手 {{ record.onHandQuantity }} · 预占
                {{ record.reservedQuantity }}
              </div>
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
                @click="router.push('/cloudmold/supply-chain/inventory')"
              >
                去处理
              </Button>
            </template>
          </template>
        </Table>
        <Empty v-else description="当前没有缺货、低库存或质量冻结记录">
          <template #description>
            <div class="empty-description">
              <strong>库存状态健康</strong>
              <span>没有发现需要人工介入的库存风险，可运行规则扫描复核。</span>
            </div>
          </template>
          <Button
            :disabled="balances.length === 0"
            @click="openCommand('RUN_INVENTORY_HEALTH_SCAN')"
          >
            运行健康扫描
          </Button>
        </Empty>
      </Card>

      <Modal
        v-model:open="commandOpen"
        :confirm-loading="commandSaving"
        :title="commandTitles[commandMode] ?? '供应链业务操作'"
        width="720px"
        @ok="submitCommand"
      >
        <Alert
          class="mb-4"
          show-icon
          type="info"
          :message="commandTitles[commandMode] ?? commandMode"
          :description="getCommandDescription(commandMode)"
        />
        <Form :label-col="{ span: 7 }" :wrapper-col="{ span: 16 }">
          <template v-if="commandMode === 'CREATE_FORECAST'">
            <FormItem label="预测编码" required>
              <Input v-model:value="commandForm.forecastCode" />
            </FormItem>
            <FormItem label="预测周期" required>
              <Space>
                <DatePicker v-model:value="commandForm.horizonStart" />
                <DatePicker v-model:value="commandForm.horizonEnd" />
              </Space>
            </FormItem>
            <FormItem label="桶粒度" required>
              <Select
                v-model:value="commandForm.bucketType"
                :options="
                  ['DAY', 'WEEK', 'MONTH'].map((value) => ({
                    label: value,
                    value,
                  }))
                "
              />
            </FormItem>
            <FormItem label="模型引用" required>
              <Input v-model:value="commandForm.modelRef" />
            </FormItem>
            <FormItem label="基线 SHA-256" required>
              <Input v-model:value="commandForm.baselineSha256" />
            </FormItem>
            <FormItem label="SKU / 仓库" required>
              <Space>
                <Input
                  v-model:value="commandForm.canonicalSkuId"
                  placeholder="规范 SKU ID"
                />
                <Input
                  v-model:value="commandForm.warehouseId"
                  placeholder="仓库 ID，可选"
                />
              </Space>
            </FormItem>
            <FormItem label="预测桶日期" required>
              <DatePicker v-model:value="commandForm.bucketStart" />
            </FormItem>
            <FormItem label="预测/下限/上限" required>
              <Space>
                <InputNumber
                  v-model:value="commandForm.forecastQuantity"
                  :min="0"
                />
                <InputNumber
                  v-model:value="commandForm.lowerQuantity"
                  :min="0"
                />
                <InputNumber
                  v-model:value="commandForm.upperQuantity"
                  :min="0"
                />
              </Space>
            </FormItem>
            <FormItem label="计量单位" required>
              <Input v-model:value="commandForm.uomCode" placeholder="EA" />
            </FormItem>
          </template>
          <template v-else-if="commandMode === 'EVALUATE_FORECAST'">
            <FormItem label="预测 ID">
              <Input :value="String(commandForm.aggregateId ?? '')" disabled />
            </FormItem>
            <FormItem label="SKU / 仓库" required>
              <Space>
                <Input
                  v-model:value="commandForm.canonicalSkuId"
                  placeholder="规范 SKU ID"
                />
                <Input
                  v-model:value="commandForm.warehouseId"
                  placeholder="仓库 ID，可选"
                />
              </Space>
            </FormItem>
            <FormItem label="预测桶日期" required>
              <DatePicker v-model:value="commandForm.bucketStart" />
            </FormItem>
            <FormItem label="实际销量" required>
              <InputNumber
                v-model:value="commandForm.actualQuantity"
                :min="0"
              />
            </FormItem>
            <FormItem label="计量单位" required>
              <Input v-model:value="commandForm.uomCode" placeholder="EA" />
            </FormItem>
            <FormItem label="实际数据 SHA-256" required>
              <Input v-model:value="commandForm.actualsSha256" />
            </FormItem>
          </template>
          <template v-else-if="commandMode === 'CREATE_SUPPLY_PLAN'">
            <FormItem label="计划编码" required>
              <Input v-model:value="commandForm.planCode" />
            </FormItem>
            <FormItem label="已发布预测 ID" required>
              <Input v-model:value="commandForm.demandForecastId" />
            </FormItem>
            <FormItem label="计划周期" required>
              <Space>
                <DatePicker v-model:value="commandForm.horizonStart" />
                <DatePicker v-model:value="commandForm.horizonEnd" />
              </Space>
            </FormItem>
            <FormItem label="目标服务水平(bp)" required>
              <InputNumber
                v-model:value="commandForm.targetServiceLevelBasisPoints"
                :max="10000"
                :min="0"
              />
            </FormItem>
            <FormItem label="预算最小货币单位" required>
              <InputNumber
                v-model:value="commandForm.budgetAmountMinor"
                :min="0"
              />
            </FormItem>
            <FormItem label="币种" required>
              <Input
                v-model:value="commandForm.currencyCode"
                placeholder="CNY"
              />
            </FormItem>
            <FormItem label="约束 SHA-256" required>
              <Input v-model:value="commandForm.constraintsSha256" />
            </FormItem>
          </template>
          <template v-else-if="commandMode === 'EVALUATE_PLAN_SCENARIO'">
            <FormItem label="计划 ID">
              <Input :value="String(commandForm.aggregateId ?? '')" disabled />
            </FormItem>
            <FormItem label="情景编码" required>
              <Input
                v-model:value="commandForm.scenarioCode"
                placeholder="BASELINE"
              />
            </FormItem>
            <FormItem label="SKU / 仓库" required>
              <Space>
                <Input v-model:value="commandForm.canonicalSkuId" />
                <Input v-model:value="commandForm.warehouseId" />
              </Space>
            </FormItem>
            <FormItem label="预测 / 安全库存" required>
              <Space>
                <InputNumber
                  v-model:value="commandForm.forecastQuantity"
                  :min="0"
                />
                <InputNumber
                  v-model:value="commandForm.safetyStockQuantity"
                  :min="0"
                />
              </Space>
            </FormItem>
            <FormItem label="在手 / 在途" required>
              <Space>
                <InputNumber
                  v-model:value="commandForm.onHandQuantity"
                  :min="0"
                />
                <InputNumber
                  v-model:value="commandForm.inboundQuantity"
                  :min="0"
                />
              </Space>
            </FormItem>
            <FormItem label="产能 / MOQ" required>
              <Space>
                <InputNumber
                  v-model:value="commandForm.capacityQuantity"
                  :min="0"
                />
                <InputNumber
                  v-model:value="commandForm.minimumOrderQuantity"
                  :min="0"
                />
              </Space>
            </FormItem>
            <FormItem label="单位成本(分)" required>
              <InputNumber v-model:value="commandForm.unitCostMinor" :min="0" />
            </FormItem>
            <FormItem label="单位" required>
              <Input v-model:value="commandForm.uomCode" placeholder="EA" />
            </FormItem>
            <FormItem label="参数 SHA-256" required>
              <Input v-model:value="commandForm.constraintsSha256" />
            </FormItem>
          </template>
          <template v-else-if="commandMode === 'RUN_INVENTORY_HEALTH_SCAN'">
            <Alert
              class="mb-4"
              show-icon
              type="warning"
              :message="`将扫描当前加载的 ${balances.length} 条规范库存余额`"
              description="默认阈值：可用库存≤5 为低库存、>100 为超储、待质检优先生成问题；活动中的同类问题不会重复创建。"
            />
            <FormItem label="策略编码" required>
              <Input v-model:value="commandForm.policyCode" />
            </FormItem>
            <FormItem label="策略 SHA-256" required>
              <Input v-model:value="commandForm.policySha256" />
            </FormItem>
            <FormItem label="库龄阈值(天)" required>
              <InputNumber
                v-model:value="commandForm.agedThresholdDays"
                :min="1"
              />
            </FormItem>
          </template>
          <template v-else-if="commandMode === 'OPEN_INVENTORY_ISSUE'">
            <FormItem label="库存余额 ID" required>
              <Input v-model:value="commandForm.sourceBalanceId" />
            </FormItem>
            <FormItem label="问题类型" required>
              <Select
                v-model:value="commandForm.issueType"
                :options="
                  ['STOCKOUT', 'LOW_STOCK', 'EXCESS', 'AGED', 'PENDING_QC'].map(
                    (value) => ({ label: value, value }),
                  )
                "
              />
            </FormItem>
            <FormItem label="严重度" required>
              <Select
                v-model:value="commandForm.severity"
                :options="
                  ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((value) => ({
                    label: value,
                    value,
                  }))
                "
              />
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
                [
                  'APPROVE_SUPPLY_PLAN',
                  'DECIDE_REPLENISHMENT',
                  'CONVERT_REPLENISHMENT',
                  'SELECT_PLAN_SCENARIO',
                  'RELEASE_SUPPLY_PLAN',
                  'ACKNOWLEDGE_INVENTORY_ISSUE',
                  'RESOLVE_INVENTORY_ISSUE',
                ].includes(commandMode)
              "
              label="操作人 ID"
              required
            >
              <Input v-model:value="commandForm.principalId" />
            </FormItem>
            <FormItem
              v-if="commandMode === 'CONVERT_REPLENISHMENT'"
              label="目标类型"
              required
            >
              <Select
                v-model:value="commandForm.targetType"
                :options="conversionTargetOptions"
              />
            </FormItem>
            <template
              v-if="
                commandMode === 'CONVERT_REPLENISHMENT' &&
                commandForm.targetType === transferTargetType
              "
            >
              <FormItem label="经营主体类型" required>
                <Input
                  v-model:value="commandForm.ownerType"
                  placeholder="例如 MERCHANT"
                />
              </FormItem>
              <FormItem label="经营主体 ID" required>
                <Input v-model:value="commandForm.ownerId" />
              </FormItem>
              <FormItem label="来源规范仓库 ID" required>
                <Input v-model:value="commandForm.sourceWarehouseId" />
              </FormItem>
              <FormItem label="目标规范仓库 ID" required>
                <Input v-model:value="commandForm.targetWarehouseId" />
              </FormItem>
            </template>
            <FormItem
              v-if="commandMode === 'CONVERT_REPLENISHMENT'"
              label="下游门禁说明"
            >
              <Input
                disabled
                value="治理提案必须为 READY；采购申请归 Procurement，调拨单归 Warehouse"
              />
            </FormItem>
            <FormItem
              v-if="commandMode === 'CONVERT_REPLENISHMENT'"
              label="执行结果"
            >
              <Input
                disabled
                value="后端返回规范聚合类型、ID、单号、状态和下一等待事件"
              />
            </FormItem>
            <FormItem
              v-if="commandMode === 'DECIDE_REPLENISHMENT'"
              label="决策"
              required
            >
              <Select
                v-model:value="commandForm.decision"
                :options="
                  ['APPROVED', 'REJECTED'].map((value) => ({
                    label: value,
                    value,
                  }))
                "
              />
            </FormItem>
            <FormItem
              v-if="commandMode === 'RESOLVE_INVENTORY_ISSUE'"
              label="解决代码"
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
.supply-tower {
  --workbench-blue: #1677ff;
  --workbench-green: #22a06b;
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
    radial-gradient(circle at 78% 0%, rgb(22 119 255 / 18%), transparent 38%),
    linear-gradient(120deg, rgb(22 119 255 / 9%), transparent 55%);
  border: 1px solid rgb(22 119 255 / 30%);
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
  color: var(--workbench-blue);
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

.metric-card--danger {
  --metric-color: var(--workbench-red);
}

.metric-card--warning {
  --metric-color: var(--workbench-orange);
}

.metric-card--blue {
  --metric-color: var(--workbench-blue);
}

.metric-card--success {
  --metric-color: var(--workbench-green);
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
  width: 280px;
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

.object-cell span,
.quantity-caption {
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

.health-strip {
  display: grid;
  grid-template-columns: 120px minmax(220px, 1fr) auto;
  gap: 20px;
  align-items: center;
  padding: 4px 0 20px;
}

.health-score {
  display: flex;
  flex-direction: column;
}

.health-score span {
  font-size: 12px;
  color: var(--ant-color-text-tertiary);
}

.health-score strong {
  font-size: 24px;
}

.health-progress {
  margin: 0;
}

.health-legend {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--ant-color-text-secondary);
}

.dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  margin-right: 5px;
  border-radius: 50%;
}

.dot--danger {
  background: var(--workbench-red);
}

.dot--warning {
  background: var(--workbench-orange);
}

.dot--blue {
  background: var(--workbench-blue);
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

  .health-strip {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .health-legend {
    flex-wrap: wrap;
  }
}
</style>
