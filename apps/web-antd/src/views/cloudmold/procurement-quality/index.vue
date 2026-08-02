<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import type { CloudMoldProcurementQualityApi } from '#/api/cloudmold/procurement-quality';

import { computed, onMounted, reactive, ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page } from '@vben/common-ui';

import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Drawer,
  Empty,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Progress,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Timeline,
} from 'ant-design-vue';

import {
  completeProcurementReceiptInspection,
  getProcurementReceiptInspection,
  getProcurementReceiptInspectionPage,
  recordProcurementReceiptInspectionResult,
} from '#/api/cloudmold/procurement-quality';

import {
  canCompleteInspection,
  canRecordInspectionResult,
  dispositionSummary,
  finalDecisionMeta,
  formatDecimalQuantity,
  inspectionStatusMeta,
  undecidedQuantity,
} from './presentation';

defineOptions({ name: 'CloudMoldProcurementQuality' });

const { hasAccessByCodes } = useAccess();
const canCommand = computed(() =>
  hasAccessByCodes([
    'cloudmold:quality:procurement-receipt-inspection:command',
  ]),
);

const rows = ref<CloudMoldProcurementQualityApi.PageItem[]>([]);
const loading = ref(false);
const loadError = ref('');
const pageNo = ref(1);
const pageSize = ref(20);
const total = ref(0);
const status = ref<string>();
const receiptId = ref('');
const purchaseOrderId = ref('');
const supplierId = ref('');

const detailOpen = ref(false);
const detailLoading = ref(false);
const detail = ref<CloudMoldProcurementQualityApi.Detail>();
const completeBusy = ref(false);

const decisionOpen = ref(false);
const decisionBusy = ref(false);
const selectedLineId = ref<string>();
const selectedSplitId = ref<string>();
const decisionForm = reactive({
  acceptedDispositionCode: 'ACCEPT',
  acceptedQuantity: '0',
  decisionEvidenceSha256: '',
  defectAffectedQuantity: '0',
  defectCategory: '',
  defectCode: '',
  defectEvidenceRef: '',
  defectEvidenceSha256: '',
  defectSeverity: 'MINOR' as 'CRITICAL' | 'MAJOR' | 'MINOR',
  evidenceRef: '',
  quarantineDispositionCode: 'QUARANTINE',
  quarantinedQuantity: '0',
  rejectedDispositionCode: 'RETURN_TO_SUPPLIER',
  rejectedQuantity: '0',
  sampledQuantity: '0',
});

const statusOptions = [
  'OPEN',
  'IN_PROGRESS',
  'PARTIALLY_COMPLETED',
  'READY_TO_COMPLETE',
  'COMPLETED',
].map((value) => ({ label: inspectionStatusMeta(value).label, value }));

const columns: TableColumnsType = [
  { key: 'document', title: '检验单 / 收货单', width: 230 },
  { key: 'purchase', title: '采购订单 / 供应商', width: 230 },
  { key: 'quantity', title: '收货 / 取样', width: 170 },
  { key: 'disposition', title: '合格 / 拒收 / 隔离', width: 240 },
  { key: 'status', title: '检验状态', width: 140 },
  { key: 'decision', title: '终判', width: 130 },
  { dataIndex: 'updatedAt', key: 'updatedAt', title: '更新时间', width: 180 },
  { key: 'action', fixed: 'right', title: '操作', width: 190 },
];

const pendingSampling = computed(
  () => rows.value.filter((item) => item.status === 'OPEN').length,
);
const pendingReview = computed(
  () => rows.value.filter((item) => item.status === 'READY_TO_COMPLETE').length,
);
const quarantined = computed(
  () =>
    rows.value.filter(
      (item) =>
        item.quarantinedQuantity !== '0' &&
        item.quarantinedQuantity !== '0.000000',
    ).length,
);
const completed = computed(
  () => rows.value.filter((item) => item.status === 'COMPLETED').length,
);

const selectedLine = computed(() =>
  detail.value?.lines.find(
    (line) => line.inspectionLineId === selectedLineId.value,
  ),
);
const selectedSplit = computed(() =>
  selectedLine.value?.splits.find(
    (split) => split.inspectionSplitId === selectedSplitId.value,
  ),
);
const lineOptions = computed(
  () =>
    detail.value?.lines.map((line) => ({
      label: `行 ${line.lineNumber} · ${line.canonicalSkuId}`,
      value: line.inspectionLineId,
    })) ?? [],
);
const splitOptions = computed(
  () =>
    selectedLine.value?.splits.map((split) => ({
      label: `批次 ${split.splitNumber} · ${split.locationId} · ${formatDecimalQuantity(split.receivedQuantity, split.uomCode)}`,
      value: split.inspectionSplitId,
    })) ?? [],
);

async function loadPage() {
  loading.value = true;
  loadError.value = '';
  try {
    const result = await getProcurementReceiptInspectionPage({
      pageNo: pageNo.value,
      pageSize: pageSize.value,
      purchaseOrderId: purchaseOrderId.value.trim() || undefined,
      receiptId: receiptId.value.trim() || undefined,
      status: status.value,
      supplierId: supplierId.value.trim() || undefined,
    });
    rows.value = result.list;
    total.value = result.total;
  } catch (error) {
    rows.value = [];
    total.value = 0;
    loadError.value =
      error instanceof Error ? error.message : '质检工作台加载失败';
  } finally {
    loading.value = false;
  }
}

function search() {
  pageNo.value = 1;
  void loadPage();
}

function reset() {
  receiptId.value = '';
  purchaseOrderId.value = '';
  supplierId.value = '';
  status.value = undefined;
  search();
}

async function openDetail(
  item: CloudMoldProcurementQualityApi.PageItem | Record<string, any>,
) {
  const inspection = item as CloudMoldProcurementQualityApi.PageItem;
  detailOpen.value = true;
  detailLoading.value = true;
  detail.value = undefined;
  try {
    detail.value = await getProcurementReceiptInspection(
      inspection.inspectionId,
    );
  } catch (error) {
    message.error(
      error instanceof Error ? error.message : '检验单详情加载失败',
    );
  } finally {
    detailLoading.value = false;
  }
}

function selectLine(lineId: unknown) {
  if (typeof lineId !== 'string') return;
  selectedLineId.value = lineId;
  selectedSplitId.value = selectedLine.value?.splits[0]?.inspectionSplitId;
  seedDecisionQuantities();
}

function seedDecisionQuantities() {
  const split = selectedSplit.value;
  if (!split) return;
  decisionForm.acceptedQuantity = undecidedQuantity(split);
  decisionForm.rejectedQuantity = '0';
  decisionForm.quarantinedQuantity = '0';
  decisionForm.sampledQuantity = '0';
}

async function openDecision(
  item?: CloudMoldProcurementQualityApi.PageItem | Record<string, any>,
) {
  if (item) await openDetail(item);
  if (!detail.value) return;
  const line =
    detail.value.lines.find((candidate) =>
      candidate.splits.some((split) => undecidedQuantity(split) !== '0'),
    ) ?? detail.value.lines[0];
  if (!line) {
    message.warning('该检验单没有可判定的收货行');
    return;
  }
  selectedLineId.value = line.inspectionLineId;
  selectedSplitId.value =
    line.splits.find((split) => undecidedQuantity(split) !== '0')
      ?.inspectionSplitId ?? line.splits[0]?.inspectionSplitId;
  decisionForm.decisionEvidenceSha256 = '';
  decisionForm.evidenceRef = '';
  decisionForm.defectCode = '';
  decisionForm.defectCategory = '';
  decisionForm.defectEvidenceSha256 = '';
  decisionForm.defectEvidenceRef = '';
  decisionForm.defectAffectedQuantity = '0';
  seedDecisionQuantities();
  decisionOpen.value = true;
}

function rowDisposition(record: Record<string, any>) {
  return dispositionSummary(record as CloudMoldProcurementQualityApi.PageItem);
}

async function submitDecision() {
  if (!detail.value || !selectedLine.value || !selectedSplit.value) return;
  if (!/^[0-9a-f]{64}$/.test(decisionForm.decisionEvidenceSha256)) {
    message.error('判定证据 SHA-256 必须为 64 位小写十六进制');
    return;
  }
  const hasDefect = Boolean(decisionForm.defectCode.trim());
  if (hasDefect && !/^[0-9a-f]{64}$/.test(decisionForm.defectEvidenceSha256)) {
    message.error('缺陷证据 SHA-256 必须为 64 位小写十六进制');
    return;
  }
  decisionBusy.value = true;
  try {
    const result = await recordProcurementReceiptInspectionResult({
      acceptedDispositionCode:
        decisionForm.acceptedQuantity === '0'
          ? undefined
          : decisionForm.acceptedDispositionCode,
      acceptedQuantity: decisionForm.acceptedQuantity,
      decisionEvidenceSha256: decisionForm.decisionEvidenceSha256,
      defects: hasDefect
        ? [
            {
              affectedQuantity: decisionForm.defectAffectedQuantity,
              defectCategory: decisionForm.defectCategory,
              defectCode: decisionForm.defectCode,
              evidenceRef: decisionForm.defectEvidenceRef || undefined,
              evidenceSha256: decisionForm.defectEvidenceSha256,
              severity: decisionForm.defectSeverity,
            },
          ]
        : [],
      evidenceRef: decisionForm.evidenceRef || undefined,
      expectedInspectionVersion: detail.value.version,
      expectedLineVersion: selectedLine.value.version,
      expectedSplitVersion: selectedSplit.value.version,
      inspectionId: detail.value.inspectionId,
      inspectionLineId: selectedLine.value.inspectionLineId,
      inspectionSplitId: selectedSplit.value.inspectionSplitId,
      quarantineDispositionCode:
        decisionForm.quarantinedQuantity === '0'
          ? undefined
          : decisionForm.quarantineDispositionCode,
      quarantinedQuantity: decisionForm.quarantinedQuantity,
      rejectedDispositionCode:
        decisionForm.rejectedQuantity === '0'
          ? undefined
          : decisionForm.rejectedDispositionCode,
      rejectedQuantity: decisionForm.rejectedQuantity,
      sampledQuantity: decisionForm.sampledQuantity,
    });
    message[result.duplicate ? 'warning' : 'success'](
      result.duplicate
        ? '该判定已被幂等处理'
        : '质检判定已写入质量、库存与仓储事实',
    );
    decisionOpen.value = false;
    detail.value = await getProcurementReceiptInspection(
      detail.value.inspectionId,
    );
    await loadPage();
  } catch (error) {
    message.error(error instanceof Error ? error.message : '质检判定失败');
  } finally {
    decisionBusy.value = false;
  }
}

async function completeReview() {
  if (!detail.value) return;
  completeBusy.value = true;
  try {
    const result = await completeProcurementReceiptInspection(
      detail.value.inspectionId,
      detail.value.version,
    );
    message[result.duplicate ? 'warning' : 'success'](
      result.duplicate ? '该复核已被幂等处理' : '独立复核完成',
    );
    detail.value = await getProcurementReceiptInspection(
      detail.value.inspectionId,
    );
    await loadPage();
  } catch (error) {
    message.error(error instanceof Error ? error.message : '独立复核失败');
  } finally {
    completeBusy.value = false;
  }
}

onMounted(loadPage);
</script>

<template>
  <Page
    description="按收货行与批次冻结检验标准，逐批判定后由不同人员完成独立复核。"
    title="来料质检处置"
  >
    <Alert
      class="mb-4"
      description="合格、拒收和隔离处置会在同一业务事务中更新 Warehouse 与 Inventory；任何一方失败都会整笔回滚。"
      message="CloudMold 质量权威"
      show-icon
      type="info"
    />

    <Row :gutter="16" class="mb-4" :wrap="true">
      <Col :lg="6" :sm="12" :xs="24">
        <Card><Statistic title="待取样批次" :value="pendingSampling" /></Card>
      </Col>
      <Col :lg="6" :sm="12" :xs="24">
        <Card><Statistic title="待独立复核" :value="pendingReview" /></Card>
      </Col>
      <Col :lg="6" :sm="12" :xs="24">
        <Card><Statistic title="含隔离处置" :value="quarantined" /></Card>
      </Col>
      <Col :lg="6" :sm="12" :xs="24">
        <Card><Statistic title="本页已完成" :value="completed" /></Card>
      </Col>
    </Row>

    <Card class="workbench-card">
      <div class="toolbar">
        <Space wrap>
          <Input
            v-model:value="receiptId"
            allow-clear
            placeholder="收货单 ID"
            style="width: 210px"
            @press-enter="search"
          />
          <Input
            v-model:value="purchaseOrderId"
            allow-clear
            placeholder="采购订单 ID"
            style="width: 210px"
            @press-enter="search"
          />
          <Input
            v-model:value="supplierId"
            allow-clear
            placeholder="供应商 ID"
            style="width: 190px"
            @press-enter="search"
          />
          <Select
            v-model:value="status"
            allow-clear
            :options="statusOptions"
            placeholder="全部检验状态"
            style="width: 170px"
          />
          <Button type="primary" @click="search">查询</Button>
          <Button @click="reset">重置</Button>
        </Space>
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
          total,
          showSizeChanger: true,
        }"
        row-key="inspectionId"
        :scroll="{ x: 1500 }"
        @change="
          (pagination) => {
            pageNo = pagination.current ?? 1;
            pageSize = pagination.pageSize ?? 20;
            loadPage();
          }
        "
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'document'">
            <Button type="link" class="cell-link" @click="openDetail(record)">
              {{ record.inspectionCode }}
            </Button>
            <div class="subtle">{{ record.receiptId }}</div>
          </template>
          <template v-else-if="column.key === 'purchase'">
            <div>{{ record.purchaseOrderId }}</div>
            <div class="subtle">供应商 {{ record.supplierId }}</div>
          </template>
          <template v-else-if="column.key === 'quantity'">
            <div>{{ formatDecimalQuantity(record.receivedQuantity) }}</div>
            <div class="subtle">
              取样 {{ formatDecimalQuantity(record.sampledQuantity) }}
            </div>
          </template>
          <template v-else-if="column.key === 'disposition'">
            <div>{{ rowDisposition(record) }}</div>
            <Progress
              :percent="
                record.receivedQuantity === '0'
                  ? 0
                  : record.status === 'COMPLETED'
                    ? 100
                    : record.status === 'READY_TO_COMPLETE'
                      ? 90
                      : record.status === 'OPEN'
                        ? 10
                        : 55
              "
              :show-info="false"
              size="small"
              style="max-width: 180px"
            />
          </template>
          <template v-else-if="column.key === 'status'">
            <Tag :color="inspectionStatusMeta(record.status).color">
              {{ inspectionStatusMeta(record.status).label }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'decision'">
            <Tag :color="finalDecisionMeta(record.finalDecision).color">
              {{ finalDecisionMeta(record.finalDecision).label }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" @click="openDetail(record)">查看</Button>
              <Button
                v-if="canCommand && canRecordInspectionResult(record.status)"
                type="link"
                @click="openDecision(record)"
              >
                判定
              </Button>
              <Button
                v-if="canCommand && canCompleteInspection(record.status)"
                type="link"
                @click="openDetail(record)"
              >
                复核
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <Drawer
      v-model:open="detailOpen"
      destroy-on-close
      title="来料质检完整事实"
      width="980"
    >
      <div v-if="detailLoading" class="drawer-loading">正在读取检验单…</div>
      <template v-else-if="detail">
        <Space class="mb-4" wrap>
          <Tag :color="inspectionStatusMeta(detail.status).color">
            {{ inspectionStatusMeta(detail.status).label }}
          </Tag>
          <Tag :color="finalDecisionMeta(detail.finalDecision).color">
            {{ finalDecisionMeta(detail.finalDecision).label }}
          </Tag>
          <Button
            v-if="canCommand && canRecordInspectionResult(detail.status)"
            type="primary"
            @click="openDecision()"
          >
            记录判定
          </Button>
          <Popconfirm
            v-if="canCommand && canCompleteInspection(detail.status)"
            description="服务端会核验复核人与所有判定人相互独立。"
            title="确认完成独立复核？"
            @confirm="completeReview"
          >
            <Button :loading="completeBusy" type="primary">完成独立复核</Button>
          </Popconfirm>
        </Space>
        <Descriptions bordered :column="2" size="small">
          <Descriptions.Item label="检验单">
            {{ detail.inspectionCode }}
          </Descriptions.Item>
          <Descriptions.Item label="收货单">
            {{ detail.receiptId }}
          </Descriptions.Item>
          <Descriptions.Item label="采购订单">
            {{ detail.purchaseOrderId }}
          </Descriptions.Item>
          <Descriptions.Item label="供应商">
            {{ detail.supplierId }}
          </Descriptions.Item>
          <Descriptions.Item label="检验标准">
            {{ detail.standardId }} · V{{ detail.standardVersion }}
          </Descriptions.Item>
          <Descriptions.Item label="标准快照">
            {{ detail.standardVersionId }}
          </Descriptions.Item>
          <Descriptions.Item label="标准内容 SHA-256" :span="2">
            {{ detail.standardContentSha256 }}
          </Descriptions.Item>
          <Descriptions.Item label="创建人">
            {{ detail.createdByPrincipalId }}
          </Descriptions.Item>
          <Descriptions.Item label="最近判定人">
            {{ detail.lastDecisionActorPrincipalId ?? '—' }}
          </Descriptions.Item>
          <Descriptions.Item label="复核人">
            {{ detail.completedByPrincipalId ?? '—' }}
          </Descriptions.Item>
          <Descriptions.Item label="数量处置">
            {{ dispositionSummary(detail) }}
          </Descriptions.Item>
        </Descriptions>

        <Divider>检验行与批次</Divider>
        <Card
          v-for="line in detail.lines"
          :key="line.inspectionLineId"
          class="mb-3"
          size="small"
        >
          <div class="line-title">
            行 {{ line.lineNumber }} · {{ line.canonicalSkuId }}
          </div>
          <div class="subtle mb-2">
            PO Item {{ line.itemId }} · 交期 {{ line.scheduleId }} ·
            {{ line.valuationPolicy }} / {{ line.valuationPolicyVersion }}
          </div>
          <div class="subtle mb-2">
            冻结单价 {{ line.unitCostAmountMinor }} {{ line.currencyCode }} ·
            计价快照 {{ line.valuationPolicyHash }}
          </div>
          <Table
            :columns="[
              { dataIndex: 'splitNumber', title: '批次', width: 70 },
              { dataIndex: 'locationId', title: '收货库位' },
              { dataIndex: 'lotId', title: 'Lot' },
              { key: 'received', title: '收货数量' },
              { key: 'result', title: '合格 / 拒收 / 隔离' },
              { key: 'splitStatus', title: '状态' },
            ]"
            :data-source="line.splits"
            :pagination="false"
            row-key="inspectionSplitId"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'received'">
                {{
                  formatDecimalQuantity(record.receivedQuantity, record.uomCode)
                }}
              </template>
              <template v-else-if="column.key === 'result'">
                {{ record.acceptedQuantity }} / {{ record.rejectedQuantity }} /
                {{ record.quarantinedQuantity }}
              </template>
              <template v-else-if="column.key === 'splitStatus'">
                <Tag>
                  {{ inspectionStatusMeta(record.status).label }}
                </Tag>
              </template>
            </template>
          </Table>
        </Card>

        <Divider>不可变判定批次</Divider>
        <Empty
          v-if="detail.resultBatches.length === 0"
          description="尚无判定批次"
        />
        <Timeline v-else>
          <Timeline.Item
            v-for="batch in [...detail.resultBatches].reverse()"
            :key="batch.resultBatchId"
          >
            <strong>决策 V{{ batch.decisionVersion }}</strong> ·
            {{ batch.actorPrincipalId }} · {{ batch.occurredAt }}
            <div class="subtle">
              操作 {{ batch.operationId }} ·
              {{ batch.splits.length }} 个批次处置
            </div>
            <Table
              class="mt-2"
              :columns="[
                { key: 'split', title: '检验行 / 批次', width: 180 },
                { key: 'quantity', title: '合格 / 拒收 / 隔离', width: 210 },
                { key: 'evidence', title: '质量与财务证据', width: 320 },
                {
                  key: 'lineage',
                  title: 'Warehouse / Inventory 入账',
                  width: 390,
                },
              ]"
              :data-source="batch.splits"
              :pagination="false"
              row-key="resultSplitId"
              :scroll="{ x: 1100 }"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'split'">
                  <div>{{ record.inspectionLineId }}</div>
                  <div class="subtle">{{ record.inspectionSplitId }}</div>
                </template>
                <template v-else-if="column.key === 'quantity'">
                  <div>
                    {{ formatDecimalQuantity(record.acceptedQuantity) }} /
                    {{ formatDecimalQuantity(record.rejectedQuantity) }} /
                    {{ formatDecimalQuantity(record.quarantinedQuantity) }}
                  </div>
                  <div class="subtle">
                    取样 {{ formatDecimalQuantity(record.sampledQuantity) }}
                  </div>
                </template>
                <template v-else-if="column.key === 'evidence'">
                  <div>Quality {{ record.qualityDecisionId }}</div>
                  <div class="subtle">
                    Finance 收货
                    {{ record.financeReceiptEvidenceId ?? '—' }}
                  </div>
                  <div class="subtle">
                    Finance 质量 {{ record.financeQualityEvidenceId ?? '—' }}
                  </div>
                </template>
                <template v-else-if="column.key === 'lineage'">
                  <div
                    v-if="
                      formatDecimalQuantity(record.acceptedQuantity) !== '0'
                    "
                  >
                    合格·W {{ record.acceptedWarehouseOperationId }} · I
                    {{ record.acceptedInventoryOperationId }} · TX
                    {{ record.acceptedLedgerTransactionId }}
                    <div class="subtle">
                      Finance
                      {{ record.acceptedFinanceInventoryEvidenceId ?? '—' }}
                    </div>
                  </div>
                  <div
                    v-if="
                      formatDecimalQuantity(record.rejectedQuantity) !== '0'
                    "
                  >
                    拒收·W {{ record.rejectedWarehouseOperationId }} · I
                    {{ record.rejectedInventoryOperationId }} · TX
                    {{ record.rejectedLedgerTransactionId }}
                    <div class="subtle">
                      Finance
                      {{ record.rejectedFinanceInventoryEvidenceId ?? '—' }}
                    </div>
                  </div>
                  <div
                    v-if="
                      formatDecimalQuantity(record.quarantinedQuantity) !== '0'
                    "
                  >
                    隔离·W {{ record.quarantinedWarehouseOperationId }} · I
                    {{ record.quarantinedInventoryOperationId }} · TX
                    {{ record.quarantinedLedgerTransactionId }}
                    <div class="subtle">
                      Finance
                      {{ record.quarantinedFinanceInventoryEvidenceId ?? '—' }}
                    </div>
                  </div>
                </template>
              </template>
            </Table>
          </Timeline.Item>
        </Timeline>
      </template>
      <Empty v-else description="未读取到检验单" />
    </Drawer>

    <Modal
      v-model:open="decisionOpen"
      :confirm-loading="decisionBusy"
      ok-text="提交判定"
      title="记录批次质检判定"
      width="760"
      @ok="submitDecision"
    >
      <Alert
        class="mb-4"
        message="数量以十进制定点字符串提交；合格、拒收、隔离之和不得超过批次未判定数量。"
        show-icon
        type="warning"
      />
      <Form layout="vertical">
        <Row :gutter="16">
          <Col :span="12">
            <Form.Item label="检验行" required>
              <Select
                :options="lineOptions"
                :value="selectedLineId"
                @change="selectLine"
              />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item label="收货批次" required>
              <Select
                v-model:value="selectedSplitId"
                :options="splitOptions"
                @change="seedDecisionQuantities"
              />
            </Form.Item>
          </Col>
        </Row>
        <Alert
          v-if="selectedSplit"
          class="mb-4"
          :message="`当前未判定：${formatDecimalQuantity(undecidedQuantity(selectedSplit), selectedSplit.uomCode)}`"
          type="info"
        />
        <Row :gutter="16">
          <Col :span="6">
            <Form.Item label="取样数量" required>
              <Input v-model:value="decisionForm.sampledQuantity" />
            </Form.Item>
          </Col>
          <Col :span="6">
            <Form.Item label="合格数量" required>
              <Input v-model:value="decisionForm.acceptedQuantity" />
            </Form.Item>
          </Col>
          <Col :span="6">
            <Form.Item label="拒收数量" required>
              <Input v-model:value="decisionForm.rejectedQuantity" />
            </Form.Item>
          </Col>
          <Col :span="6">
            <Form.Item label="隔离数量" required>
              <Input v-model:value="decisionForm.quarantinedQuantity" />
            </Form.Item>
          </Col>
        </Row>
        <Row :gutter="16">
          <Col :span="8">
            <Form.Item label="合格处置">
              <Select
                v-model:value="decisionForm.acceptedDispositionCode"
                :options="
                  ['ACCEPT', 'CONDITIONAL_ACCEPT'].map((value) => ({ value }))
                "
              />
            </Form.Item>
          </Col>
          <Col :span="8">
            <Form.Item label="拒收处置">
              <Select
                v-model:value="decisionForm.rejectedDispositionCode"
                :options="
                  ['RETURN_TO_SUPPLIER', 'REJECT', 'REWORK', 'SCRAP'].map(
                    (value) => ({ value }),
                  )
                "
              />
            </Form.Item>
          </Col>
          <Col :span="8">
            <Form.Item label="隔离处置">
              <Select
                v-model:value="decisionForm.quarantineDispositionCode"
                :options="
                  ['QUARANTINE', 'HOLD', 'REWORK'].map((value) => ({ value }))
                "
              />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="判定证据 SHA-256" required>
          <Input
            v-model:value="decisionForm.decisionEvidenceSha256"
            :maxlength="64"
          />
        </Form.Item>
        <Form.Item label="判定证据引用">
          <Input
            v-model:value="decisionForm.evidenceRef"
            placeholder="受控附件或检验报告引用"
          />
        </Form.Item>
        <Divider>缺陷（可选）</Divider>
        <Row :gutter="16">
          <Col :span="8">
            <Form.Item label="缺陷编码">
              <Input v-model:value="decisionForm.defectCode" />
            </Form.Item>
          </Col>
          <Col :span="8">
            <Form.Item label="缺陷类别">
              <Input v-model:value="decisionForm.defectCategory" />
            </Form.Item>
          </Col>
          <Col :span="8">
            <Form.Item label="严重度">
              <Select
                v-model:value="decisionForm.defectSeverity"
                :options="
                  ['MINOR', 'MAJOR', 'CRITICAL'].map((value) => ({ value }))
                "
              />
            </Form.Item>
          </Col>
        </Row>
        <Row :gutter="16">
          <Col :span="8">
            <Form.Item label="影响数量">
              <Input v-model:value="decisionForm.defectAffectedQuantity" />
            </Form.Item>
          </Col>
          <Col :span="16">
            <Form.Item label="缺陷证据 SHA-256">
              <Input
                v-model:value="decisionForm.defectEvidenceSha256"
                :maxlength="64"
              />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="缺陷证据引用">
          <Input v-model:value="decisionForm.defectEvidenceRef" />
        </Form.Item>
      </Form>
    </Modal>
  </Page>
</template>

<style scoped>
.workbench-card :deep(.ant-card-body) {
  padding-top: 18px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 18px;
}

.cell-link {
  height: auto;
  padding: 0;
  font-weight: 600;
}

.subtle {
  font-size: 12px;
  color: #98a2b3;
}

.line-title {
  font-size: 14px;
  font-weight: 600;
  color: #172033;
}

.drawer-loading {
  padding: 40px 0;
  color: #667085;
  text-align: center;
}
</style>
