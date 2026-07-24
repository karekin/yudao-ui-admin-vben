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

import { getCloudMoldFulfillmentDetail } from '#/api/cloudmold/commerce';

import CopyIdCell from '../../shared/copy-id-cell.vue';
import StatusTag from '../../shared/status-tag.vue';
import { commerceStatusColor } from '../status';

import '../../shared/detail-layout.css';

defineOptions({ name: 'CloudMoldCommerceFulfillmentDetailDrawer' });

const props = defineProps<{
  fulfillmentId: null | string;
  open: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
}>();

const loading = ref(false);
const detail = ref<CloudMoldCommerceApi.FulfillmentDetail | null>(null);

const openProxy = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
});

function dash(value?: null | string): string {
  return value && value !== '' ? value : '-';
}

const itemColumns = [
  { title: '订单行 ID', dataIndex: 'orderItemId', key: 'orderItemId' },
  { title: '规范 SKU', dataIndex: 'canonicalSkuId', key: 'canonicalSkuId' },
  { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 110 },
  { title: '预占 ID', dataIndex: 'reservationId', key: 'reservationId' },
];

async function load() {
  if (!props.fulfillmentId) {
    return;
  }
  loading.value = true;
  detail.value = null;
  try {
    detail.value = await getCloudMoldFulfillmentDetail(props.fulfillmentId);
  } finally {
    loading.value = false;
  }
}

watch(
  () => [props.open, props.fulfillmentId] as const,
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
    title="发货详情"
    placement="right"
    width="min(920px, calc(100vw - 24px))"
    :destroy-on-close="true"
  >
    <Spin :spinning="loading">
      <Result
        v-if="!loading && !detail"
        status="info"
        title="未找到发货记录"
        sub-title="该发货记录不存在，或当前账号没有查看权限。"
      />
      <template v-else-if="detail">
        <Descriptions
          title="基础信息"
          :column="2"
          bordered
          size="small"
          class="mb-4"
        >
          <DescriptionsItem label="履约单号">
            <CopyIdCell :value="detail.fulfillmentNo" label="履约单号" />
          </DescriptionsItem>
          <DescriptionsItem label="履约 ID">
            <CopyIdCell :value="detail.fulfillmentId" label="履约 ID" />
          </DescriptionsItem>
          <DescriptionsItem label="订单号">
            <CopyIdCell :value="detail.orderNo" label="订单号" />
          </DescriptionsItem>
          <DescriptionsItem label="订单 ID">
            <CopyIdCell :value="detail.orderId" label="订单 ID" />
          </DescriptionsItem>
          <DescriptionsItem label="状态">
            <StatusTag
              :color="commerceStatusColor(detail.status)"
              :label="detail.status"
            />
          </DescriptionsItem>
          <DescriptionsItem label="卖家 ID">
            <CopyIdCell :value="detail.sellerId" label="卖家 ID" />
          </DescriptionsItem>
          <DescriptionsItem label="仓库 ID">
            <CopyIdCell :value="detail.warehouseId" label="仓库 ID" />
          </DescriptionsItem>
          <DescriptionsItem label="行数">
            {{ detail.itemCount }}
          </DescriptionsItem>
          <DescriptionsItem label="总数量">
            {{ detail.totalQuantity }}
          </DescriptionsItem>
          <DescriptionsItem label="聚合版本">
            {{ detail.aggregateVersion }}
          </DescriptionsItem>
        </Descriptions>

        <Descriptions
          title="发运与承诺"
          :column="2"
          bordered
          size="small"
          class="mb-4"
        >
          <DescriptionsItem label="发运 ID">
            <CopyIdCell :value="detail.firstSliceShipmentId" label="发运 ID" />
          </DescriptionsItem>
          <DescriptionsItem label="发运状态">
            <StatusTag :label="detail.firstSliceShipmentStatus" />
          </DescriptionsItem>
          <DescriptionsItem label="承运商">
            {{ dash(detail.carrierCode) }}
          </DescriptionsItem>
          <DescriptionsItem label="运单号">
            <CopyIdCell :value="detail.waybillNo" label="运单号" />
          </DescriptionsItem>
          <DescriptionsItem label="承诺送达">
            {{
              detail.promisedDeliveryAt
                ? formatDateTime(detail.promisedDeliveryAt)
                : '-'
            }}
          </DescriptionsItem>
          <DescriptionsItem label="承诺版本引用">
            <CopyIdCell
              :value="detail.deliveryPromiseVersionRef"
              label="承诺版本"
            />
          </DescriptionsItem>
          <DescriptionsItem label="取消引用" :span="2">
            <CopyIdCell :value="detail.cancellationRef" label="取消引用" />
          </DescriptionsItem>
        </Descriptions>

        <div class="mb-2 mt-4 font-medium">订单行</div>
        <Table
          :columns="itemColumns"
          :data-source="detail.items"
          :pagination="false"
          row-key="fulfillmentItemId"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'orderItemId'">
              <CopyIdCell :value="record.orderItemId" label="订单行 ID" />
            </template>
            <template v-else-if="column.dataIndex === 'canonicalSkuId'">
              <CopyIdCell :value="record.canonicalSkuId" label="规范 SKU ID" />
            </template>
            <template v-else-if="column.dataIndex === 'reservationId'">
              <CopyIdCell :value="record.reservationId" label="预占 ID" />
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
