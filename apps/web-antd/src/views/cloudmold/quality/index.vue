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
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
} from 'ant-design-vue';

import { getCloudMoldAfterSalePage } from '#/api/cloudmold/commerce';
import { getCloudMoldInventoryBalancePage } from '#/api/cloudmold/inventory';
import {
  executeQualityCommand,
  getQualityWorkItemPage,
} from '#/api/cloudmold/quality';

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

const columns = [
  { dataIndex: 'skuCode', key: 'skuCode', title: 'SKU' },
  { dataIndex: 'warehouseName', key: 'warehouseName', title: '仓库' },
  { dataIndex: 'locationName', key: 'locationName', title: '库位' },
  { dataIndex: 'qualityStatus', key: 'qualityStatus', title: '质量状态' },
  { dataIndex: 'quantity', key: 'quantity', title: '在手数量' },
  { dataIndex: 'lotCode', key: 'lotCode', title: '批次' },
];

const workItemColumns = [
  { dataIndex: 'itemType', key: 'itemType', title: '工作项' },
  { dataIndex: 'code', key: 'code', title: '编码 / 级别 / 优先级' },
  { dataIndex: 'relatedRef', key: 'relatedRef', title: '关联对象' },
  { dataIndex: 'status', key: 'status', title: '状态' },
  { dataIndex: 'dueDate', key: 'dueDate', title: '到期日' },
  { dataIndex: 'aggregateVersion', key: 'aggregateVersion', title: '版本' },
  { key: 'action', title: '操作', width: 300 },
];

const statusColors: Record<string, string> = {
  ACTIVE: 'green',
  ASSIGNED: 'blue',
  COMPLETED: 'green',
  CONFLICTED: 'red',
  CREATED: 'default',
  DECIDED: 'purple',
  DRAFT: 'default',
  IN_PROGRESS: 'processing',
  OPEN: 'red',
  PUBLISHED: 'green',
  RECHECK_REQUIRED: 'orange',
  REVOKED: 'red',
  VERIFIED: 'green',
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
  <Page auto-content-height>
    <div class="space-y-4">
      <Alert
        show-icon
        type="info"
        message="鉴别质检中心"
        description="鉴别标准版本、鉴别师资质、质检任务状态机与 CAPA 已进入独立业务 SoR，并与规范库存、售后事实和 Outbox 数据链联动。"
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
            <Statistic title="待质检库存" :value="pendingTotal" />
          </Card>
        </Col>
        <Col :lg="6" :sm="12" :xs="24">
          <Card :loading="loading">
            <Statistic title="瑕疵库存" :value="damagedTotal" />
          </Card>
        </Col>
        <Col :lg="6" :sm="12" :xs="24">
          <Card :loading="loading">
            <Statistic title="拒收库存" :value="rejectedTotal" />
          </Card>
        </Col>
        <Col :lg="6" :sm="12" :xs="24">
          <Card :loading="loading">
            <Statistic title="售后质检关联单" :value="afterSaleTotal" />
          </Card>
        </Col>
      </Row>

      <Card :title="`鉴别质检工作项（${workItemTotal}）`">
        <Space class="mb-4" wrap>
          <Button type="primary" @click="openCommand('CREATE_STANDARD')">
            新建鉴别标准
          </Button>
          <Button @click="openCommand('CERTIFY_AUTHENTICATOR')">
            认证鉴别师
          </Button>
          <Button @click="openCommand('CREATE_INSPECTION_TASK')">
            创建质检任务
          </Button>
          <Button danger @click="openCommand('OPEN_CAPA')"> 发起 CAPA </Button>
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
              </Space>
            </template>
          </template>
        </Table>
      </Card>

      <Card title="质量库存待办">
        <div class="mb-4 flex gap-3">
          <Button
            type="primary"
            @click="router.push('/cloudmold/supply-chain/inventory')"
          >
            进入库存作业
          </Button>
          <Button @click="router.push('/cloudmold/buyer-journey/aftersales')">
            查看退货质检
          </Button>
        </div>
        <Table
          v-if="qualityRows.length"
          :columns="columns"
          :data-source="qualityRows"
          :loading="loading"
          :pagination="{ pageSize: 10 }"
          row-key="balanceId"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'qualityStatus'">
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
          </template>
        </Table>
        <Empty
          v-else
          description="暂无质量库存待办"
          :image="simpleEmptyImage"
        />
      </Card>

      <Card title="质量能力地图">
        <Row :gutter="[16, 16]">
          <Col
            v-for="item in [
              [
                '鉴别标准版本',
                '已支持品牌/品类/SKU 适用范围、内容哈希、审批与不可变版本',
              ],
              ['鉴定师资质', '已支持等级、证据、有效期、冲突校验与撤销'],
              [
                '质检任务中心',
                '已支持分派、开检、证据、判定、复检和完整状态历史',
              ],
              [
                '质量事件与 CAPA',
                '已支持失败任务触发、根因、责任、截止日和效果验证',
              ],
              [
                '批次召回联动',
                '已支持召回动作登记、认领与解决；Lot 冻结、渠道下架和通知 Adapter 待接入',
              ],
              ['质量 KPI 数据链', '准确率、漏检率、时效、人效、覆盖率与成本'],
            ]"
            :key="item[0]"
            :lg="8"
            :md="12"
            :xs="24"
          >
            <Card size="small">
              <div class="mb-2 flex items-center justify-between">
                <strong>{{ item[0] }}</strong>
                <Tag
                  :color="
                    item[0].includes('召回') || item[0].includes('KPI')
                      ? 'orange'
                      : 'green'
                  "
                >
                  {{
                    item[0].includes('召回') || item[0].includes('KPI')
                      ? '持续建设'
                      : '首批可用'
                  }}
                </Tag>
              </div>
              <div class="text-muted-foreground text-sm">{{ item[1] }}</div>
            </Card>
          </Col>
        </Row>
      </Card>

      <Modal
        v-model:open="commandOpen"
        :confirm-loading="commandSaving"
        title="鉴别质检命令"
        width="720px"
        @ok="submitCommand"
      >
        <Alert
          class="mb-4"
          show-icon
          type="info"
          :message="commandMode"
          description="证据只接收内容哈希或受限存储引用；命令提交后写入状态历史和领域事件。"
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
