<script lang="ts" setup>
import type { CloudMoldCommerceApi } from '#/api/cloudmold/commerce';

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

import { getCloudMoldAfterSaleDetail } from '#/api/cloudmold/commerce';

import CopyIdCell from '../../shared/copy-id-cell.vue';
import StatusTag from '../../shared/status-tag.vue';
import { commerceStatusColor } from '../status';

defineOptions({ name: 'CloudMoldCommerceAfterSaleDetailDrawer' });

const props = defineProps<{
  afterSaleId: null | string;
  open: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
}>();

const loading = ref(false);
const detail = ref<CloudMoldCommerceApi.AfterSaleDetail | null>(null);

const openProxy = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
});

function formatMinor(minor?: null | number): string {
  return minor === undefined || minor === null ? '-' : (minor / 100).toFixed(2);
}

function dash(value?: null | string): string {
  return value && value !== '' ? value : '-';
}

function orDash(value?: null | number): number | string {
  return value === undefined || value === null ? '-' : value;
}

const itemColumns = [
  { title: '售后行 ID', dataIndex: 'afterSaleItemId', key: 'afterSaleItemId' },
  { title: '订单行 ID', dataIndex: 'orderItemId', key: 'orderItemId' },
  { title: '规范 SKU', dataIndex: 'canonicalSkuId', key: 'canonicalSkuId' },
  { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 110 },
  {
    dataIndex: 'lineAmountMinor',
    key: 'lineAmountMinor',
    title: '行金额(元)',
    width: 110,
  },
  {
    dataIndex: 'netAmountMinor',
    key: 'netAmountMinor',
    title: '净额(元)',
    width: 110,
  },
];

async function load() {
  if (!props.afterSaleId) {
    return;
  }
  loading.value = true;
  detail.value = null;
  try {
    detail.value = await getCloudMoldAfterSaleDetail(props.afterSaleId);
  } finally {
    loading.value = false;
  }
}

watch(
  () => [props.open, props.afterSaleId] as const,
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
    title="规范售后详情"
    placement="right"
    width="820"
    :destroy-on-close="true"
  >
    <Spin :spinning="loading">
      <Result
        v-if="!loading && !detail"
        status="info"
        title="未找到权威数据"
        sub-title="该售后案例不存在、不属于当前租户或暂无 CloudMold 权威数据。"
      />
      <template v-else-if="detail">
        <Descriptions
          title="基础信息"
          :column="2"
          bordered
          size="small"
          class="mb-4"
        >
          <DescriptionsItem label="售后单号">
            <CopyIdCell :value="detail.afterSaleNo" label="售后单号" />
          </DescriptionsItem>
          <DescriptionsItem label="售后 ID">
            <CopyIdCell :value="detail.afterSaleId" label="售后 ID" />
          </DescriptionsItem>
          <DescriptionsItem label="订单号">
            <CopyIdCell :value="detail.orderNo" label="订单号" />
          </DescriptionsItem>
          <DescriptionsItem label="订单 ID">
            <CopyIdCell :value="detail.orderId" label="订单 ID" />
          </DescriptionsItem>
          <DescriptionsItem label="售后状态">
            <StatusTag
              :color="commerceStatusColor(detail.caseStatus)"
              :label="detail.caseStatus"
            />
          </DescriptionsItem>
          <DescriptionsItem label="退款状态">
            {{ dash(detail.refundStatus) }}
          </DescriptionsItem>
          <DescriptionsItem label="类型">
            {{ dash(detail.afterSaleType) }}
          </DescriptionsItem>
          <DescriptionsItem label="原因编码">
            {{ dash(detail.reasonCode) }}
          </DescriptionsItem>
          <DescriptionsItem label="责任编码">
            {{ dash(detail.responsibility) }}
          </DescriptionsItem>
          <DescriptionsItem label="批准金额(元)">
            {{ formatMinor(detail.approvedAmountMinor) }}
          </DescriptionsItem>
          <DescriptionsItem label="币种">
            {{ dash(detail.currencyCode) }}
          </DescriptionsItem>
          <DescriptionsItem label="聚合版本">
            {{ detail.aggregateVersion }}
          </DescriptionsItem>
        </Descriptions>

        <Descriptions
          title="编排与关联"
          :column="2"
          bordered
          size="small"
          class="mb-4"
        >
          <DescriptionsItem label="编排状态">
            {{ dash(detail.resolutionSagaStatus) }}
          </DescriptionsItem>
          <DescriptionsItem label="当前步骤">
            {{ dash(detail.resolutionSagaActiveStep) }}
          </DescriptionsItem>
          <DescriptionsItem label="尝试次数">
            {{ orDash(detail.resolutionSagaAttemptCount) }}
          </DescriptionsItem>
          <DescriptionsItem label="最大尝试">
            {{ orDash(detail.resolutionSagaMaxAttempts) }}
          </DescriptionsItem>
          <DescriptionsItem label="最近错误编码">
            {{ dash(detail.resolutionSagaLastErrorCode) }}
          </DescriptionsItem>
          <DescriptionsItem label="最近错误信息" :span="2">
            {{ dash(detail.resolutionSagaLastErrorMessage) }}
          </DescriptionsItem>
          <DescriptionsItem label="退款履约 ID">
            <CopyIdCell
              :value="detail.returnFulfillmentId"
              label="退款履约 ID"
            />
          </DescriptionsItem>
          <DescriptionsItem label="退款履约状态">
            {{ dash(detail.returnFulfillmentStatus) }}
          </DescriptionsItem>
          <DescriptionsItem label="正向履约 ID">
            <CopyIdCell
              :value="detail.forwardFulfillmentId"
              label="正向履约 ID"
            />
          </DescriptionsItem>
          <DescriptionsItem label="买家 ID">
            <CopyIdCell :value="detail.buyerId" label="买家 ID" />
          </DescriptionsItem>
          <DescriptionsItem label="支付 ID">
            <CopyIdCell :value="detail.paymentId" label="支付 ID" />
          </DescriptionsItem>
          <DescriptionsItem label="审核人 ID">
            <CopyIdCell :value="detail.reviewerId" label="审核人 ID" />
          </DescriptionsItem>
          <DescriptionsItem label="货主 ID">
            <CopyIdCell :value="detail.ownerId" label="货主 ID" />
          </DescriptionsItem>
          <DescriptionsItem label="仓库 ID">
            <CopyIdCell :value="detail.warehouseId" label="仓库 ID" />
          </DescriptionsItem>
          <DescriptionsItem label="计量单位">
            {{ dash(detail.uomCode) }}
          </DescriptionsItem>
        </Descriptions>

        <Descriptions
          title="原因说明"
          :column="1"
          bordered
          size="small"
          class="mb-4"
        >
          <DescriptionsItem label="原因文本">
            {{ dash(detail.reason) }}
          </DescriptionsItem>
        </Descriptions>

        <div class="mb-2 mt-4 font-medium">售后行</div>
        <Table
          :columns="itemColumns"
          :data-source="detail.items"
          :pagination="false"
          row-key="afterSaleItemId"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'canonicalSkuId'">
              <CopyIdCell :value="record.canonicalSkuId" label="规范 SKU ID" />
            </template>
            <template v-else-if="column.dataIndex === 'lineAmountMinor'">
              {{ formatMinor(record.lineAmountMinor) }}
            </template>
            <template v-else-if="column.dataIndex === 'netAmountMinor'">
              {{ formatMinor(record.netAmountMinor) }}
            </template>
          </template>
        </Table>

        <Descriptions
          title="时间戳"
          :column="3"
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
          <DescriptionsItem label="完成时间">
            {{ detail.completedAt ? formatDateTime(detail.completedAt) : '-' }}
          </DescriptionsItem>
        </Descriptions>
      </template>
    </Spin>
  </Drawer>
</template>
