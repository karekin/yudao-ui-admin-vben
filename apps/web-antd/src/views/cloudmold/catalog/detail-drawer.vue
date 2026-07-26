<script lang="ts" setup>
import type { CloudMoldCatalogApi } from '#/api/cloudmold/catalog';

import { computed, ref, watch } from 'vue';

import { formatDateTime } from '@vben/utils';

import {
  Alert,
  Button,
  Descriptions,
  DescriptionsItem,
  Drawer,
  Result,
  Spin,
  Table,
} from 'ant-design-vue';

import {
  getCloudMoldCatalogSkuDetail,
  getCloudMoldSkuSellability,
} from '#/api/cloudmold/catalog';

import CopyIdCell from '../shared/copy-id-cell.vue';
import {
  getWorkbenchMeta,
  statusMeta as workbenchStatusMeta,
} from '../shared/operations-workbench';
import StatusTag from '../shared/status-tag.vue';
import {
  blockerLabel,
  catalogStatusMeta,
  qualityDecisionMeta,
  qualityStatusMeta,
  sellabilityStatusMeta,
} from './data';

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
const detailLoadFailed = ref(false);
const sellability = ref<CloudMoldCatalogApi.SkuSellability | null>(null);
const sellabilityLoadFailed = ref(false);
let loadSequence = 0;

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

function stringStatusMeta(
  metadata: Record<string, { color: string; label: string }>,
  status?: string,
) {
  if (!status) return { color: 'default', label: '未知' };
  return (
    metadata[status] ?? {
      color: 'default',
      label: `未知 (${status})`,
    }
  );
}

const standardLabel = computed(() => {
  const quality = sellability.value?.quality;
  if (!quality?.standardCode && !quality?.standardId) return '-';
  const standard = quality.standardCode ?? quality.standardId;
  return quality.standardVersion
    ? `${standard} · v${quality.standardVersion}`
    : standard;
});

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
  const sequence = ++loadSequence;
  loading.value = true;
  detail.value = null;
  detailLoadFailed.value = false;
  sellability.value = null;
  sellabilityLoadFailed.value = false;
  try {
    const [detailResult, sellabilityResult] = await Promise.allSettled([
      getCloudMoldCatalogSkuDetail(props.skuId),
      getCloudMoldSkuSellability(props.skuId),
    ]);
    if (sequence !== loadSequence) return;
    if (detailResult.status === 'fulfilled') {
      detail.value = detailResult.value;
    } else {
      detailLoadFailed.value = true;
    }
    if (sellabilityResult.status === 'fulfilled') {
      sellability.value = sellabilityResult.value;
    } else {
      sellabilityLoadFailed.value = true;
    }
  } finally {
    if (sequence === loadSequence) {
      loading.value = false;
    }
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
        v-if="!loading && detailLoadFailed"
        status="error"
        title="商品详情加载失败"
        sub-title="接口或网络暂时不可用，请重试；系统不会把故障误判为商品不存在。"
      >
        <template #extra>
          <Button type="primary" @click="load">重新加载</Button>
        </template>
      </Result>
      <Result
        v-else-if="!loading && !detail"
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
          title="质量与可售状态"
          :column="{ xs: 1, sm: 2 }"
          bordered
          size="small"
          class="mb-4"
        >
          <template v-if="sellability">
            <DescriptionsItem label="综合可售">
              <StatusTag
                v-bind="
                  sellability.sellable
                    ? sellabilityStatusMeta.sellable
                    : sellabilityStatusMeta.blocked
                "
              />
            </DescriptionsItem>
            <DescriptionsItem label="鉴别状态">
              <StatusTag
                v-bind="
                  stringStatusMeta(
                    qualityStatusMeta,
                    sellability.quality.status,
                  )
                "
              />
            </DescriptionsItem>
            <DescriptionsItem label="质检结论">
              <StatusTag
                v-bind="
                  stringStatusMeta(
                    qualityDecisionMeta,
                    sellability.quality.decision,
                  )
                "
              />
            </DescriptionsItem>
            <DescriptionsItem label="任务状态">
              <StatusTag
                v-bind="
                  getWorkbenchMeta(
                    workbenchStatusMeta,
                    sellability.quality.inspectionStatus ?? 'UNKNOWN',
                  )
                "
              />
            </DescriptionsItem>
            <DescriptionsItem label="质检任务">
              <CopyIdCell
                v-if="sellability.quality.inspectionTaskId"
                :value="sellability.quality.inspectionTaskId"
                label="质检任务"
              />
              <span v-else>-</span>
            </DescriptionsItem>
            <DescriptionsItem label="鉴别标准">
              {{ standardLabel }}
            </DescriptionsItem>
            <DescriptionsItem label="完成时间">
              {{
                sellability.quality.completedAt
                  ? formatDateTime(sellability.quality.completedAt)
                  : '-'
              }}
            </DescriptionsItem>
            <DescriptionsItem label="判定时间">
              {{
                sellability.quality.inspectedAt
                  ? formatDateTime(sellability.quality.inspectedAt)
                  : '-'
              }}
            </DescriptionsItem>
            <DescriptionsItem label="可分配库存">
              {{ sellability.inventory.allocatableQuantity }}
              {{ sellability.inventory.baseUomCode ?? detail.baseUomCode }}
            </DescriptionsItem>
            <DescriptionsItem label="渠道发布">
              {{ sellability.listing.publishedListingCount }} 个发布 /
              {{ sellability.listing.enabledOfferCount }} 个有效报价
              <span v-if="sellability.listing.channels.length">
                （{{ sellability.listing.channels.join('、') }}）
              </span>
            </DescriptionsItem>
            <DescriptionsItem
              v-if="sellability.blockingReasonCodes.length"
              label="不可售原因"
              :span="2"
            >
              {{ sellability.blockingReasonCodes.map(blockerLabel).join('；') }}
            </DescriptionsItem>
          </template>
          <DescriptionsItem v-else label="状态" :span="2">
            <Alert
              v-if="sellabilityLoadFailed"
              type="warning"
              show-icon
              message="质量与可售状态加载失败"
              description="商品主数据仍可查看，请稍后刷新；系统不会把未知状态显示为鉴别通过。"
            />
            <span v-else>加载中…</span>
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
