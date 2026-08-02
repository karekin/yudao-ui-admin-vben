<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import type { CloudMoldWarehouseProcurementApi } from '#/api/cloudmold/warehouse-procurement';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import { useAccess } from '@vben/access';
import { Page } from '@vben/common-ui';

import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Descriptions,
  Divider,
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
  Tabs,
  Tag,
} from 'ant-design-vue';

import {
  getProcurementPutaway,
  getProcurementPutawayPage,
  getProcurementReceipt,
  getProcurementReceiptPage,
  getProcurementReceiptProgress,
  putawayProcurementReceipt,
  recordPartialProcurementReceipt,
} from '#/api/cloudmold/warehouse-procurement';

import {
  canPutawayLine,
  canRecordReceipt,
  formatQuantity,
  inboundStatusMeta,
  receiptDispositionSummary,
  remainingPutawayQuantity,
  remainingReceivableQuantity,
} from './presentation';

defineOptions({ name: 'CloudMoldProcurementInbound' });

const { hasAccessByCodes } = useAccess();
const canCommand = computed(() =>
  hasAccessByCodes(['cloudmold:warehouse:command']),
);

const rows = ref<CloudMoldWarehouseProcurementApi.ReceiptPageItem[]>([]);
const putawayRows = ref<CloudMoldWarehouseProcurementApi.PutawayPageItem[]>([]);
const loading = ref(false);
const loadError = ref('');
const pageNo = ref(1);
const pageSize = ref(20);
const total = ref(0);
const procurementOrderId = ref('');
const receiptId = ref('');
const supplierId = ref('');
const warehouseId = ref('');
const status = ref<string>();
const workspace = ref<'PUTAWAY' | 'RECEIPT'>('RECEIPT');

const putawayDetailOpen = ref(false);
const putawayDetailLoading = ref(false);
const putawayDetail = ref<CloudMoldWarehouseProcurementApi.PutawayDetail>();

const detailOpen = ref(false);
const detailLoading = ref(false);
const detail = ref<CloudMoldWarehouseProcurementApi.ReceiptDetail>();

const receiveOpen = ref(false);
const receiveBusy = ref(false);
const progressLoading = ref(false);
const progress = ref<CloudMoldWarehouseProcurementApi.ReceiptProgress>();
const receiveForm = reactive({
  procurementOrderId: '',
  receiptNo: '',
  remark: '',
});
const selectedAsnLineIds = ref<string[]>([]);
const receiveQuantities = reactive<Record<string, string>>({});
const receiveLots = reactive<Record<string, string>>({});

const putawayOpen = ref(false);
const putawayBusy = ref(false);
const selectedReceiptLineIds = ref<string[]>([]);
const putawayQuantities = reactive<Record<string, string>>({});
const targetLocationIds = reactive<Record<string, string>>({});

const receiptStatusOptions = [
  'PENDING_QUALITY',
  'PARTIAL_QUALITY_DECIDED',
  'QUALITY_ACCEPTED',
  'QUALITY_REJECTED',
  'QUALITY_QUARANTINED',
  'QUALITY_MIXED',
  'PARTIALLY_PUTAWAY',
  'PUTAWAY_COMPLETED',
].map((value) => ({ label: inboundStatusMeta(value).label, value }));
const putawayStatusOptions = ['COMPLETED'].map((value) => ({
  label: inboundStatusMeta(value).label,
  value,
}));
const statusOptions = computed(() =>
  workspace.value === 'RECEIPT' ? receiptStatusOptions : putawayStatusOptions,
);
const workspaceOptions = [
  { key: 'RECEIPT', label: '收货单' },
  { key: 'PUTAWAY', label: '上架批次' },
];

const columns: TableColumnsType = [
  { key: 'receipt', title: '收货单 / ASN', width: 230 },
  { key: 'purchase', title: '采购订单 / 供应商', width: 250 },
  { key: 'quantity', title: '收货 / 待检', width: 190 },
  { dataIndex: 'status', key: 'status', title: '收货状态', width: 150 },
  { dataIndex: 'warehouseId', key: 'warehouseId', title: '仓库', width: 170 },
  { dataIndex: 'createdAt', key: 'createdAt', title: '收货时间', width: 180 },
  { key: 'action', fixed: 'right', title: '操作', width: 190 },
];

const putawayColumns: TableColumnsType = [
  { key: 'putaway', title: '上架批次', width: 230 },
  { key: 'receipt', title: '收货单 / 采购订单', width: 280 },
  { key: 'party', title: '供应商 / 仓库', width: 260 },
  { dataIndex: 'lineCount', key: 'lineCount', title: '行数', width: 90 },
  {
    dataIndex: 'totalPutawayQuantity',
    key: 'quantity',
    title: '上架数量',
    width: 140,
  },
  { dataIndex: 'status', key: 'status', title: '状态', width: 120 },
  { dataIndex: 'createdAt', key: 'createdAt', title: '上架时间', width: 180 },
  { key: 'action', fixed: 'right', title: '操作', width: 100 },
];

const pendingQuality = computed(
  () => rows.value.filter((item) => item.status === 'PENDING_QUALITY').length,
);
const putawayReady = computed(
  () =>
    rows.value.filter((item) =>
      ['PARTIALLY_PUTAWAY', 'QUALITY_ACCEPTED', 'QUALITY_MIXED'].includes(
        item.status,
      ),
    ).length,
);
const putawayCompleted = computed(
  () => rows.value.filter((item) => item.status === 'PUTAWAY_COMPLETED').length,
);
const exceptions = computed(
  () =>
    rows.value.filter((item) =>
      ['QUALITY_QUARANTINED', 'QUALITY_REJECTED'].includes(item.status),
    ).length,
);

const receivableLines = computed(
  () =>
    progress.value?.lines.filter(
      (line) => remainingReceivableQuantity(line) !== '0',
    ) ?? [],
);
const putawayLines = computed(
  () => detail.value?.lines.filter(canPutawayLine) ?? [],
);

function toggleSelection(values: string[], value: string, checked: boolean) {
  if (checked && !values.includes(value)) values.push(value);
  if (!checked) {
    const index = values.indexOf(value);
    if (index !== -1) values.splice(index, 1);
  }
}

async function loadPage() {
  loading.value = true;
  loadError.value = '';
  try {
    if (workspace.value === 'RECEIPT') {
      const result = await getProcurementReceiptPage({
        pageNo: pageNo.value,
        pageSize: pageSize.value,
        procurementOrderId: procurementOrderId.value.trim() || undefined,
        receiptId: receiptId.value.trim() || undefined,
        status: status.value,
        supplierId: supplierId.value.trim() || undefined,
        warehouseId: warehouseId.value.trim() || undefined,
      });
      rows.value = result.list;
      total.value = result.total;
    } else {
      const result = await getProcurementPutawayPage({
        pageNo: pageNo.value,
        pageSize: pageSize.value,
        procurementOrderId: procurementOrderId.value.trim() || undefined,
        receiptId: receiptId.value.trim() || undefined,
        status: status.value,
        warehouseId: warehouseId.value.trim() || undefined,
      });
      putawayRows.value = result.list;
      total.value = result.total;
    }
  } catch (error) {
    if (workspace.value === 'RECEIPT') rows.value = [];
    else putawayRows.value = [];
    total.value = 0;
    loadError.value =
      error instanceof Error
        ? error.message
        : workspace.value === 'RECEIPT'
          ? '采购收货工作台加载失败'
          : '上架批次加载失败';
  } finally {
    loading.value = false;
  }
}

function changePage(pagination: { current?: number; pageSize?: number }) {
  pageNo.value = pagination.current ?? 1;
  pageSize.value = pagination.pageSize ?? 20;
  void loadPage();
}

function search() {
  pageNo.value = 1;
  void loadPage();
}

function reset() {
  procurementOrderId.value = '';
  receiptId.value = '';
  supplierId.value = '';
  warehouseId.value = '';
  status.value = undefined;
  search();
}

async function openDetail(
  item: CloudMoldWarehouseProcurementApi.ReceiptPageItem | Record<string, any>,
) {
  const receipt = item as CloudMoldWarehouseProcurementApi.ReceiptPageItem;
  detailOpen.value = true;
  detailLoading.value = true;
  detail.value = undefined;
  try {
    detail.value = await getProcurementReceipt(receipt.receiptId);
  } catch (error) {
    message.error(
      error instanceof Error ? error.message : '收货单详情加载失败',
    );
  } finally {
    detailLoading.value = false;
  }
}

async function openPutawayDetail(
  item: CloudMoldWarehouseProcurementApi.PutawayPageItem | Record<string, any>,
) {
  const putaway = item as CloudMoldWarehouseProcurementApi.PutawayPageItem;
  putawayDetailOpen.value = true;
  putawayDetailLoading.value = true;
  putawayDetail.value = undefined;
  try {
    putawayDetail.value = await getProcurementPutaway(putaway.putawayId);
  } catch (error) {
    message.error(
      error instanceof Error ? error.message : '上架批次详情加载失败',
    );
  } finally {
    putawayDetailLoading.value = false;
  }
}

function openReceive() {
  progress.value = undefined;
  selectedAsnLineIds.value = [];
  receiveForm.procurementOrderId = procurementOrderId.value;
  receiveForm.receiptNo = '';
  receiveForm.remark = '';
  receiveOpen.value = true;
}

async function loadProgress() {
  const poId = receiveForm.procurementOrderId.trim();
  if (!poId) {
    message.warning('请先输入采购订单 ID');
    return;
  }
  progressLoading.value = true;
  try {
    progress.value = await getProcurementReceiptProgress(poId);
    selectedAsnLineIds.value = receivableLines.value.map(
      (line) => line.asnLineId,
    );
    receivableLines.value.forEach((line) => {
      receiveQuantities[line.asnLineId] = remainingReceivableQuantity(line);
      receiveLots[line.asnLineId] = '';
    });
  } catch (error) {
    progress.value = undefined;
    message.error(
      error instanceof Error ? error.message : '采购订单收货进度加载失败',
    );
  } finally {
    progressLoading.value = false;
  }
}

async function submitReceive() {
  if (!progress.value) return;
  const selected = receivableLines.value.filter((line) =>
    selectedAsnLineIds.value.includes(line.asnLineId),
  );
  if (!receiveForm.receiptNo.trim() || selected.length === 0) {
    message.warning('请填写收货单号并至少选择一条实际收货行');
    return;
  }
  receiveBusy.value = true;
  try {
    const result = await recordPartialProcurementReceipt({
      lines: selected.map((asnLine) => ({
        asnLine,
        lotId: receiveLots[asnLine.asnLineId] || undefined,
        receivedQuantity: receiveQuantities[asnLine.asnLineId] ?? '0',
      })),
      progress: progress.value,
      receiptNo: receiveForm.receiptNo.trim(),
      remark: receiveForm.remark.trim() || undefined,
    });
    message[result.duplicate ? 'warning' : 'success'](
      result.duplicate
        ? '该收货批次已被幂等处理'
        : '分批收货已登记并写入待检库存',
    );
    receiveOpen.value = false;
    await loadPage();
  } catch (error) {
    message.error(error instanceof Error ? error.message : '分批收货登记失败');
  } finally {
    receiveBusy.value = false;
  }
}

async function openPutaway(
  item?: CloudMoldWarehouseProcurementApi.ReceiptPageItem | Record<string, any>,
) {
  if (item) await openDetail(item);
  if (!detail.value) return;
  selectedReceiptLineIds.value = putawayLines.value.map(
    (line) => line.receiptLineId,
  );
  putawayLines.value.forEach((line) => {
    putawayQuantities[line.receiptLineId] = remainingPutawayQuantity(line);
    targetLocationIds[line.receiptLineId] = '';
  });
  putawayOpen.value = true;
}

function rowDisposition(record: Record<string, any>) {
  return receiptDispositionSummary(
    record as CloudMoldWarehouseProcurementApi.ReceiptLine,
  );
}

function rowRemainingPutaway(record: Record<string, any>) {
  return remainingPutawayQuantity(
    record as CloudMoldWarehouseProcurementApi.ReceiptLine,
  );
}

async function submitPutaway() {
  if (!detail.value) return;
  const selected = putawayLines.value.filter((line) =>
    selectedReceiptLineIds.value.includes(line.receiptLineId),
  );
  if (
    selected.length === 0 ||
    selected.some((line) => !targetLocationIds[line.receiptLineId]?.trim())
  ) {
    message.warning('请至少选择一条合格收货行，并逐行填写目标库位');
    return;
  }
  putawayBusy.value = true;
  try {
    const result = await putawayProcurementReceipt({
      lines: selected.map((receiptLine) => ({
        quantity: putawayQuantities[receiptLine.receiptLineId] ?? '0',
        receiptLine,
        targetLocationId: targetLocationIds[receiptLine.receiptLineId]!.trim(),
      })),
      receipt: detail.value,
    });
    message[result.duplicate ? 'warning' : 'success'](
      result.duplicate ? '该上架批次已被幂等处理' : '合格数量已按行分批上架',
    );
    putawayOpen.value = false;
    detail.value = await getProcurementReceipt(detail.value.receiptId);
    await loadPage();
  } catch (error) {
    message.error(error instanceof Error ? error.message : '分批上架失败');
  } finally {
    putawayBusy.value = false;
  }
}

onMounted(loadPage);
watch(workspace, () => {
  pageNo.value = 1;
  status.value = undefined;
  loadError.value = '';
  void loadPage();
});
</script>

<template>
  <Page
    description="按采购订单交期登记多批收货，质检合格数量再逐行上架并保留库存账本引用。"
    title="采购收货与分批上架"
  >
    <Alert
      class="mb-4"
      description="收货直接增加待检库存；上架只能处理 Quality 已接受的数量，每个操作均绑定真实 Inventory 操作与账本事务。"
      message="CloudMold 仓储权威"
      show-icon
      type="info"
    />

    <Row :gutter="16" class="mb-4" :wrap="true">
      <Col :lg="6" :sm="12" :xs="24">
        <Card><Statistic title="待质检收货单" :value="pendingQuality" /></Card>
      </Col>
      <Col :lg="6" :sm="12" :xs="24">
        <Card><Statistic title="可分批上架" :value="putawayReady" /></Card>
      </Col>
      <Col :lg="6" :sm="12" :xs="24">
        <Card><Statistic title="本页已上架" :value="putawayCompleted" /></Card>
      </Col>
      <Col :lg="6" :sm="12" :xs="24">
        <Card><Statistic title="拒收 / 隔离" :value="exceptions" /></Card>
      </Col>
    </Row>

    <Card class="workbench-card">
      <Tabs v-model:active-key="workspace" :items="workspaceOptions" />
      <div class="toolbar">
        <Space wrap>
          <Input
            v-model:value="receiptId"
            allow-clear
            placeholder="收货单 ID"
            style="width: 190px"
            @press-enter="search"
          />
          <Input
            v-model:value="procurementOrderId"
            allow-clear
            placeholder="采购订单 ID"
            style="width: 210px"
            @press-enter="search"
          />
          <Input
            v-if="workspace === 'RECEIPT'"
            v-model:value="supplierId"
            allow-clear
            placeholder="供应商 ID"
            style="width: 180px"
            @press-enter="search"
          />
          <Input
            v-model:value="warehouseId"
            allow-clear
            placeholder="仓库 ID"
            style="width: 170px"
            @press-enter="search"
          />
          <Select
            v-model:value="status"
            allow-clear
            :options="statusOptions"
            placeholder="全部状态"
            style="width: 160px"
          />
          <Button type="primary" @click="search">查询</Button>
          <Button @click="reset">重置</Button>
        </Space>
        <Button
          v-if="canCommand && workspace === 'RECEIPT'"
          type="primary"
          @click="openReceive"
        >
          登记收货
        </Button>
      </div>
      <Alert
        v-if="loadError"
        class="mb-4"
        :message="loadError"
        show-icon
        type="error"
      />
      <Table
        v-if="workspace === 'RECEIPT'"
        :columns="columns"
        :data-source="rows"
        :loading="loading"
        :pagination="{
          current: pageNo,
          pageSize,
          total,
          showSizeChanger: true,
        }"
        row-key="receiptId"
        :scroll="{ x: 1380 }"
        @change="changePage"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'receipt'">
            <Button class="cell-link" type="link" @click="openDetail(record)">
              {{ record.receiptNo }}
            </Button>
            <div class="subtle">ASN {{ record.asnId }}</div>
          </template>
          <template v-else-if="column.key === 'purchase'">
            <div>{{ record.procurementOrderId }}</div>
            <div class="subtle">供应商 {{ record.supplierId }}</div>
          </template>
          <template v-else-if="column.key === 'quantity'">
            <div>{{ formatQuantity(record.totalReceivedQuantity) }}</div>
            <div class="subtle">
              待检 {{ formatQuantity(record.totalPendingQualityQuantity) }}
            </div>
          </template>
          <template v-else-if="column.key === 'status'">
            <Tag :color="inboundStatusMeta(record.status).color">
              {{ inboundStatusMeta(record.status).label }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" @click="openDetail(record)">查看</Button>
              <Button
                v-if="
                  canCommand &&
                  [
                    'PARTIALLY_PUTAWAY',
                    'QUALITY_ACCEPTED',
                    'QUALITY_MIXED',
                  ].includes(record.status)
                "
                type="link"
                @click="openPutaway(record)"
              >
                分批上架
              </Button>
            </Space>
          </template>
        </template>
      </Table>
      <Table
        v-else
        :columns="putawayColumns"
        :data-source="putawayRows"
        :loading="loading"
        :pagination="{
          current: pageNo,
          pageSize,
          total,
          showSizeChanger: true,
        }"
        row-key="putawayId"
        :scroll="{ x: 1400 }"
        @change="changePage"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'putaway'">
            <Button
              class="cell-link"
              type="link"
              @click="openPutawayDetail(record)"
            >
              {{ record.putawayId }}
            </Button>
            <div class="subtle">V{{ record.version }}</div>
          </template>
          <template v-else-if="column.key === 'receipt'">
            <div>{{ record.receiptNo }}</div>
            <div class="subtle">{{ record.procurementOrderId }}</div>
          </template>
          <template v-else-if="column.key === 'party'">
            <div>{{ record.supplierId }}</div>
            <div class="subtle">仓库 {{ record.warehouseId }}</div>
          </template>
          <template v-else-if="column.key === 'quantity'">
            {{ formatQuantity(record.totalPutawayQuantity) }}
          </template>
          <template v-else-if="column.key === 'status'">
            <Tag :color="inboundStatusMeta(record.status).color">
              {{ inboundStatusMeta(record.status).label }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <Button type="link" @click="openPutawayDetail(record)">
              查看
            </Button>
          </template>
        </template>
      </Table>
    </Card>

    <Drawer
      v-model:open="detailOpen"
      destroy-on-close
      title="采购收货完整事实"
      width="1040"
    >
      <div v-if="detailLoading" class="drawer-loading">正在读取收货单…</div>
      <template v-else-if="detail">
        <Space class="mb-4" wrap>
          <Tag :color="inboundStatusMeta(detail.status).color">
            {{ inboundStatusMeta(detail.status).label }}
          </Tag>
          <Button
            v-if="canCommand && putawayLines.length"
            type="primary"
            @click="openPutaway()"
          >
            分批上架
          </Button>
        </Space>
        <Descriptions bordered :column="2" size="small">
          <Descriptions.Item label="收货单">
            {{ detail.receiptNo }}
          </Descriptions.Item>
          <Descriptions.Item label="版本">
            V{{ detail.version }}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {{ detail.createdAt }}
          </Descriptions.Item>
          <Descriptions.Item label="备注">
            {{ detail.remark ?? '—' }}
          </Descriptions.Item>
        </Descriptions>
        <Divider>收货行、质量处置与库存引用</Divider>
        <Table
          :columns="[
            { dataIndex: 'lineNo', title: '行', width: 60 },
            { key: 'sku', title: 'SKU / 交期', width: 210 },
            { key: 'location', title: '收货库位 / Lot', width: 180 },
            { key: 'quantities', title: '数量处置', width: 300 },
            { key: 'putaway', title: '已上架 / 可上架', width: 190 },
            { key: 'ledger', title: 'Inventory 账本', width: 210 },
            { key: 'finance', title: 'Finance 收货证据', width: 250 },
          ]"
          :data-source="detail.lines"
          :pagination="false"
          row-key="receiptLineId"
          :scroll="{ x: 1410 }"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'sku'">
              <div>{{ record.canonicalSkuId }}</div>
              <div class="subtle">{{ record.deliveryScheduleId }}</div>
              <div class="subtle">
                单价 {{ record.unitCostAmountMinor }} · 收货成本
                {{ record.movementCostAmountMinor }} {{ record.currencyCode }}
              </div>
            </template>
            <template v-else-if="column.key === 'location'">
              <div>{{ record.receiptLocationId }}</div>
              <div class="subtle">Lot {{ record.lotId ?? '未跟踪' }}</div>
            </template>
            <template v-else-if="column.key === 'quantities'">
              <div>{{ rowDisposition(record) }}</div>
              <Tag
                class="mt-1"
                :color="inboundStatusMeta(record.qualityStatus).color"
              >
                {{ inboundStatusMeta(record.qualityStatus).label }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'putaway'">
              <div>
                {{
                  formatQuantity(
                    record.cumulativePutawayQuantity,
                    record.baseUomCode,
                  )
                }}
              </div>
              <div class="subtle">
                可上架
                {{
                  formatQuantity(
                    rowRemainingPutaway(record),
                    record.baseUomCode,
                  )
                }}
              </div>
            </template>
            <template v-else-if="column.key === 'ledger'">
              <div>TX {{ record.inventoryLedgerTxId }}</div>
              <div class="subtle">OP {{ record.inventoryOperationId }}</div>
            </template>
            <template v-else-if="column.key === 'finance'">
              <div>{{ record.financeReceiptEvidenceId }}</div>
              <div class="subtle">
                OP {{ record.financeReceiptEvidenceOperationId }} · V{{
                  record.financeReceiptEvidenceVersion
                }}
              </div>
            </template>
          </template>
        </Table>
      </template>
      <Empty v-else description="未读取到收货单" />
    </Drawer>

    <Drawer
      v-model:open="putawayDetailOpen"
      destroy-on-close
      title="上架批次与 Inventory 入账事实"
      width="1080"
    >
      <div v-if="putawayDetailLoading" class="drawer-loading">
        正在读取上架批次…
      </div>
      <template v-else-if="putawayDetail">
        <Descriptions bordered :column="2" size="small">
          <Descriptions.Item label="上架批次">
            {{ putawayDetail.putawayId }}
          </Descriptions.Item>
          <Descriptions.Item label="状态 / 版本">
            <Tag :color="inboundStatusMeta(putawayDetail.status).color">
              {{ inboundStatusMeta(putawayDetail.status).label }}
            </Tag>
            V{{ putawayDetail.version }}
          </Descriptions.Item>
          <Descriptions.Item label="收货单">
            {{ putawayDetail.receiptNo }}
          </Descriptions.Item>
          <Descriptions.Item label="采购订单">
            {{ putawayDetail.procurementOrderId }}
          </Descriptions.Item>
          <Descriptions.Item label="供应商">
            {{ putawayDetail.supplierId }}
          </Descriptions.Item>
          <Descriptions.Item label="仓库">
            {{ putawayDetail.warehouseId }}
          </Descriptions.Item>
        </Descriptions>
        <Divider>逐行上架与账本引用</Divider>
        <Table
          :columns="[
            { key: 'sku', title: 'SKU / Lot', width: 190 },
            { key: 'movement', title: '源库位 → 目标库位', width: 260 },
            { key: 'quantity', title: '本次 / 累计上架', width: 210 },
            { key: 'inventory', title: 'Inventory 操作 / 账本', width: 250 },
            { dataIndex: 'createdAt', title: '上架时间', width: 180 },
          ]"
          :data-source="putawayDetail.lines"
          :pagination="false"
          row-key="putawayLineId"
          :scroll="{ x: 1120 }"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'sku'">
              <div>{{ record.canonicalSkuId }}</div>
              <div class="subtle">Lot {{ record.lotId ?? '未跟踪' }}</div>
            </template>
            <template v-else-if="column.key === 'movement'">
              <div>{{ record.sourceLocationId }}</div>
              <div class="movement-target">→ {{ record.targetLocationId }}</div>
            </template>
            <template v-else-if="column.key === 'quantity'">
              <div>
                {{ formatQuantity(record.putawayQuantity, record.baseUomCode) }}
              </div>
              <div class="subtle">
                累计
                {{
                  formatQuantity(
                    record.cumulativePutawayQuantity,
                    record.baseUomCode,
                  )
                }}
              </div>
            </template>
            <template v-else-if="column.key === 'inventory'">
              <div>OP {{ record.inventoryOperationId }}</div>
              <div class="subtle">
                TX {{ record.inventoryLedgerTransactionId }}
              </div>
              <div class="subtle">
                Balance {{ record.inventoryTargetBalanceId }}
              </div>
            </template>
          </template>
        </Table>
      </template>
      <Empty v-else description="未读取到上架批次" />
    </Drawer>

    <Modal
      v-model:open="receiveOpen"
      :confirm-loading="receiveBusy"
      ok-text="登记分批收货"
      title="登记采购收货"
      width="980"
      @ok="submitReceive"
    >
      <Alert
        class="mb-4"
        message="先读取采购订单已发布 ASN；所有交期、容差、计价与货权快照只使用服务端冻结事实。"
        show-icon
        type="info"
      />
      <Form layout="vertical">
        <Row :gutter="16">
          <Col :span="16">
            <Form.Item label="采购订单 ID" required>
              <Input v-model:value="receiveForm.procurementOrderId" />
            </Form.Item>
          </Col>
          <Col :span="8">
            <Form.Item label="">
              <Button block :loading="progressLoading" @click="loadProgress">
                读取 ASN 进度
              </Button>
            </Form.Item>
          </Col>
        </Row>
        <template v-if="progress">
          <Descriptions bordered class="mb-4" :column="3" size="small">
            <Descriptions.Item label="ASN">
              {{ progress.asnNo }}
            </Descriptions.Item>
            <Descriptions.Item label="供应商">
              {{ progress.supplierId }}
            </Descriptions.Item>
            <Descriptions.Item label="仓库">
              {{ progress.warehouseId }}
            </Descriptions.Item>
            <Descriptions.Item label="计划数量">
              {{ formatQuantity(progress.totalScheduledQuantity) }}
            </Descriptions.Item>
            <Descriptions.Item label="累计收货">
              {{ formatQuantity(progress.totalReceivedQuantity) }}
            </Descriptions.Item>
            <Descriptions.Item label="当前阶段">
              {{ progress.nextWaitingEventLabel }}
            </Descriptions.Item>
          </Descriptions>
          <Alert
            v-if="!canRecordReceipt(progress)"
            class="mb-4"
            message="该 ASN 已无可收货交期行"
            type="warning"
          />
          <div
            v-for="line in receivableLines"
            :key="line.asnLineId"
            class="receive-line"
          >
            <Checkbox
              :checked="selectedAsnLineIds.includes(line.asnLineId)"
              @change="
                (event) =>
                  toggleSelection(
                    selectedAsnLineIds,
                    line.asnLineId,
                    event.target.checked,
                  )
              "
            />
            <div class="receive-line__identity">
              <strong>行 {{ line.lineNo }} · {{ line.canonicalSkuId }}</strong>
              <div class="subtle">
                {{ line.deliveryScheduleId }} · 最多可收
                {{
                  formatQuantity(
                    remainingReceivableQuantity(line),
                    line.baseUomCode,
                  )
                }}
              </div>
            </div>
            <Input
              v-model:value="receiveQuantities[line.asnLineId]"
              addon-before="实收"
              style="width: 210px"
            />
            <Input
              v-model:value="receiveLots[line.asnLineId]"
              addon-before="Lot"
              placeholder="未跟踪可留空"
              style="width: 230px"
            />
          </div>
          <Row :gutter="16" class="mt-4">
            <Col :span="10">
              <Form.Item label="收货单号" required>
                <Input v-model:value="receiveForm.receiptNo" />
              </Form.Item>
            </Col>
            <Col :span="14">
              <Form.Item label="收货备注">
                <Input v-model:value="receiveForm.remark" />
              </Form.Item>
            </Col>
          </Row>
        </template>
      </Form>
    </Modal>

    <Modal
      v-model:open="putawayOpen"
      :confirm-loading="putawayBusy"
      ok-text="提交分批上架"
      title="按收货行分批上架"
      width="900"
      @ok="submitPutaway"
    >
      <Alert
        class="mb-4"
        message="目标库位逐行填写；待检、拒收与隔离数量无法上架，服务端将再次校验 Quality 与版本。"
        show-icon
        type="warning"
      />
      <Empty
        v-if="putawayLines.length === 0"
        description="当前没有可上架的合格数量"
      />
      <div
        v-for="line in putawayLines"
        v-else
        :key="line.receiptLineId"
        class="receive-line"
      >
        <Checkbox
          :checked="selectedReceiptLineIds.includes(line.receiptLineId)"
          @change="
            (event) =>
              toggleSelection(
                selectedReceiptLineIds,
                line.receiptLineId,
                event.target.checked,
              )
          "
        />
        <div class="receive-line__identity">
          <strong>行 {{ line.lineNo }} · {{ line.canonicalSkuId }}</strong>
          <div class="subtle">
            来源 {{ line.receiptLocationId }} · 可上架
            {{
              formatQuantity(remainingPutawayQuantity(line), line.baseUomCode)
            }}
          </div>
        </div>
        <Input
          v-model:value="putawayQuantities[line.receiptLineId]"
          addon-before="数量"
          style="width: 190px"
        />
        <Input
          v-model:value="targetLocationIds[line.receiptLineId]"
          addon-before="目标库位"
          style="width: 260px"
        />
      </div>
    </Modal>
  </Page>
</template>

<style scoped>
.workbench-card :deep(.ant-card-body) {
  padding-top: 18px;
}

.toolbar {
  display: flex;
  gap: 16px;
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

.movement-target {
  font-weight: 600;
  color: #1677ff;
}

.drawer-loading {
  padding: 40px 0;
  color: #667085;
  text-align: center;
}

.receive-line {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px;
  margin-bottom: 10px;
  border: 1px solid #e6eaf0;
  border-radius: 10px;
}

.receive-line__identity {
  flex: 1;
  min-width: 220px;
}
</style>
