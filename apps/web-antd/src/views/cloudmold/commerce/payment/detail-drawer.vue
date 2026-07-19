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
  Tag,
} from 'ant-design-vue';

import { getCloudMoldPaymentDetail } from '#/api/cloudmold/commerce';

import CopyIdCell from '../../shared/copy-id-cell.vue';
import StatusTag from '../../shared/status-tag.vue';
import { commerceStatusColor } from '../status';

defineOptions({ name: 'CloudMoldCommercePaymentDetailDrawer' });

const props = defineProps<{
  open: boolean;
  paymentId: null | string;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
}>();

const loading = ref(false);
const detail = ref<CloudMoldCommerceApi.Payment | null>(null);

const openProxy = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
});

function formatMinor(minor?: null | number, currency?: string): string {
  if (minor === null || minor === undefined) {
    return '-';
  }
  const yuan = (minor / 100).toFixed(2);
  return currency ? `${yuan} ${currency}` : yuan;
}

function dash(value?: null | string): string {
  return value && value !== '' ? value : '-';
}

async function load() {
  if (!props.paymentId) {
    return;
  }
  loading.value = true;
  detail.value = null;
  try {
    detail.value = await getCloudMoldPaymentDetail(props.paymentId);
  } finally {
    loading.value = false;
  }
}

watch(
  () => [props.open, props.paymentId] as const,
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
    title="规范支付详情"
    placement="right"
    width="720"
    :destroy-on-close="true"
  >
    <Spin :spinning="loading">
      <Result
        v-if="!loading && !detail"
        status="info"
        title="未找到权威数据"
        sub-title="该支付单不存在、不属于当前租户或暂无 CloudMold 权威数据。"
      />
      <template v-else-if="detail">
        <Descriptions
          title="基础信息"
          :column="2"
          bordered
          size="small"
          class="mb-4"
        >
          <DescriptionsItem label="支付单号">
            <CopyIdCell :value="detail.paymentNo" label="支付单号" />
          </DescriptionsItem>
          <DescriptionsItem label="支付 ID">
            <CopyIdCell :value="detail.paymentId" label="支付 ID" />
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
          <DescriptionsItem label="通道模式">
            <Tag :color="detail.testMode ? 'warning' : 'success'">
              {{ detail.testMode ? 'INTERNAL_TEST' : '真实通道' }}
            </Tag>
          </DescriptionsItem>
          <DescriptionsItem label="执行语义">
            {{ dash(detail.executionMode) }}
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
          <DescriptionsItem label="应付金额">
            {{ formatMinor(detail.payableAmountMinor, detail.currencyCode) }}
          </DescriptionsItem>
          <DescriptionsItem label="已收金额">
            {{ formatMinor(detail.capturedAmountMinor, detail.currencyCode) }}
          </DescriptionsItem>
          <DescriptionsItem label="已退金额">
            {{ formatMinor(detail.refundedAmountMinor, detail.currencyCode) }}
          </DescriptionsItem>
          <DescriptionsItem label="可退余额">
            {{ formatMinor(detail.remainingAmountMinor, detail.currencyCode) }}
          </DescriptionsItem>
        </Descriptions>

        <Descriptions
          title="支付通道"
          :column="2"
          bordered
          size="small"
          class="mb-4"
        >
          <DescriptionsItem label="支付提供方">
            {{ dash(detail.providerCode) }}
          </DescriptionsItem>
          <DescriptionsItem label="提供方流水（脱敏）">
            {{ dash(detail.providerTransactionReferenceMasked) }}
          </DescriptionsItem>
        </Descriptions>

        <Descriptions title="时间戳" :column="2" bordered size="small">
          <DescriptionsItem label="收款时间">
            {{ detail.capturedAt ? formatDateTime(detail.capturedAt) : '-' }}
          </DescriptionsItem>
          <DescriptionsItem label="退款时间">
            {{ detail.refundedAt ? formatDateTime(detail.refundedAt) : '-' }}
          </DescriptionsItem>
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
