<script lang="ts" setup>
import type { CloudMoldCatalogApi } from '#/api/cloudmold/catalog';

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

import { getCloudMoldCatalogSkuDetail } from '#/api/cloudmold/catalog';

import CopyIdCell from '../shared/copy-id-cell.vue';
import StatusTag from '../shared/status-tag.vue';
import { catalogStatusMeta } from './data';

import '../shared/detail-layout.css';

defineOptions({ name: 'CloudMoldCatalogDetailDrawer' });

const props = defineProps<{
  open: boolean;
  skuId: null | string;
}>();

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
}>();

const loading = ref(false);
const detail = ref<CloudMoldCatalogApi.SkuDetail | null>(null);

const openProxy = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
});

function statusMeta(status?: number) {
  if (status === undefined || status === null) {
    return { color: 'default', label: 'UNKNOWN' };
  }
  return (
    catalogStatusMeta[status] ?? {
      color: 'default',
      label: `未知 (${status})`,
    }
  );
}

const barcodeColumns = [
  { title: '条码', dataIndex: 'barcode', key: 'barcode' },
  { title: '类型', dataIndex: 'barcodeType', key: 'barcodeType', width: 110 },
  { title: '主用', dataIndex: 'isPrimary', key: 'isPrimary', width: 80 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '生效开始', dataIndex: 'validFrom', key: 'validFrom' },
  { title: '生效结束', dataIndex: 'validTo', key: 'validTo' },
];

async function load() {
  if (!props.skuId) {
    return;
  }
  loading.value = true;
  detail.value = null;
  try {
    detail.value = await getCloudMoldCatalogSkuDetail(props.skuId);
  } finally {
    loading.value = false;
  }
}

watch(
  () => [props.open, props.skuId] as const,
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
    title="商品详情"
    placement="right"
    width="min(920px, calc(100vw - 24px))"
    :destroy-on-close="true"
  >
    <Spin :spinning="loading">
      <Result
        v-if="!loading && !detail"
        status="info"
        title="未找到商品"
        sub-title="该商品不存在，或当前账号没有查看权限。"
      />
      <template v-else-if="detail">
        <Descriptions
          title="基础信息"
          :column="2"
          bordered
          size="small"
          class="mb-4"
        >
          <DescriptionsItem label="规范 SKU">
            <CopyIdCell :value="detail.skuCode" label="规范 SKU" />
          </DescriptionsItem>
          <DescriptionsItem label="SKU ID">
            <CopyIdCell :value="detail.canonicalSkuId" label="SKU ID" />
          </DescriptionsItem>
          <DescriptionsItem label="商品名称" :span="2">
            {{ detail.productName }}
          </DescriptionsItem>
          <DescriptionsItem label="基础 UOM">
            {{ detail.baseUomCode }}
          </DescriptionsItem>
          <DescriptionsItem label="主条码">
            {{ detail.primaryBarcode ?? '-' }}
          </DescriptionsItem>
          <DescriptionsItem label="生命周期">
            <StatusTag v-bind="statusMeta(detail.catalogStatus)" />
          </DescriptionsItem>
          <DescriptionsItem label="聚合版本">
            {{ detail.aggregateVersion }}
          </DescriptionsItem>
        </Descriptions>

        <Descriptions
          title="规格归属"
          :column="2"
          bordered
          size="small"
          class="mb-4"
        >
          <DescriptionsItem label="款式">
            {{ detail.styleName }} ({{ detail.styleCode }})
          </DescriptionsItem>
          <DescriptionsItem label="款式 ID">
            <CopyIdCell :value="detail.canonicalStyleId" label="款式 ID" />
          </DescriptionsItem>
          <DescriptionsItem label="SPU">
            {{ detail.spuCode }}
          </DescriptionsItem>
          <DescriptionsItem label="SPU ID">
            <CopyIdCell :value="detail.canonicalSpuId" label="SPU ID" />
          </DescriptionsItem>
          <DescriptionsItem label="颜色">
            {{ detail.colorName }} ({{ detail.colorCode }})
          </DescriptionsItem>
          <DescriptionsItem label="颜色 ID">
            {{ detail.colorId ?? '-' }}
          </DescriptionsItem>
          <DescriptionsItem label="尺码">
            {{ detail.sizeName }} ({{ detail.sizeCode }})
          </DescriptionsItem>
          <DescriptionsItem label="尺码组">
            {{ detail.sizeGroupCode }}
          </DescriptionsItem>
          <DescriptionsItem label="规格键" :span="2">
            {{ detail.variantKey ?? '-' }}
          </DescriptionsItem>
          <DescriptionsItem label="规格键哈希" :span="2">
            {{ detail.variantKeyHash ?? '-' }}
          </DescriptionsItem>
        </Descriptions>

        <div class="mb-2 mt-4 font-medium">条码列表</div>
        <Table
          :columns="barcodeColumns"
          :data-source="detail.barcodes"
          :pagination="false"
          row-key="barcodeId"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'isPrimary'">
              {{ record.isPrimary ? '是' : '否' }}
            </template>
            <template v-else-if="column.dataIndex === 'status'">
              <StatusTag v-bind="statusMeta(record.status)" />
            </template>
            <template v-else-if="column.dataIndex === 'validFrom'">
              {{ record.validFrom ? formatDateTime(record.validFrom) : '-' }}
            </template>
            <template v-else-if="column.dataIndex === 'validTo'">
              {{ record.validTo ? formatDateTime(record.validTo) : '-' }}
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
