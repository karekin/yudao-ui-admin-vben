<script lang="ts" setup>
import type { CloudMoldFinanceApi } from '#/api/cloudmold/finance';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Empty,
  Form,
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

import { buildCommandEnvelopeWithRunId } from '#/api/cloudmold/command-helpers';
import {
  createReconciliationRun,
  getReconciliationLine,
  getReconciliationLinePage,
  getReconciliationRun,
  getReconciliationRunPage,
} from '#/api/cloudmold/finance';

import StatusTag from '../../shared/status-tag.vue';

defineOptions({ name: 'CloudMoldFinanceReconciliation' });

const runRows = ref<CloudMoldFinanceApi.ReconciliationRunPageItem[]>([]);
const lineRows = ref<CloudMoldFinanceApi.ReconciliationLinePageItem[]>([]);
const loading = ref(false);
const loadError = ref('');
const runsTotal = ref(0);
const lineTotal = ref(0);
const runPageNo = ref(1);
const linePageNo = ref(1);
const pageSize = ref(20);
const activeRun = ref<CloudMoldFinanceApi.ReconciliationRunDetail>();
const activeRunLoading = ref(false);
const detailOpen = ref(false);
const detailLoading = ref(false);
const detail = ref<CloudMoldFinanceApi.ReconciliationLineDetail>();
const runOpen = ref(false);
const runLoading = ref(false);

const filters = reactive({
  currencyCode: '',
  keyword: '',
  legalEntityId: '',
  lineKeyword: '',
  lineType: undefined as string | undefined,
  matchStatus: undefined as string | undefined,
  runStatus: undefined as string | undefined,
});

const runForm = reactive({
  currencyCode: 'CNY',
  legalEntityId: '',
});

const lineTypeOptions = [
  { label: '全部主题', value: undefined },
  { label: 'QUALIFIED_RECEIPT', value: 'QUALIFIED_RECEIPT' },
  { label: 'SUPPLIER_RETURN', value: 'SUPPLIER_RETURN' },
  { label: 'SUPPLIER_INVOICE', value: 'SUPPLIER_INVOICE' },
];

const matchStatusOptions = [
  { label: '全部结果', value: undefined },
  { label: 'MATCHED', value: 'MATCHED' },
  { label: 'DIFFERENT', value: 'DIFFERENT' },
  { label: 'MISSING', value: 'MISSING' },
  { label: 'UNCOMPARABLE', value: 'UNCOMPARABLE' },
];

const summary = computed(() => ({
  different: activeRun.value?.differentCount ?? 0,
  matched: activeRun.value?.matchedCount ?? 0,
  missing: activeRun.value?.missingCount ?? 0,
  uncomparable: activeRun.value?.uncomparableCount ?? 0,
}));

function resultMeta(status: string) {
  if (status === 'MATCHED') return { color: 'success', label: status };
  if (status === 'DIFFERENT') return { color: 'warning', label: status };
  if (status === 'MISSING') return { color: 'error', label: status };
  if (status === 'UNCOMPARABLE') return { color: 'default', label: status };
  return { color: 'processing', label: status };
}

function formatDecimal(value?: string) {
  if (value === undefined || value === null || value === '') return '—';
  return String(value).replace(/(\.\d*?[1-9])0+$|\.0+$/, '$1');
}

async function loadRuns() {
  loading.value = true;
  loadError.value = '';
  try {
    const result = await getReconciliationRunPage({
      currencyCode: filters.currencyCode.trim() || undefined,
      keyword: filters.keyword.trim() || undefined,
      legalEntityId: filters.legalEntityId.trim() || undefined,
      pageNo: runPageNo.value,
      pageSize: pageSize.value,
      status: filters.runStatus,
    });
    runRows.value = result.list;
    runsTotal.value = result.total;
    const nextRunId = activeRun.value?.runId ?? result.list[0]?.runId;
    if (nextRunId) {
      await loadRunDetail(nextRunId);
    } else {
      activeRun.value = undefined;
      lineRows.value = [];
      lineTotal.value = 0;
    }
  } catch (error) {
    loadError.value =
      error instanceof Error ? error.message : '三账对账运行加载失败';
    runRows.value = [];
    lineRows.value = [];
    runsTotal.value = 0;
    lineTotal.value = 0;
    activeRun.value = undefined;
  } finally {
    loading.value = false;
  }
}

async function loadRunDetail(runId: string) {
  activeRunLoading.value = true;
  try {
    activeRun.value = await getReconciliationRun(runId);
    await loadLines();
  } catch (error) {
    message.error(
      error instanceof Error ? error.message : '对账运行详情加载失败',
    );
  } finally {
    activeRunLoading.value = false;
  }
}

async function loadLines() {
  if (!activeRun.value) return;
  const result = await getReconciliationLinePage({
    keyword: filters.lineKeyword.trim() || undefined,
    lineType: filters.lineType,
    matchStatus: filters.matchStatus,
    pageNo: linePageNo.value,
    pageSize: pageSize.value,
    runId: activeRun.value.runId,
  });
  lineRows.value = result.list;
  lineTotal.value = result.total;
}

function search() {
  runPageNo.value = 1;
  linePageNo.value = 1;
  void loadRuns();
}

function reset() {
  filters.currencyCode = '';
  filters.keyword = '';
  filters.legalEntityId = '';
  filters.lineKeyword = '';
  filters.lineType = undefined;
  filters.matchStatus = undefined;
  filters.runStatus = undefined;
  runPageNo.value = 1;
  linePageNo.value = 1;
  void loadRuns();
}

function changeLinePage(page: number, size: number) {
  linePageNo.value = page;
  pageSize.value = size;
  void loadLines();
}

async function openDetail(
  line: CloudMoldFinanceApi.ReconciliationLinePageItem,
) {
  if (!activeRun.value) return;
  detailOpen.value = true;
  detailLoading.value = true;
  detail.value = undefined;
  try {
    detail.value = await getReconciliationLine(
      activeRun.value.runId,
      line.lineId,
    );
  } catch (error) {
    message.error(error instanceof Error ? error.message : '差异详情加载失败');
  } finally {
    detailLoading.value = false;
  }
}

function openRunModal() {
  runOpen.value = true;
}

async function runReconciliation() {
  runLoading.value = true;
  try {
    const envelope = buildCommandEnvelopeWithRunId();
    await createReconciliationRun({
      correlationId: envelope.correlationId,
      currencyCode: runForm.currencyCode.trim(),
      idempotencyKey: envelope.idempotencyKey,
      legalEntityId: runForm.legalEntityId.trim(),
      occurredAt: envelope.occurredAt,
      runId: envelope.runId,
    });
    message.success('冻结对账已提交');
    runOpen.value = false;
    await loadRuns();
  } catch (error) {
    message.error(error instanceof Error ? error.message : '冻结对账失败');
  } finally {
    runLoading.value = false;
  }
}

watch(
  () => activeRun.value?.runId,
  () => {
    linePageNo.value = 1;
  },
);

onMounted(() => {
  void loadRuns();
});
</script>

<template>
  <Page
    description="按冻结水位比较采购事实、库存事实与财务事实，差异直接落到责任域并保留独立权威快照。"
    title="采购—库存—财务三账对账"
  >
    <Alert
      class="mb-4"
      message="采购、库存与财务治理"
      description="本页只调用 Procure Inventory Finance Reconciliation 正式契约；差异分类、缺证据和不可比较都由服务端冻结。"
      show-icon
      type="info"
    />

    <Row :gutter="16" class="mb-4">
      <Col :lg="6" :sm="12" :xs="24">
        <Card><Statistic title="一致" :value="summary.matched" /></Card>
      </Col>
      <Col :lg="6" :sm="12" :xs="24">
        <Card><Statistic title="存在差异" :value="summary.different" /></Card>
      </Col>
      <Col :lg="6" :sm="12" :xs="24">
        <Card><Statistic title="证据缺失" :value="summary.missing" /></Card>
      </Col>
      <Col :lg="6" :sm="12" :xs="24">
        <Card>
          <Statistic title="不可比较" :value="summary.uncomparable" />
        </Card>
      </Col>
    </Row>

    <Card class="mb-4">
      <Space wrap>
        <Input
          v-model:value="filters.keyword"
          allow-clear
          placeholder="运行号 / 采购单 / 来源行"
          style="width: 300px"
          @press-enter="search"
        />
        <Input
          v-model:value="filters.legalEntityId"
          allow-clear
          placeholder="法主体"
          style="width: 180px"
          @press-enter="search"
        />
        <Input
          v-model:value="filters.currencyCode"
          allow-clear
          placeholder="币种"
          style="width: 120px"
          @press-enter="search"
        />
        <Select
          v-model:value="filters.lineType"
          allow-clear
          :options="lineTypeOptions"
          placeholder="对账主题"
          style="width: 180px"
        />
        <Select
          v-model:value="filters.matchStatus"
          allow-clear
          :options="matchStatusOptions"
          placeholder="结果状态"
          style="width: 180px"
        />
        <Button type="primary" @click="search">查询</Button>
        <Button @click="reset">重置</Button>
        <Button
          v-access:code="[
            'cloudmold:finance:procure-to-pay:reconciliation:command',
          ]"
          type="primary"
          @click="openRunModal"
        >
          运行冻结对账
        </Button>
      </Space>
    </Card>

    <Card title="冻结对账结果">
      <template #extra>
        <Space>
          <Tag color="green">独立权威快照</Tag>
          <Tag v-if="activeRun">{{ activeRun.runCode }}</Tag>
        </Space>
      </template>
      <Alert
        v-if="loadError"
        class="mb-4"
        :message="loadError"
        show-icon
        type="error"
      />
      <Table
        :data-source="lineRows"
        :loading="loading || activeRunLoading"
        :pagination="{
          current: linePageNo,
          pageSize,
          showSizeChanger: true,
          total: lineTotal,
        }"
        row-key="lineId"
        :scroll="{ x: 1600 }"
        @change="
          (pagination) =>
            changeLinePage(pagination.current ?? 1, pagination.pageSize ?? 20)
        "
      >
        <template #emptyText><Empty description="暂无冻结对账结果" /></template>
        <Table.Column key="subject" title="对账主题" width="240">
          <template #default="{ record }">
            <div class="font-medium text-primary">{{ record.lineKey }}</div>
            <div class="text-xs text-muted-foreground">
              {{ record.lineType }}
            </div>
          </template>
        </Table.Column>
        <Table.Column key="procurement" title="采购事实" width="190">
          <template #default="{ record }">
            <div>{{ record.purchaseOrderId ?? '—' }}</div>
            <div class="text-xs text-muted-foreground">
              {{ formatDecimal(record.procurementQuantity) }}
            </div>
          </template>
        </Table.Column>
        <Table.Column key="inventory" title="库存事实" width="190">
          <template #default="{ record }">
            <div>
              {{ record.receiptLineId ?? record.inventoryMovementId ?? '—' }}
            </div>
            <div class="text-xs text-muted-foreground">
              {{ formatDecimal(record.inventoryQuantity) }}
            </div>
          </template>
        </Table.Column>
        <Table.Column key="finance" title="财务事实" width="190">
          <template #default="{ record }">
            <div>{{ record.supplierInvoiceLineId ?? '—' }}</div>
            <div class="text-xs text-muted-foreground">
              {{ formatDecimal(record.financeQuantity) }}
            </div>
          </template>
        </Table.Column>
        <Table.Column key="qty" title="数量差异" width="140">
          <template #default="{ record }">
            {{ formatDecimal(record.quantityDifference) }}
          </template>
        </Table.Column>
        <Table.Column key="amount" title="金额差异 / 水位" width="180">
          <template #default="{ record }">
            <div>{{ record.amountDifferenceMinor ?? '—' }}</div>
            <div class="text-xs text-muted-foreground">
              {{
                activeRun?.watermarks[0]?.maxObservedAt?.slice(11, 16) ?? '—'
              }}
            </div>
          </template>
        </Table.Column>
        <Table.Column key="difference" title="差异分类" width="150">
          <template #default="{ record }">
            {{ record.primaryDifferenceCode ?? '一致' }}
          </template>
        </Table.Column>
        <Table.Column key="result" title="结果" width="140">
          <template #default="{ record }">
            <StatusTag v-bind="resultMeta(record.matchStatus)" />
          </template>
        </Table.Column>
        <Table.Column key="domain" title="责任域" width="120">
          <template #default="{ record }">
            {{ record.responsibilityDomain ?? '—' }}
          </template>
        </Table.Column>
        <Table.Column key="action" title="操作" width="100" fixed="right">
          <template #default="{ record }">
            <Button
              v-access:code="[
                'cloudmold:finance:procure-to-pay:reconciliation:query',
              ]"
              size="small"
              type="link"
              @click="openDetail(record)"
            >
              追溯
            </Button>
          </template>
        </Table.Column>
      </Table>
    </Card>

    <Modal
      v-model:open="runOpen"
      :confirm-loading="runLoading"
      title="运行冻结对账"
      width="560"
      @ok="runReconciliation"
    >
      <Form layout="vertical">
        <Form.Item label="法主体 ID" required>
          <Input v-model:value="runForm.legalEntityId" />
        </Form.Item>
        <Form.Item label="币种" required>
          <Input v-model:value="runForm.currencyCode" />
        </Form.Item>
      </Form>
    </Modal>

    <Drawer
      v-model:open="detailOpen"
      :title="detail ? `${detail.lineKey} · ${detail.matchStatus}` : '差异详情'"
      width="900"
    >
      <template v-if="detailLoading">
        <Card loading />
      </template>
      <template v-else-if="detail">
        <Descriptions :column="2" bordered size="small">
          <Descriptions.Item label="采购事实">
            {{ detail.purchaseOrderId ?? '—' }} /
            {{ detail.purchaseOrderItemId ?? '—' }}
          </Descriptions.Item>
          <Descriptions.Item label="库存事实">
            {{ detail.receiptLineId ?? detail.inventoryMovementId ?? '—' }}
          </Descriptions.Item>
          <Descriptions.Item label="财务事实">
            {{
              detail.supplierInvoiceId ?? detail.supplierInvoiceLineId ?? '—'
            }}
          </Descriptions.Item>
          <Descriptions.Item label="AP / 凭证">
            {{ detail.apOpenItemId ?? '—' }} /
            {{ detail.journalEntryId ?? '—' }}
          </Descriptions.Item>
          <Descriptions.Item label="结果">
            <StatusTag v-bind="resultMeta(detail.matchStatus)" />
          </Descriptions.Item>
          <Descriptions.Item label="差异数">
            {{ detail.differenceCount }}
          </Descriptions.Item>
          <Descriptions.Item label="主差异码">
            {{ detail.primaryDifferenceCode ?? '—' }}
          </Descriptions.Item>
          <Descriptions.Item label="责任域">
            {{ detail.responsibilityDomain ?? '—' }}
          </Descriptions.Item>
          <Descriptions.Item label="数量差异">
            {{ formatDecimal(detail.quantityDifference) }}
          </Descriptions.Item>
          <Descriptions.Item label="金额差异">
            {{ detail.amountDifferenceMinor ?? '—' }}
          </Descriptions.Item>
        </Descriptions>

        <Card class="mt-4" title="差异明细">
          <Table
            :data-source="detail.differences"
            :pagination="false"
            row-key="differenceId"
            size="small"
          >
            <Table.Column
              key="differenceCode"
              data-index="differenceCode"
              title="差异码"
            />
            <Table.Column
              key="sourceDomain"
              data-index="sourceDomain"
              title="来源域"
              width="140"
            />
            <Table.Column
              key="expectedValue"
              data-index="expectedValue"
              title="期望值"
            />
            <Table.Column
              key="actualValue"
              data-index="actualValue"
              title="实际值"
            />
            <Table.Column key="blocking" title="阻断">
              <template #default="{ record }">
                <Tag :color="record.blocking ? 'red' : 'default'">
                  {{ record.blocking ? '阻断' : '提示' }}
                </Tag>
              </template>
            </Table.Column>
          </Table>
        </Card>
      </template>
    </Drawer>
  </Page>
</template>
