<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import type { ProcurementAction, ProcurementRow } from './presentation';

import type { CloudMoldProcurementApi } from '#/api/cloudmold/procurement';

import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Empty,
  Input,
  message,
  Modal,
  Progress,
  Row,
  Select,
  Space,
  Statistic,
  Steps,
  Table,
  Tabs,
  Tag,
  Timeline,
} from 'ant-design-vue';

import {
  executePurchaseOrderTransition,
  executeSourcingTransition,
  getPurchaseAward,
  getPurchaseAwardPage,
  getPurchaseOrder,
  getPurchaseOrderPage,
  getPurchaseRequisitionPage,
  getQuotationPage,
  getSourcingEventPage,
  releaseAwardPurchaseOrders,
} from '#/api/cloudmold/procurement';

import {
  canReleaseAwardToPurchaseOrders,
  formatMinorMoney,
  procurementActions,
  procurementRowId,
  procurementStatusMeta,
} from './presentation';

defineOptions({ name: 'CloudMoldProcurement' });

const route = useRoute();
const workspace =
  ref<CloudMoldProcurementApi.ProcurementWorkspace>('REQUISITION');
const rows = ref<ProcurementRow[]>([]);
const loading = ref(false);
const loadError = ref('');
const commandBusyId = ref('');
const keyword = ref('');
const status = ref<string>();
const pageNo = ref(1);
const pageSize = ref(20);
const total = ref(0);
const detailOpen = ref(false);
const detailLoading = ref(false);
const detail = ref<CloudMoldProcurementApi.PurchaseOrderDetail>();
const awardOpen = ref(false);
const awardLoading = ref(false);
const awardDetail = ref<CloudMoldProcurementApi.AwardDetail>();
const releaseOpen = ref(false);
const releaseSubmitting = ref(false);
const releaseResult =
  ref<CloudMoldProcurementApi.ReleasePurchaseOrdersResult>();
const commandOpen = ref(false);
const commandReasonCode = ref('');
const pendingCommand = ref<{
  action: ProcurementAction;
  row: ProcurementRow;
}>();
const releaseCandidate = computed(() =>
  awardDetail.value && canReleaseAwardToPurchaseOrders(awardDetail.value)
    ? awardDetail.value
    : undefined,
);

const workspaces: Array<{
  key: CloudMoldProcurementApi.ProcurementWorkspace;
  label: string;
}> = [
  { key: 'REQUISITION', label: '采购申请' },
  { key: 'RFQ', label: 'RFQ 询价' },
  { key: 'QUOTATION', label: '报价版本' },
  { key: 'AWARD', label: '拆分定标' },
  { key: 'PURCHASE_ORDER', label: '采购订单' },
];

function workspaceFromRoute(): CloudMoldProcurementApi.ProcurementWorkspace {
  if (route.path.endsWith('/purchase-orders')) return 'PURCHASE_ORDER';
  if (route.path.endsWith('/sourcing')) return 'RFQ';
  if (route.path.endsWith('/purchase-requisitions')) return 'REQUISITION';
  return 'REQUISITION';
}

const statusValues: Record<
  CloudMoldProcurementApi.ProcurementWorkspace,
  string[]
> = {
  AWARD: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'],
  PURCHASE_ORDER: [
    'DRAFT',
    'SUBMITTED',
    'APPROVED',
    'RELEASED',
    'DISPATCHED',
    'SUPPLIER_CONFIRMED',
    'CANCELLED',
    'CLOSED',
  ],
  QUOTATION: [],
  REQUISITION: ['APPROVED'],
  RFQ: [
    'DRAFT',
    'PUBLISHED',
    'QUOTING',
    'EVALUATING',
    'AWARD_SUBMITTED',
    'AWARDED',
    'CLOSED',
    'CANCELLED',
  ],
};
const statusOptions = computed(() =>
  statusValues[workspace.value].map((value) => ({
    label: procurementStatusMeta(value).label,
    value,
  })),
);

const currentPagePending = computed(
  () =>
    rows.value.filter((row) => ['DRAFT', 'SUBMITTED'].includes(row.status))
      .length,
);
const currentPageExceptions = computed(
  () =>
    rows.value.filter((row) => ['EXCEPTION', 'REJECTED'].includes(row.status))
      .length,
);
const currentPageInFlight = computed(
  () =>
    rows.value.filter((row) =>
      [
        'APPROVED',
        'DISPATCHED',
        'EVALUATING',
        'PUBLISHED',
        'QUOTING',
        'RELEASED',
      ].includes(row.status),
    ).length,
);
const currentPageClosed = computed(
  () =>
    rows.value.filter((row) =>
      ['AWARDED', 'CLOSED', 'SUPPLIER_CONFIRMED'].includes(row.status),
    ).length,
);

const columns = computed<TableColumnsType>(() => {
  const common = [
    { key: 'document', title: '单据与谱系', width: 260 },
    { key: 'counterparty', title: '业务对象', width: 230 },
    { key: 'scope', title: '范围与金额', width: 210 },
    { key: 'status', title: '状态', width: 130 },
    { dataIndex: 'updatedAt', key: 'updatedAt', title: '更新时间', width: 180 },
    { key: 'action', fixed: 'right' as const, title: '操作', width: 210 },
  ];
  return common;
});

async function loadPage() {
  loading.value = true;
  loadError.value = '';
  const params = {
    pageNo: pageNo.value,
    pageSize: pageSize.value,
    keyword: keyword.value.trim() || undefined,
    status: status.value,
  };
  try {
    const loaders = {
      AWARD: getPurchaseAwardPage,
      PURCHASE_ORDER: getPurchaseOrderPage,
      QUOTATION: getQuotationPage,
      REQUISITION: getPurchaseRequisitionPage,
      RFQ: getSourcingEventPage,
    };
    const result = await loaders[workspace.value](params);
    rows.value = result.list as ProcurementRow[];
    total.value = result.total;
  } catch (error) {
    rows.value = [];
    total.value = 0;
    loadError.value =
      error instanceof Error ? error.message : '采购工作台加载失败';
  } finally {
    loading.value = false;
  }
}

function search() {
  pageNo.value = 1;
  void loadPage();
}

function reset() {
  keyword.value = '';
  status.value = undefined;
  pageNo.value = 1;
  void loadPage();
}

function asProcurementRow(row: Record<string, any>) {
  return row as ProcurementRow;
}

function openCommand(row: ProcurementRow, action: ProcurementAction) {
  pendingCommand.value = { action, row };
  commandReasonCode.value = '';
  commandOpen.value = true;
}

async function runAction(
  row: ProcurementRow,
  action: ProcurementAction,
  reasonCode?: string,
) {
  const id = procurementRowId(workspace.value, row);
  commandBusyId.value = `${id}:${action.operation}`;
  try {
    let result: CloudMoldProcurementApi.CommandResult;
    if (workspace.value === 'PURCHASE_ORDER') {
      result = await executePurchaseOrderTransition({
        operation:
          action.operation as CloudMoldProcurementApi.PurchaseOrderTransitionOperation,
        purchaseOrder: {
          expectedVersion: row.aggregateVersion,
          orderId: id,
          reasonCode,
        },
      });
    } else if (workspace.value === 'AWARD') {
      const award = row as CloudMoldProcurementApi.AwardPageItem;
      result = await executeSourcingTransition({
        awardTransition: {
          awardId: id,
          expectedAwardVersion: award.aggregateVersion,
          expectedEventVersion: award.eventAggregateVersion,
          reasonCode,
        },
        operation:
          action.operation as CloudMoldProcurementApi.SourcingAwardTransitionOperation,
      });
    } else if (workspace.value === 'RFQ') {
      result = await executeSourcingTransition({
        eventTransition: {
          eventId: id,
          expectedVersion: row.aggregateVersion,
          reasonCode,
        },
        operation:
          action.operation as CloudMoldProcurementApi.SourcingEventTransitionOperation,
      });
    } else {
      throw new Error('当前单据没有管理端写入契约');
    }
    message[result.duplicate ? 'warning' : 'success'](
      result.duplicate ? '操作已被幂等处理' : `${action.label}成功`,
    );
    await loadPage();
    return true;
  } catch (error) {
    message.error(
      `${action.label}失败：${error instanceof Error ? error.message : '服务未完成该命令'}`,
    );
    return false;
  } finally {
    commandBusyId.value = '';
  }
}

async function submitCommand() {
  const pending = pendingCommand.value;
  if (!pending) return;
  const reasonCode = commandReasonCode.value.trim();
  if (pending.action.reasonRequired && !reasonCode) {
    message.warning('该操作必须填写原因码');
    return;
  }
  const succeeded = await runAction(
    pending.row,
    pending.action,
    reasonCode || undefined,
  );
  if (succeeded) {
    commandOpen.value = false;
    pendingCommand.value = undefined;
  }
}

async function openOrderById(orderId: string) {
  detailOpen.value = true;
  detailLoading.value = true;
  detail.value = undefined;
  try {
    detail.value = await getPurchaseOrder(orderId);
  } catch (error) {
    message.error(
      error instanceof Error ? error.message : '采购订单详情加载失败',
    );
  } finally {
    detailLoading.value = false;
  }
}

async function openOrder(row: ProcurementRow) {
  if (workspace.value !== 'PURCHASE_ORDER') return;
  await openOrderById(procurementRowId(workspace.value, row));
}

async function openAwardById(awardId: string) {
  awardOpen.value = true;
  awardLoading.value = true;
  awardDetail.value = undefined;
  if (releaseResult.value?.awardId !== awardId) {
    releaseResult.value = undefined;
  }
  try {
    awardDetail.value = await getPurchaseAward(awardId);
  } catch (error) {
    message.error(error instanceof Error ? error.message : '定标详情加载失败');
  } finally {
    awardLoading.value = false;
  }
}

async function openAward(row: ProcurementRow) {
  if (workspace.value !== 'AWARD') return;
  await openAwardById(procurementRowId(workspace.value, row));
}

function openReleaseConfirm() {
  if (!releaseCandidate.value) return;
  releaseOpen.value = true;
}

async function submitAwardRelease() {
  const candidate = releaseCandidate.value;
  if (!candidate) return;
  releaseSubmitting.value = true;
  try {
    const result = await releaseAwardPurchaseOrders(candidate.awardId, {
      expectedAwardVersion: candidate.aggregateVersion,
    });
    releaseResult.value = result;
    message[result.duplicate ? 'warning' : 'success'](
      result.duplicate
        ? '采购订单已存在，已返回当前批准快照生成结果'
        : `已基于批准快照生成 ${result.purchaseOrders.length} 张采购订单`,
    );
    releaseOpen.value = false;
    await Promise.all([loadPage(), openAwardById(candidate.awardId)]);
  } catch (error) {
    message.error(
      `发布采购订单失败：${error instanceof Error ? error.message : '服务未完成该命令'}`,
    );
  } finally {
    releaseSubmitting.value = false;
  }
}

function documentTitle(row: ProcurementRow) {
  if ('requisitionCode' in row && 'requestedByPrincipalId' in row)
    return row.requisitionCode;
  if ('eventCode' in row && 'title' in row) return row.eventCode;
  if ('quotationCode' in row)
    return `${row.quotationCode} · V${row.revisionNumber}`;
  if ('awardCode' in row) return row.awardCode;
  if ('orderCode' in row) return row.orderCode;
  return '-';
}

function documentSubtitle(row: ProcurementRow) {
  if ('requisitionId' in row && 'requestedByPrincipalId' in row)
    return `申请 ${row.requisitionId}`;
  if ('eventId' in row && 'title' in row)
    return `采购申请 ${row.requisitionCode}`;
  if ('quotationId' in row) return `RFQ ${row.eventCode}`;
  if ('awardId' in row && 'eventCode' in row) return `RFQ ${row.eventCode}`;
  if ('orderId' in row)
    return row.awardCode ? `定标 ${row.awardCode}` : '独立采购订单';
  return '-';
}

function counterparty(row: ProcurementRow) {
  if ('supplierId' in row) return `供应商 ${row.supplierId}`;
  if ('supplierCount' in row) return `${row.supplierCount} 家供应商`;
  if ('invitationCount' in row) return `${row.invitationCount} 家已邀供应商`;
  if ('requestedByPrincipalId' in row)
    return `申请人 ${row.requestedByPrincipalId}`;
  return '-';
}

function scope(row: ProcurementRow) {
  if ('grossAmountMinor' in row)
    return formatMinorMoney(row.grossAmountMinor, row.currencyCode);
  if ('awardedQuantity' in row)
    return `${row.lineCount} 行 · ${row.awardedQuantity}`;
  if ('totalRequestedQuantity' in row)
    return `${row.lineCount} 行 · ${row.totalRequestedQuantity} ${row.uomCode}`;
  if ('quotationRevisionCount' in row)
    return `${row.lineCount} 行 · ${row.quotationRevisionCount} 个报价版本`;
  return '-';
}

watch(workspace, () => {
  pageNo.value = 1;
  status.value = undefined;
  void loadPage();
});

onMounted(async () => {
  workspace.value = workspaceFromRoute();
  await loadPage();
  const awardId = route.params.awardId;
  if (typeof awardId === 'string' && awardId) {
    workspace.value = 'AWARD';
    await openAwardById(awardId);
  }
});
</script>

<template>
  <Page
    description="以多行询价、不可变报价版本与拆分定标形成可审计采购来源，并基于批准快照发布规范采购订单。"
    title="寻源与定标"
  >
    <Alert
      class="mb-4"
      description="所有动作直达 CloudMold Procurement 权威聚合；Award → PO 只允许基于批准快照由服务端生成，前端不会猜测主体、税率、估值或交付计划。"
      message="CloudMold 采购权威"
      show-icon
      type="info"
    />

    <Row :gutter="16" class="mb-4" :wrap="true">
      <Col :lg="6" :sm="12" :xs="24">
        <Card class="metric-card">
          <Statistic title="待定标审批" :value="currentPagePending" />
        </Card>
      </Col>
      <Col :lg="6" :sm="12" :xs="24">
        <Card class="metric-card">
          <Statistic title="报价与执行中" :value="currentPageInFlight" />
        </Card>
      </Col>
      <Col :lg="6" :sm="12" :xs="24">
        <Card class="metric-card">
          <Statistic title="评审异常" :value="currentPageExceptions" />
        </Card>
      </Col>
      <Col :lg="6" :sm="12" :xs="24">
        <Card class="metric-card">
          <Statistic title="已定标 / 已发布" :value="currentPageClosed" />
        </Card>
      </Col>
    </Row>

    <Card class="workbench-card">
      <Tabs v-model:active-key="workspace" :items="workspaces" />
      <div class="toolbar">
        <Space wrap>
          <Input
            v-model:value="keyword"
            allow-clear
            placeholder="单据编号、供应商、SKU 或来源编号"
            style="width: 300px"
            @press-enter="search"
          />
          <Select
            v-if="statusOptions.length"
            v-model:value="status"
            allow-clear
            :options="statusOptions"
            placeholder="全部状态"
            style="width: 180px"
          />
          <Button type="primary" @click="search">查询</Button>
          <Button @click="reset">重置</Button>
        </Space>
        <Tag color="blue">强类型行谱系</Tag>
      </div>

      <Alert
        v-if="loadError"
        class="mb-4"
        :message="loadError"
        show-icon
        type="error"
      />
      <Table
        :columns="columns"
        :data-source="rows"
        :loading="loading"
        :pagination="{
          current: pageNo,
          pageSize,
          showSizeChanger: true,
          total,
        }"
        :row-key="(row) => procurementRowId(workspace, row as ProcurementRow)"
        :scroll="{ x: 1200 }"
        @change="
          (pagination) => {
            pageNo = pagination.current ?? 1;
            pageSize = pagination.pageSize ?? 20;
            loadPage();
          }
        "
      >
        <template #emptyText>
          <Empty description="暂无符合条件的规范采购单据" />
        </template>
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'document'">
            <Button
              v-if="workspace === 'PURCHASE_ORDER'"
              class="document-link"
              type="link"
              @click="openOrder(asProcurementRow(record))"
            >
              {{ documentTitle(asProcurementRow(record)) }}
            </Button>
            <Button
              v-else-if="workspace === 'AWARD'"
              class="document-link"
              type="link"
              @click="openAward(asProcurementRow(record))"
            >
              {{ documentTitle(asProcurementRow(record)) }}
            </Button>
            <div v-else class="document-title">
              {{ documentTitle(asProcurementRow(record)) }}
            </div>
            <div class="document-subtitle">
              {{ documentSubtitle(asProcurementRow(record)) }}
            </div>
          </template>
          <template v-else-if="column.key === 'counterparty'">
            <div>{{ counterparty(asProcurementRow(record)) }}</div>
          </template>
          <template v-else-if="column.key === 'scope'">
            <div class="scope-value">{{ scope(asProcurementRow(record)) }}</div>
          </template>
          <template v-else-if="column.key === 'status'">
            <Tag :color="procurementStatusMeta(record.status).color">
              {{ procurementStatusMeta(record.status).label }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space :size="4">
              <Button
                v-if="workspace === 'PURCHASE_ORDER'"
                type="link"
                @click="openOrder(asProcurementRow(record))"
              >
                详情
              </Button>
              <Button
                v-if="workspace === 'AWARD'"
                type="link"
                @click="openAward(asProcurementRow(record))"
              >
                详情
              </Button>
              <Button
                v-for="action in procurementActions(workspace, record.status)"
                :key="action.operation"
                :danger="action.danger"
                :loading="
                  commandBusyId ===
                  `${procurementRowId(workspace, asProcurementRow(record))}:${action.operation}`
                "
                type="link"
                v-access:code="[action.permission]"
                @click="openCommand(asProcurementRow(record), action)"
              >
                {{ action.label }}
              </Button>
              <span v-if="workspace === 'QUOTATION'" class="immutable-note">版本不可变</span>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <Modal
      v-model:open="commandOpen"
      :confirm-loading="Boolean(commandBusyId)"
      :ok-button-props="{
        disabled:
          Boolean(pendingCommand?.action.reasonRequired) &&
          !commandReasonCode.trim(),
      }"
      :ok-text="pendingCommand?.action.label ?? '确认执行'"
      title="确认采购单据操作"
      @ok="submitCommand"
    >
      <Alert
        class="mb-4"
        :message="`将基于聚合版本 ${pendingCommand?.row.aggregateVersion ?? '—'} 执行；版本冲突会被服务端拒绝。`"
        show-icon
        type="warning"
      />
      <Input
        v-model:value="commandReasonCode"
        :placeholder="
          pendingCommand?.action.reasonRequired
            ? '原因码（必填，例如 SUPPLIER_DECLINED）'
            : '原因码（可选）'
        "
      />
    </Modal>

    <Modal
      v-model:open="releaseOpen"
      :confirm-loading="releaseSubmitting"
      ok-text="基于批准快照发布采购订单"
      title="确认发布采购订单"
      @ok="submitAwardRelease"
    >
      <Alert
        v-if="releaseCandidate"
        class="mb-4"
        :message="`将基于 ${releaseCandidate.awardCode} 的批准快照 V${releaseCandidate.aggregateVersion} 生成采购订单。`"
        description="法律主体、税率、估值策略、成本与交付计划全部由服务端快照权威决定，管理端不会提交任何推断字段。"
        show-icon
        type="warning"
      />
    </Modal>

    <Drawer
      v-model:open="detailOpen"
      destroy-on-close
      title="采购订单详情"
      :width="960"
    >
      <div v-if="detailLoading" class="detail-loading">
        正在读取采购订单与履约事实…
      </div>
      <template v-else-if="detail">
        <div class="detail-hero">
          <div>
            <div class="detail-eyebrow">采购订单</div>
            <h2>{{ detail.orderCode }}</h2>
            <p>
              供应商 {{ detail.supplierId }} · {{ detail.lineCount }} 个行项目 ·
              {{ detail.scheduleCount }} 个交期
            </p>
          </div>
          <Tag :color="procurementStatusMeta(detail.status).color">
            {{ procurementStatusMeta(detail.status).label }}
          </Tag>
        </div>
        <Descriptions bordered :column="{ lg: 3, md: 2, xs: 1 }" size="small">
          <Descriptions.Item label="法律主体">
            {{ detail.legalEntityId }}
          </Descriptions.Item>
          <Descriptions.Item label="来源业务">
            {{ detail.sourceBusinessType }} /
            {{ detail.sourceBusinessRef }}
          </Descriptions.Item>
          <Descriptions.Item label="含税总额">
            {{ formatMinorMoney(detail.grossAmountMinor, detail.currencyCode) }}
          </Descriptions.Item>
          <Descriptions.Item label="已收货">
            {{ detail.receivedQuantity }}
          </Descriptions.Item>
          <Descriptions.Item label="已合格">
            {{ detail.qualifiedQuantity }}
          </Descriptions.Item>
          <Descriptions.Item label="聚合版本">
            V{{ detail.aggregateVersion }}
          </Descriptions.Item>
        </Descriptions>
        <Card class="mt-4" title="行项目与交期履约">
          <Table
            :data-source="detail.lines"
            :pagination="false"
            row-key="itemId"
            :scroll="{ x: 1710 }"
            :columns="[
              { dataIndex: 'lineNumber', title: '行号', width: 70 },
              { dataIndex: 'canonicalSkuId', title: '规范 SKU', width: 210 },
              { key: 'valuation', title: '计价策略快照', width: 300 },
              { dataIndex: 'orderedQuantity', title: '订购', width: 100 },
              { dataIndex: 'receivedQuantity', title: '收货', width: 100 },
              { dataIndex: 'qualifiedQuantity', title: '合格', width: 100 },
              { dataIndex: 'returnedQuantity', title: '退供', width: 100 },
              { dataIndex: 'invoicedQuantity', title: '开票', width: 100 },
              { key: 'schedules', title: '交期 / 仓库', width: 280 },
              { key: 'lineage', title: '申请 → 定标 → PO 谱系', width: 280 },
            ]"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'valuation'">
                <div>
                  {{ record.valuationPolicyId }} /
                  {{ record.valuationPolicyVersion }}
                </div>
                <div class="document-subtitle">
                  {{ record.valuationPolicyHash }}
                </div>
              </template>
              <template v-else-if="column.key === 'schedules'">
                <div
                  v-for="schedule in record.schedules"
                  :key="schedule.scheduleId"
                  class="schedule-line"
                >
                  #{{ schedule.scheduleNumber }}
                  {{ schedule.requiredDeliveryDate }} ·
                  {{ schedule.canonicalWarehouseId }} ·
                  {{ schedule.receivedQuantity }}/{{
                    schedule.scheduledQuantity
                  }}
                </div>
              </template>
              <template v-else-if="column.key === 'lineage'">
                <div>PR {{ record.lineage.requisitionLineId }}</div>
                <div class="document-subtitle">
                  Award {{ record.lineage.awardLineId ?? '—' }}
                </div>
                <div class="document-subtitle">
                  PO {{ record.lineage.purchaseOrderItemId ?? record.itemId }}
                </div>
              </template>
            </template>
          </Table>
        </Card>
        <Card class="mt-4" title="状态履历">
          <Timeline
            :items="
              detail.statusHistory.map((item) => ({
                color: 'blue',
                children: `${item.toStatus} · V${item.statusVersion} · ${item.changedAt} · ${item.actorPrincipalId}`,
              }))
            "
          />
        </Card>
      </template>
    </Drawer>

    <Drawer
      v-model:open="awardOpen"
      destroy-on-close
      title="定标详情"
      :width="1040"
    >
      <div v-if="awardLoading" class="detail-loading">
        正在读取定标快照与行级来源证据…
      </div>
      <template v-else-if="awardDetail">
        <div class="detail-hero">
          <div>
            <div class="detail-eyebrow">
              寻源与定标 / {{ awardDetail.eventCode }}
            </div>
            <h2>{{ awardDetail.awardCode }}</h2>
            <p>
              {{ awardDetail.lineCount }} 个申请行 ·
              {{ awardDetail.supplierCount }} 家中选供应商
            </p>
          </div>
          <Tag :color="procurementStatusMeta(awardDetail.status).color">
            {{ procurementStatusMeta(awardDetail.status).label }}
          </Tag>
        </div>

        <Card class="mb-4 lifecycle-card">
          <Steps
            :current="
              awardDetail.status === 'APPROVED'
                ? 4
                : awardDetail.status === 'SUBMITTED'
                  ? 3
                  : 2
            "
            :items="[
              { title: '询价创建' },
              { title: '报价冻结' },
              { title: '提交定标' },
              { title: '定标审批' },
              { title: '定标生效' },
            ]"
            responsive
            size="small"
          />
        </Card>

        <Row :gutter="16" class="mb-4">
          <Col :lg="16" :xs="24">
            <Card title="定标摘要">
              <Descriptions :column="{ lg: 4, md: 2, xs: 1 }" size="small">
                <Descriptions.Item label="币种">
                  {{ awardDetail.currencyCode }}
                </Descriptions.Item>
                <Descriptions.Item label="报价截止">
                  {{ awardDetail.quotationDeadline }}
                </Descriptions.Item>
                <Descriptions.Item label="评审策略">
                  {{ awardDetail.reviewPolicyCode }}
                </Descriptions.Item>
                <Descriptions.Item label="决策原因">
                  {{ awardDetail.decisionReasonCode }}
                </Descriptions.Item>
                <Descriptions.Item label="定标净额">
                  {{
                    formatMinorMoney(
                      awardDetail.awardedNetAmountMinor,
                      awardDetail.currencyCode,
                    )
                  }}
                </Descriptions.Item>
                <Descriptions.Item label="定标税额">
                  {{
                    formatMinorMoney(
                      awardDetail.awardedTaxAmountMinor,
                      awardDetail.currencyCode,
                    )
                  }}
                </Descriptions.Item>
                <Descriptions.Item label="批准含税金额">
                  <strong class="amount-highlight">{{
                    formatMinorMoney(
                      awardDetail.approvedGrossAmountMinor,
                      awardDetail.currencyCode,
                    )
                  }}</strong>
                </Descriptions.Item>
                <Descriptions.Item label="聚合版本">
                  V{{ awardDetail.aggregateVersion }}
                </Descriptions.Item>
                <Descriptions.Item label="寻源事件版本">
                  V{{ awardDetail.eventAggregateVersion }}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
          <Col :lg="8" :xs="24">
            <Card class="audit-card" title="定标证据与审批">
              <p>定标聚合 {{ awardDetail.awardId }}</p>
              <p>审批提交 {{ awardDetail.submittedAt ?? '尚未提交' }}</p>
              <p>已生成采购订单 {{ awardDetail.purchaseOrderCount }} 张</p>
              <Space wrap>
                <Tag color="blue">来源快照冻结</Tag>
                <Tag color="green">幂等已校验</Tag>
                <Tag color="purple">租户已隔离</Tag>
              </Space>
            </Card>
          </Col>
        </Row>

        <Row :gutter="16">
          <Col :lg="17" :xs="24">
            <Card title="定标行与来源快照">
              <template #extra>
                <span class="document-subtitle">申请行 → 报价版本 → 定标行</span>
              </template>
              <Table
                :data-source="awardDetail.lines"
                :pagination="false"
                row-key="awardLineId"
                :scroll="{ x: 1100 }"
                :columns="[
                  { dataIndex: 'lineNumber', title: '行', width: 60 },
                  {
                    dataIndex: 'canonicalSkuId',
                    title: '申请行 / 规范 SKU',
                    width: 220,
                  },
                  { key: 'quantity', title: '定标数量', width: 120 },
                  {
                    key: 'quotation',
                    title: '报价版本 / 单价',
                    width: 180,
                  },
                  { dataIndex: 'score', title: '评分', width: 90 },
                  { key: 'amount', title: '定标金额', width: 150 },
                  {
                    key: 'supplier',
                    title: '供应商 / 交期',
                    width: 220,
                  },
                ]"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'quantity'">
                    {{ record.awardedQuantity }} {{ record.uomCode }}
                  </template>
                  <template v-else-if="column.key === 'quotation'">
                    V{{ record.quotationRevisionNumber }} ·
                    {{ record.unitNetPriceMinor }}
                  </template>
                  <template v-else-if="column.key === 'amount'">
                    {{
                      formatMinorMoney(
                        record.awardedGrossAmountMinor,
                        awardDetail.currencyCode,
                      )
                    }}
                  </template>
                  <template v-else-if="column.key === 'supplier'">
                    <div>{{ record.supplierId }}</div>
                    <div class="document-subtitle">
                      {{ record.promisedDeliveryDate }}
                    </div>
                  </template>
                </template>
              </Table>
            </Card>
          </Col>
          <Col :lg="7" :xs="24">
            <Card title="采购订单生成">
              <Statistic
                title="已生成采购订单"
                :value="awardDetail.purchaseOrderCount"
                suffix="张"
              />
              <Progress
                class="mt-4"
                :percent="awardDetail.status === 'APPROVED' ? 100 : 60"
              />
              <Alert
                class="mt-4"
                description="只有批准且尚未生成采购订单的定标快照才能触发正式发布；采购订单头、行和交期全部由服务端快照权威生成。"
                message="生成边界"
                show-icon
                type="info"
              />
              <Button
                v-if="releaseCandidate"
                class="mt-4 w-full"
                type="primary"
                v-access:code="['cloudmold:procurement:award:release']"
                @click="openReleaseConfirm"
              >
                基于批准快照发布采购订单
              </Button>
              <Alert
                v-else-if="
                  awardDetail.status === 'APPROVED' &&
                  awardDetail.purchaseOrderCount > 0
                "
                class="mt-4"
                description="该批准快照已经生成采购订单，不允许重复猜测或补写。"
                message="快照已收口"
                show-icon
                type="success"
              />
              <template v-if="releaseResult">
                <Card
                  class="mt-4 release-result-card"
                  size="small"
                  title="最近一次发布结果"
                >
                  <div class="release-result-meta">
                    <div>操作 {{ releaseResult.operationId }}</div>
                    <div>定标版本 V{{ releaseResult.awardVersion }}</div>
                    <div>状态 {{ releaseResult.status }}</div>
                    <Tag
                      :color="releaseResult.duplicate ? 'warning' : 'success'"
                    >
                      {{ releaseResult.duplicate ? '幂等重复' : '新生成' }}
                    </Tag>
                  </div>
                  <div
                    v-for="purchaseOrder in releaseResult.purchaseOrders"
                    :key="purchaseOrder.orderId"
                    class="release-order"
                  >
                    <Button
                      class="document-link"
                      type="link"
                      @click="openOrderById(purchaseOrder.orderId)"
                    >
                      {{ purchaseOrder.orderCode }}
                    </Button>
                    <div>{{ purchaseOrder.supplierId }}</div>
                    <div class="document-subtitle">
                      {{ purchaseOrder.lineCount }} 行 ·
                      {{
                        formatMinorMoney(
                          purchaseOrder.grossAmountMinor,
                          purchaseOrder.currencyCode,
                        )
                      }}
                    </div>
                    <Tag
                      :color="procurementStatusMeta(purchaseOrder.status).color"
                    >
                      {{ procurementStatusMeta(purchaseOrder.status).label }}
                    </Tag>
                  </div>
                </Card>
              </template>
            </Card>
          </Col>
        </Row>
      </template>
    </Drawer>
  </Page>
</template>

<style scoped>
.metric-card {
  margin-bottom: 8px;
  border-radius: 12px;
}

.workbench-card {
  border-radius: 12px;
}

.toolbar {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.document-title,
.scope-value {
  font-weight: 600;
  color: hsl(var(--primary));
}

.document-link {
  height: auto;
  padding: 0;
  font-weight: 600;
}

.document-subtitle,
.immutable-note,
.schedule-line {
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.detail-loading {
  padding: 64px 0;
  color: hsl(var(--muted-foreground));
  text-align: center;
}

.detail-hero {
  display: flex;
  gap: 24px;
  align-items: flex-start;
  justify-content: space-between;
  padding: 4px 0 20px;
}

.detail-hero h2 {
  margin: 4px 0;
  font-size: 24px;
  font-weight: 700;
}

.detail-hero p {
  margin: 0;
  color: hsl(var(--muted-foreground));
}

.detail-eyebrow {
  font-size: 12px;
  font-weight: 600;
  color: hsl(var(--primary));
}

.audit-card {
  min-height: 170px;
  color: hsl(var(--muted));
  background: hsl(var(--foreground));
}

.audit-card :deep(.ant-card-head-title) {
  color: hsl(var(--background));
}

.amount-highlight {
  color: hsl(var(--primary));
}

.lifecycle-card {
  padding-block: 8px;
}

.schedule-line + .schedule-line {
  margin-top: 6px;
}

.release-result-card {
  border-radius: 12px;
}

.release-result-meta {
  display: grid;
  gap: 8px;
  margin-bottom: 12px;
}

.release-order {
  padding: 12px 0;
  border-top: 1px solid hsl(var(--border));
}

.release-order:first-of-type {
  border-top: 0;
}

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .detail-hero {
    flex-direction: column;
  }
}
</style>
