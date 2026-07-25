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
} from 'ant-design-vue';

import { getCloudMoldFulfillmentPage } from '#/api/cloudmold/commerce';
import { getCloudMoldInventoryBalancePage } from '#/api/cloudmold/inventory';
import {
  executeSupplyPlanningCommand,
  getSupplyPlanningWorkItemPage,
} from '#/api/cloudmold/supply-planning';

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
  resolutionCode?: string;
  severity?: string;
  safetyStockQuantity?: number;
  scenarioCode?: string;
  sourceBalanceId?: string;
  targetServiceLevelBasisPoints?: number;
  targetReference?: string;
  targetType?: string;
  uomCode?: string;
  unitCostMinor?: number;
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

const riskRows = computed(() =>
  balances.value
    .map((item) => {
      const available = toNumber(item.availableQuantity);
      let risk = '健康';
      let priority = 4;
      if (item.qualityStatus !== 'QUALIFIED') {
        risk =
          item.qualityStatus === 'PENDING_QC'
            ? '待质检'
            : item.qualityStatus === 'DAMAGED'
              ? '瑕疵库存'
              : '拒收库存';
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
  { dataIndex: 'skuCode', key: 'skuCode', title: 'SKU' },
  { dataIndex: 'warehouseName', key: 'warehouseName', title: '仓库' },
  { dataIndex: 'locationName', key: 'locationName', title: '库位' },
  { dataIndex: 'risk', key: 'risk', title: '风险' },
  { dataIndex: 'available', key: 'available', title: '可用库存' },
  { dataIndex: 'baseUomCode', key: 'baseUomCode', title: '单位' },
];

const workItemColumns = [
  { dataIndex: 'itemType', key: 'itemType', title: '工作项' },
  { dataIndex: 'code', key: 'code', title: '编码 / 类型' },
  { dataIndex: 'relatedRef', key: 'relatedRef', title: '关联对象' },
  { dataIndex: 'status', key: 'status', title: '状态' },
  { dataIndex: 'businessDate', key: 'businessDate', title: '业务日期' },
  { dataIndex: 'aggregateVersion', key: 'aggregateVersion', title: '版本' },
  { key: 'action', title: '操作', width: 300 },
];

const statusColors: Record<string, string> = {
  ACKNOWLEDGED: 'blue',
  APPROVED: 'green',
  COMPLETED: 'green',
  CONVERTED: 'cyan',
  DRAFT: 'default',
  EVALUATED: 'purple',
  OPEN: 'red',
  PROPOSED: 'orange',
  PUBLISHED: 'green',
  REJECTED: 'red',
  RELEASED: 'cyan',
  RESOLVED: 'green',
  SELECTED: 'blue',
};

const capabilityCards = [
  {
    title: '需求预测',
    status: '首批可用',
    description: '支持预测版本、实际销量快照、WAPE/Bias/MAE 回测与事件留痕。',
  },
  {
    title: 'S&OP 供应计划',
    status: '首批可用',
    description:
      '支持预算、产能、MOQ、安全库存多情景测算，并保留求解参数证据。',
  },
  {
    title: '智能补货',
    status: '首批可用',
    description:
      '支持人工决策后受控转换为采购请求或调拨请求，避免跨域直接写单。',
  },
  {
    title: '库存健康',
    status: '首批可用',
    description: '支持版本化规则扫描、重复活动问题抑制和自动库存健康工作项。',
  },
  {
    title: '采购协同',
    status: '部分可用',
    description:
      '当前仅生成受控采购请求意图；真实采购 Adapter、供应商承诺和 OTIF 闭环待补。',
  },
  {
    title: '仓配履约',
    status: '部分可用',
    description: '已有仓网、库存和单包裹履约；波次、多包裹与物流异常待补。',
  },
];

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
    return {
      operation: commandMode.value,
      replenishmentConversion: {
        convertedByPrincipalId: values.principalId,
        expectedVersion,
        recommendationId: aggregateId,
        targetReference: values.targetReference || undefined,
        targetType: values.targetType,
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
  <Page auto-content-height>
    <div class="space-y-4">
      <Alert
        show-icon
        type="info"
        message="供应链控制塔"
        description="统一承接规范库存、履约、需求预测、S&OP 供应计划、补货决策与库存健康工作项；所有操作通过幂等命令、乐观版本和领域事件进入权威数据链。"
      />

      <Alert
        v-if="loadError"
        closable
        show-icon
        type="error"
        :message="loadError"
      />

      <Row :gutter="[16, 16]">
        <Col :lg="6" :sm="12" :xs="24">
          <Card :loading="loading">
            <Statistic title="库存余额记录" :value="balanceTotal" />
          </Card>
        </Col>
        <Col :lg="6" :sm="12" :xs="24">
          <Card :loading="loading">
            <Statistic
              title="缺货 / 低库存"
              :value="stockoutCount + lowStockCount"
            />
          </Card>
        </Col>
        <Col :lg="6" :sm="12" :xs="24">
          <Card :loading="loading">
            <Statistic title="待质检库存" :value="pendingQcCount" />
          </Card>
        </Col>
        <Col :lg="6" :sm="12" :xs="24">
          <Card :loading="loading">
            <Statistic
              title="进行中履约"
              :suffix="`/ ${fulfillmentTotal}`"
              :value="exceptionFulfillmentCount"
            />
          </Card>
        </Col>
      </Row>

      <Card :title="`供应链计划工作项（${workItemTotal}）`">
        <Space class="mb-4" wrap>
          <Button type="primary" @click="openCommand('CREATE_FORECAST')">
            新建需求预测
          </Button>
          <Button @click="openCommand('CREATE_SUPPLY_PLAN')">
            新建 S&OP 计划
          </Button>
          <Button danger @click="openCommand('OPEN_INVENTORY_ISSUE')">
            登记库存健康问题
          </Button>
          <Button
            :disabled="balances.length === 0"
            @click="openCommand('RUN_INVENTORY_HEALTH_SCAN')"
          >
            运行健康规则扫描
          </Button>
          <Button :loading="loading" @click="loadData">刷新</Button>
        </Space>
        <Table
          :columns="workItemColumns"
          :data-source="workItems"
          :loading="loading"
          :pagination="{ pageSize: 10 }"
          row-key="aggregateId"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'status'">
              <Tag :color="statusColors[record.status] ?? 'default'">
                {{ record.status }}
              </Tag>
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
              </Space>
            </template>
          </template>
        </Table>
      </Card>

      <Card title="库存健康">
        <div class="mb-4 flex items-center gap-4">
          <Progress
            class="max-w-md"
            :percent="healthyRate"
            :status="healthyRate >= 80 ? 'success' : 'exception'"
          />
          <Button
            type="primary"
            @click="router.push('/cloudmold/supply-chain/inventory')"
          >
            处理库存
          </Button>
          <Button @click="router.push('/cloudmold/supply-chain/warehouses')">
            查看仓库
          </Button>
        </div>
        <Table
          :columns="riskColumns"
          :data-source="riskRows"
          :loading="loading"
          :pagination="false"
          row-key="balanceId"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'risk'">
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
          </template>
        </Table>
      </Card>

      <Card title="能力闭环">
        <Row :gutter="[16, 16]">
          <Col
            v-for="capability in capabilityCards"
            :key="capability.title"
            :lg="8"
            :md="12"
            :xs="24"
          >
            <Card size="small">
              <div class="mb-2 flex items-center justify-between gap-3">
                <strong>{{ capability.title }}</strong>
                <Tag
                  :color="
                    capability.status === '首批可用'
                      ? 'green'
                      : capability.status === '能力缺口'
                        ? 'red'
                        : 'orange'
                  "
                >
                  {{ capability.status }}
                </Tag>
              </div>
              <div class="text-muted-foreground text-sm">
                {{ capability.description }}
              </div>
            </Card>
          </Col>
        </Row>
      </Card>

      <Modal
        v-model:open="commandOpen"
        :confirm-loading="commandSaving"
        title="供应链计划命令"
        width="720px"
        @ok="submitCommand"
      >
        <Alert
          class="mb-4"
          show-icon
          type="info"
          :message="commandMode"
          description="提交后形成可审计业务状态、操作记录和 Outbox 事件；重复提交由幂等键保护。"
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
                :options="
                  ['PURCHASE_REQUEST', 'TRANSFER_REQUEST'].map((value) => ({
                    label: value,
                    value,
                  }))
                "
              />
            </FormItem>
            <FormItem
              v-if="commandMode === 'CONVERT_REPLENISHMENT'"
              label="目标引用"
            >
              <Input
                v-model:value="commandForm.targetReference"
                placeholder="留空则自动生成受控请求引用"
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
