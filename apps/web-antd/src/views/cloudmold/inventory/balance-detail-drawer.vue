<script lang="ts" setup>
import type { CloudMoldInventoryApi } from '#/api/cloudmold/inventory';

import { computed, ref, watch } from 'vue';

import { formatDateTime } from '@vben/utils';

import {
  Descriptions,
  DescriptionsItem,
  Drawer,
  Result,
  Spin,
  Table,
} from 'ant-design-vue';

import { getCloudMoldInventoryBalanceDetail } from '#/api/cloudmold/inventory';

import CopyIdCell from '../shared/copy-id-cell.vue';
import { cloudMoldEnumLabel } from '../shared/status-meta';
import StatusTag from '../shared/status-tag.vue';
import {
  qualityStatusMeta,
  reservationStatusMeta,
  stockStatusMeta,
} from './data';

import '../shared/detail-layout.css';

defineOptions({ name: 'CloudMoldInventoryBalanceDetailDrawer' });

const props = defineProps<{
  balanceId: null | string;
  open: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
}>();

const loading = ref(false);
const detail = ref<CloudMoldInventoryApi.BalanceDetail | null>(null);

const openProxy = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
});

function formatDecimal(value?: null | string): string {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  return String(value).replace(/(\.\d*?[1-9])0+$|\.0+$/, '$1');
}

function dash(value?: null | string): string {
  return value && value !== '' ? value : '-';
}

type StatusMeta = Record<number | string, { color: string; label: string }>;

function meta(map: StatusMeta, status: number | string) {
  return map[status] ?? { color: 'default', label: String(status) };
}

const ledgerColumns = [
  { title: '发生时间', dataIndex: 'occurredAt', key: 'occurredAt' },
  { title: '动作', dataIndex: 'commandType', key: 'commandType' },
  { title: '业务类型', dataIndex: 'businessType', key: 'businessType' },
  { title: '业务单号', dataIndex: 'businessNo', key: 'businessNo' },
  { title: '角色', dataIndex: 'entryRole', key: 'entryRole' },
  {
    dataIndex: 'deltaOnHandQuantity',
    key: 'deltaOnHandQuantity',
    title: '在手变化',
  },
  {
    dataIndex: 'deltaReservedQuantity',
    key: 'deltaReservedQuantity',
    title: '预占变化',
  },
  {
    dataIndex: 'deltaInTransitQuantity',
    key: 'deltaInTransitQuantity',
    title: '在途变化',
  },
  {
    dataIndex: 'afterOnHandQuantity',
    key: 'afterOnHandQuantity',
    title: '在手余量',
  },
];

const allocationColumns = [
  { title: '分配 ID', dataIndex: 'allocationId', key: 'allocationId' },
  { title: '预占 ID', dataIndex: 'reservationId', key: 'reservationId' },
  { title: '数量', dataIndex: 'quantity', key: 'quantity' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '版本', dataIndex: 'version', key: 'version' },
];

async function load() {
  if (!props.balanceId) {
    return;
  }
  loading.value = true;
  detail.value = null;
  try {
    detail.value = await getCloudMoldInventoryBalanceDetail(props.balanceId);
  } finally {
    loading.value = false;
  }
}

watch(
  () => [props.open, props.balanceId] as const,
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
    title="库存明细"
    placement="right"
    width="min(920px, calc(100vw - 24px))"
    :destroy-on-close="true"
  >
    <Spin :spinning="loading">
      <Result
        v-if="!loading && !detail"
        status="info"
        title="未找到库存"
        sub-title="该库存记录不存在，或当前账号没有查看权限。"
      />
      <template v-else-if="detail">
        <Descriptions
          title="标识与归属"
          :column="2"
          bordered
          size="small"
          class="mb-4"
        >
          <DescriptionsItem label="余额 ID">
            <CopyIdCell :value="detail.balanceId" label="余额 ID" />
          </DescriptionsItem>
          <DescriptionsItem label="规范 SKU ID">
            <CopyIdCell :value="detail.canonicalSkuId" label="规范 SKU ID" />
          </DescriptionsItem>
          <DescriptionsItem label="SKU 编码">
            {{ dash(detail.skuCode) }}
          </DescriptionsItem>
          <DescriptionsItem label="SPU 编码">
            {{ dash(detail.spuCode) }}
          </DescriptionsItem>
          <DescriptionsItem label="货主类型">
            {{ cloudMoldEnumLabel(detail.ownerType) }}
          </DescriptionsItem>
          <DescriptionsItem label="货主 ID">
            <CopyIdCell :value="detail.ownerId" label="货主 ID" />
          </DescriptionsItem>
        </Descriptions>

        <Descriptions
          title="仓位与计量"
          :column="2"
          bordered
          size="small"
          class="mb-4"
        >
          <DescriptionsItem label="仓库编码">
            {{ dash(detail.warehouseCode) }}
          </DescriptionsItem>
          <DescriptionsItem label="仓库名称">
            <CopyIdCell :value="detail.warehouseName" label="仓库名称" />
          </DescriptionsItem>
          <DescriptionsItem label="库位编码">
            {{ dash(detail.locationCode) }}
          </DescriptionsItem>
          <DescriptionsItem label="库位名称">
            <CopyIdCell :value="detail.locationName" label="库位名称" />
          </DescriptionsItem>
          <DescriptionsItem label="批次编码">
            {{ dash(detail.lotCode) }}
          </DescriptionsItem>
          <DescriptionsItem label="计量单位">
            {{ cloudMoldEnumLabel(detail.baseUomCode) }}
          </DescriptionsItem>
        </Descriptions>

        <Descriptions
          title="状态与数量"
          :column="2"
          bordered
          size="small"
          class="mb-4"
        >
          <DescriptionsItem label="库存状态">
            <StatusTag v-bind="meta(stockStatusMeta, detail.stockStatus)" />
          </DescriptionsItem>
          <DescriptionsItem label="质量状态">
            <StatusTag v-bind="meta(qualityStatusMeta, detail.qualityStatus)" />
          </DescriptionsItem>
          <DescriptionsItem label="分配资格" :span="2">
            {{ cloudMoldEnumLabel(detail.allocationEligibility) }}
          </DescriptionsItem>
          <DescriptionsItem label="在手">
            {{ formatDecimal(detail.onHandQuantity) }}
          </DescriptionsItem>
          <DescriptionsItem label="预占">
            {{ formatDecimal(detail.reservedQuantity) }}
          </DescriptionsItem>
          <DescriptionsItem label="在途">
            {{ formatDecimal(detail.inTransitQuantity) }}
          </DescriptionsItem>
          <DescriptionsItem label="可用">
            {{ formatDecimal(detail.availableQuantity) }}
          </DescriptionsItem>
          <DescriptionsItem label="可分配">
            {{ formatDecimal(detail.allocatableQuantity) }}
          </DescriptionsItem>
          <DescriptionsItem label="聚合版本">
            {{ detail.aggregateVersion }}
          </DescriptionsItem>
        </Descriptions>

        <div class="mb-2 mt-4 font-medium">最近账本流水（最多 20 条）</div>
        <Table
          :columns="ledgerColumns"
          :data-source="detail.recentLedgerEntries"
          :pagination="false"
          row-key="ledgerEntryId"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'occurredAt'">
              {{ formatDateTime(record.occurredAt) }}
            </template>
            <template v-else-if="column.dataIndex === 'commandType'">
              {{ cloudMoldEnumLabel(record.commandType) }}
            </template>
            <template v-else-if="column.dataIndex === 'businessType'">
              {{ cloudMoldEnumLabel(record.businessType) }}
            </template>
            <template v-else-if="column.dataIndex === 'entryRole'">
              {{ cloudMoldEnumLabel(record.entryRole) }}
            </template>
            <template v-else-if="column.dataIndex === 'businessNo'">
              <CopyIdCell :value="record.businessNo" label="业务单号" />
            </template>
            <template v-else-if="column.dataIndex === 'deltaOnHandQuantity'">
              {{ formatDecimal(record.deltaOnHandQuantity) }}
            </template>
            <template v-else-if="column.dataIndex === 'deltaReservedQuantity'">
              {{ formatDecimal(record.deltaReservedQuantity) }}
            </template>
            <template v-else-if="column.dataIndex === 'deltaInTransitQuantity'">
              {{ formatDecimal(record.deltaInTransitQuantity) }}
            </template>
            <template v-else-if="column.dataIndex === 'afterOnHandQuantity'">
              {{ formatDecimal(record.afterOnHandQuantity) }}
            </template>
          </template>
        </Table>

        <div class="mb-2 mt-4 font-medium">活跃预占</div>
        <Table
          :columns="allocationColumns"
          :data-source="detail.activeAllocations"
          :pagination="false"
          row-key="allocationId"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'allocationId'">
              <CopyIdCell :value="record.allocationId" label="分配 ID" />
            </template>
            <template v-else-if="column.dataIndex === 'reservationId'">
              <CopyIdCell :value="record.reservationId" label="预占 ID" />
            </template>
            <template v-else-if="column.dataIndex === 'quantity'">
              {{ formatDecimal(record.quantity) }}
            </template>
            <template v-else-if="column.dataIndex === 'status'">
              <StatusTag v-bind="meta(reservationStatusMeta, record.status)" />
            </template>
          </template>
        </Table>

        <Descriptions
          title="时间戳"
          :column="2"
          bordered
          size="small"
          class="mt-4"
        >
          <DescriptionsItem label="创建时间">
            {{ formatDateTime(detail.createdAt) }}
          </DescriptionsItem>
          <DescriptionsItem label="更新时间">
            {{ formatDateTime(detail.updatedAt) }}
          </DescriptionsItem>
        </Descriptions>
      </template>
    </Spin>
  </Drawer>
</template>
