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

import { getCloudMoldOrderDetail } from '#/api/cloudmold/commerce';

import CopyIdCell from '../../shared/copy-id-cell.vue';
import { cloudMoldEnumLabel } from '../../shared/status-meta';
import StatusTag from '../../shared/status-tag.vue';
import { commerceStatusColor } from '../status';

import '../../shared/detail-layout.css';

defineOptions({ name: 'CloudMoldCommerceOrderDetailDrawer' });

const props = defineProps<{
  open: boolean;
  orderId: null | string;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
}>();

const loading = ref(false);
const detail = ref<CloudMoldCommerceApi.OrderDetail | null>(null);

const openProxy = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
});

function formatMinor(minor?: null | number, currency?: string): string {
  if (minor === null || minor === undefined) {
    return '-';
  }
  const yuan = (minor / 100).toFixed(2);
  if (!currency) {
    return yuan;
  }
  return currency === 'CNY'
    ? `${yuan} 元`
    : `${yuan} ${cloudMoldEnumLabel(currency)}`;
}

const itemColumns = [
  { title: '规范 SKU', dataIndex: 'canonicalSkuId', key: 'canonicalSkuId' },
  { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 90 },
  {
    title: '单价',
    dataIndex: 'unitPriceMinor',
    key: 'unitPriceMinor',
    width: 110,
  },
  {
    title: '行金额',
    dataIndex: 'lineAmountMinor',
    key: 'lineAmountMinor',
    width: 110,
  },
  {
    title: '优惠',
    dataIndex: 'discountAmountMinor',
    key: 'discountAmountMinor',
    width: 110,
  },
  {
    title: '净额',
    dataIndex: 'netAmountMinor',
    key: 'netAmountMinor',
    width: 110,
  },
  { title: '渠道', dataIndex: 'channelCode', key: 'channelCode', width: 100 },
  { title: '店铺', dataIndex: 'shopId', key: 'shopId', width: 150 },
];

async function load() {
  if (!props.orderId) {
    return;
  }
  loading.value = true;
  detail.value = null;
  try {
    detail.value = await getCloudMoldOrderDetail(props.orderId);
  } finally {
    loading.value = false;
  }
}

watch(
  () => [props.open, props.orderId] as const,
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
    title="订单详情"
    placement="right"
    width="min(920px, calc(100vw - 24px))"
    :destroy-on-close="true"
  >
    <Spin :spinning="loading">
      <Result
        v-if="!loading && !detail"
        status="info"
        title="未找到订单"
        sub-title="该订单不存在，或当前账号没有查看权限。"
      />
      <template v-else-if="detail">
        <Descriptions
          title="基础信息"
          :column="2"
          bordered
          size="small"
          class="mb-4"
        >
          <DescriptionsItem label="订单号">
            <CopyIdCell :value="detail.orderNo" label="订单号" />
          </DescriptionsItem>
          <DescriptionsItem label="订单 ID">
            <CopyIdCell :value="detail.orderId" label="订单 ID" />
          </DescriptionsItem>
          <DescriptionsItem label="规范买家">
            <CopyIdCell :value="detail.buyerId" label="买家 ID" />
          </DescriptionsItem>
          <DescriptionsItem label="状态">
            <StatusTag
              :color="commerceStatusColor(detail.status)"
              :label="detail.status"
            />
          </DescriptionsItem>
          <DescriptionsItem label="订单行数">
            {{ detail.itemCount }}
          </DescriptionsItem>
          <DescriptionsItem label="总数量">
            {{ detail.totalQuantity }}
          </DescriptionsItem>
          <DescriptionsItem label="迁移运行 ID">
            <CopyIdCell :value="detail.runId" label="迁移运行 ID" />
          </DescriptionsItem>
          <DescriptionsItem label="聚合版本">
            {{ detail.aggregateVersion }}
          </DescriptionsItem>
        </Descriptions>

        <Descriptions
          title="金额拆分"
          :column="2"
          bordered
          size="small"
          class="mb-4"
        >
          <DescriptionsItem label="商品金额">
            {{ formatMinor(detail.productAmountMinor, detail.currencyCode) }}
          </DescriptionsItem>
          <DescriptionsItem label="运费">
            {{ formatMinor(detail.shippingAmountMinor, detail.currencyCode) }}
          </DescriptionsItem>
          <DescriptionsItem label="优惠">
            {{ formatMinor(detail.discountAmountMinor, detail.currencyCode) }}
          </DescriptionsItem>
          <DescriptionsItem label="应付金额">
            {{ formatMinor(detail.payableAmountMinor, detail.currencyCode) }}
          </DescriptionsItem>
        </Descriptions>

        <Descriptions
          title="关联与取消"
          :column="2"
          bordered
          size="small"
          class="mb-4"
        >
          <DescriptionsItem label="支付 ID">
            <CopyIdCell :value="detail.paymentId" label="支付 ID" />
          </DescriptionsItem>
          <DescriptionsItem label="支付状态">
            <StatusTag :label="detail.paymentStatus" />
          </DescriptionsItem>
          <DescriptionsItem label="履约 ID">
            <CopyIdCell :value="detail.fulfillmentId" label="履约 ID" />
          </DescriptionsItem>
          <DescriptionsItem label="履约状态">
            <StatusTag :label="detail.fulfillmentStatus" />
          </DescriptionsItem>
          <DescriptionsItem label="发运 ID">
            <CopyIdCell :value="detail.shipmentId" label="发运 ID" />
          </DescriptionsItem>
          <DescriptionsItem label="退款 ID">
            <CopyIdCell :value="detail.refundId" label="退款 ID" />
          </DescriptionsItem>
          <DescriptionsItem label="取消 Saga">
            <CopyIdCell :value="detail.cancellationSagaId" label="取消 Saga" />
          </DescriptionsItem>
          <DescriptionsItem label="取消前状态">
            {{ cloudMoldEnumLabel(detail.preCancellationStatus) }}
          </DescriptionsItem>
          <DescriptionsItem label="取消责任方">
            {{ cloudMoldEnumLabel(detail.cancellationResponsibilityParty) }}
          </DescriptionsItem>
          <DescriptionsItem label="取消责任码">
            {{ cloudMoldEnumLabel(detail.cancellationResponsibilityCode) }}
          </DescriptionsItem>
        </Descriptions>

        <div class="mb-2 mt-4 font-medium">订单行</div>
        <Table
          :columns="itemColumns"
          :data-source="detail.items"
          :pagination="false"
          row-key="orderItemId"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'canonicalSkuId'">
              <CopyIdCell :value="record.canonicalSkuId" label="规范 SKU ID" />
            </template>
            <template v-else-if="column.dataIndex === 'unitPriceMinor'">
              {{ formatMinor(record.unitPriceMinor) }}
            </template>
            <template v-else-if="column.dataIndex === 'lineAmountMinor'">
              {{ formatMinor(record.lineAmountMinor) }}
            </template>
            <template v-else-if="column.dataIndex === 'discountAmountMinor'">
              {{ formatMinor(record.discountAmountMinor) }}
            </template>
            <template v-else-if="column.dataIndex === 'netAmountMinor'">
              {{ formatMinor(record.netAmountMinor) }}
            </template>
            <template v-else-if="column.dataIndex === 'channelCode'">
              {{ cloudMoldEnumLabel(record.channelCode) }}
            </template>
            <template v-else-if="column.dataIndex === 'shopId'">
              <CopyIdCell :value="record.shopId" label="店铺 ID" />
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
