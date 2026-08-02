<script lang="ts" setup>
import type { CloudMoldWarehouseApi } from '#/api/cloudmold/warehouse';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Empty,
  Input,
  message,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Timeline,
} from 'ant-design-vue';

import {
  getCloudMoldStockTransfer,
  getCloudMoldStockTransferPage,
} from '#/api/cloudmold/warehouse';

import { cloudMoldStatusMeta } from '../shared/status-meta';

defineOptions({ name: 'CloudMoldStockTransfer' });

const loading = ref(false);
const detailLoading = ref(false);
const loadError = ref('');
const rows = ref<CloudMoldWarehouseApi.StockTransferPageItem[]>([]);
const total = ref(0);
const pageNo = ref(1);
const pageSize = ref(20);
const keyword = ref('');
const orderStatus = ref<string>();
const detailOpen = ref(false);
const detail = ref<CloudMoldWarehouseApi.StockTransferDetail>();

const statusOptions = [
  { label: '待出库', value: 'PREPARE' },
  { label: '已下达', value: 'RELEASED' },
  { label: '运输中', value: 'IN_TRANSIT' },
  { label: '已完成', value: 'COMPLETED' },
  { label: '已取消', value: 'CANCELED' },
];

const columns = [
  { key: 'document', title: '调拨单据', width: 210 },
  { key: 'route', title: '调拨路径', width: 280 },
  { key: 'quantity', title: '行项目 / 计划数量', width: 180 },
  { key: 'source', title: '来源业务', width: 210 },
  { key: 'status', title: '业务状态', width: 160 },
  { dataIndex: 'ownerId', key: 'ownerId', title: '负责人', width: 150 },
  { dataIndex: 'updatedAt', key: 'updatedAt', title: '更新时间', width: 180 },
  { key: 'action', title: '操作', width: 80 },
];

const currentPagePending = computed(
  () => rows.value.filter((row) => row.orderStatus === 'PREPARE').length,
);
const currentPageInTransit = computed(
  () => rows.value.filter((row) => row.orderStatus === 'IN_TRANSIT').length,
);
const currentPageExceptions = computed(
  () =>
    rows.value.filter((row) => row.currentStageCode === 'MANUAL_RECONCILIATION')
      .length,
);
const currentPageCompleted = computed(
  () => rows.value.filter((row) => row.orderStatus === 'COMPLETED').length,
);

function formatQuantity(value: number | string | undefined, uomCode?: string) {
  if (value === undefined || value === null) return '-';
  return `${Number(value).toLocaleString('zh-CN')} ${uomCode ?? ''}`.trim();
}

async function loadPage() {
  loading.value = true;
  loadError.value = '';
  try {
    const result = await getCloudMoldStockTransferPage({
      keyword: keyword.value.trim() || undefined,
      orderStatus: orderStatus.value,
      pageNo: pageNo.value,
      pageSize: pageSize.value,
    });
    rows.value = result.list;
    total.value = result.total;
  } catch (error) {
    loadError.value =
      error instanceof Error ? error.message : '调拨单据加载失败';
  } finally {
    loading.value = false;
  }
}

function search() {
  pageNo.value = 1;
  void loadPage();
}

function reset() {
  keyword.value = '';
  orderStatus.value = undefined;
  pageNo.value = 1;
  void loadPage();
}

function changePage(page: number, size: number) {
  pageNo.value = page;
  pageSize.value = size;
  void loadPage();
}

async function openDetail(row: Record<string, unknown>) {
  const requestId = String(row.requestId ?? '');
  if (!requestId) {
    message.error('规范调拨申请 ID 缺失');
    return;
  }
  detailOpen.value = true;
  detailLoading.value = true;
  detail.value = undefined;
  try {
    detail.value = await getCloudMoldStockTransfer(requestId);
  } catch (error) {
    message.error(error instanceof Error ? error.message : '调拨详情加载失败');
  } finally {
    detailLoading.value = false;
  }
}

onMounted(loadPage);
</script>

<template>
  <Page
    description="Warehouse 持有调拨申请、调拨单及其行级状态；Inventory 仅在规范收发确认后记账。"
    title="库存调拨"
  >
    <Alert
      class="mb-4"
      message="单据权威边界"
      description="本页只读取 CloudMold Warehouse 权威表，不跨域查询，也不存在映射、投影或降级状态。"
      show-icon
      type="info"
    />

    <Row :gutter="16" class="mb-4">
      <Col :lg="6" :xs="12">
<Card>
<Statistic title="当前页待出库" :value="currentPagePending" />
</Card>
</Col>
      <Col :lg="6" :xs="12">
<Card>
<Statistic
            title="当前页运输中"
            :value="currentPageInTransit"
/>
</Card>
</Col>
      <Col :lg="6" :xs="12">
<Card>
<Statistic
            title="当前页需复核"
            :value="currentPageExceptions"
/>
</Card>
</Col>
      <Col :lg="6" :xs="12">
<Card>
<Statistic
            title="当前页已完成"
            :value="currentPageCompleted"
/>
</Card>
</Col>
    </Row>

    <Card class="mb-4">
      <Space wrap>
        <Input
          v-model:value="keyword"
          allow-clear
          placeholder="调拨单号、规范 SKU、仓库或来源业务"
          style="width: 340px"
          @press-enter="search"
        />
        <Select
          v-model:value="orderStatus"
          allow-clear
          :options="statusOptions"
          placeholder="全部业务状态"
          style="width: 180px"
        />
        <Button type="primary" @click="search">查询</Button>
        <Button @click="reset">重置</Button>
      </Space>
    </Card>

    <Card title="调拨单列表">
      <template #extra>
        <Tag color="green">Warehouse 权威</Tag>
      </template>
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
          showSizeChanger: true,
          total,
        }"
        row-key="requestId"
        :scroll="{ x: 1450 }"
        @change="
          (pagination) =>
            changePage(pagination.current ?? 1, pagination.pageSize ?? 20)
        "
      >
        <template #emptyText><Empty description="暂无规范调拨单据" /></template>
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'document'">
            <div class="font-medium text-primary">{{ record.orderCode }}</div>
            <div class="text-xs text-muted-foreground">
              申请 {{ record.requestCode }}
            </div>
          </template>
          <template v-else-if="column.key === 'route'">
            <div class="font-medium">
              {{ record.sourceWarehouseName }} →
              {{ record.targetWarehouseName }}
            </div>
            <div class="text-xs text-muted-foreground">
              {{ record.sourceWarehouseCode }} →
              {{ record.targetWarehouseCode }}
            </div>
          </template>
          <template v-else-if="column.key === 'quantity'">
            <div>{{ record.lineCount }} 行</div>
            <div class="text-xs text-muted-foreground">
              {{
                formatQuantity(record.totalRequestedQuantity, record.uomCode)
              }}
            </div>
          </template>
          <template v-else-if="column.key === 'source'">
            <div>{{ record.sourceBusinessType }}</div>
            <div class="text-xs text-muted-foreground">
              {{ record.sourceBusinessRef }}
            </div>
          </template>
          <template v-else-if="column.key === 'status'">
            <Tag :color="cloudMoldStatusMeta(record.orderStatus).color">
              {{ record.currentStageLabel }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <Button type="link" @click="openDetail(record)">查看</Button>
          </template>
        </template>
      </Table>
    </Card>

    <Drawer v-model:open="detailOpen" title="调拨单详情" :width="920">
      <div v-if="detailLoading" class="py-10 text-center text-muted-foreground">
        正在加载规范调拨单据…
      </div>
      <template v-else-if="detail">
        <Alert
          class="mb-4"
          :message="`${detail.orderCode} · ${detail.currentStageLabel}`"
          description="Warehouse 单据是仓储执行真相；当前详情不包含任何外部系统引用。"
          show-icon
          type="success"
        />
        <Descriptions bordered :column="2" size="small">
          <Descriptions.Item label="调拨申请">
{{
            detail.requestCode
          }}
</Descriptions.Item>
          <Descriptions.Item label="调拨单">
{{
            detail.orderCode
          }}
</Descriptions.Item>
          <Descriptions.Item label="来源仓库">
{{ detail.sourceWarehouseName }}（{{
              detail.sourceWarehouseCode
            }}）
</Descriptions.Item>
          <Descriptions.Item label="目标仓库">
{{ detail.targetWarehouseName }}（{{
              detail.targetWarehouseCode
            }}）
</Descriptions.Item>
          <Descriptions.Item label="来源业务">
{{ detail.sourceBusinessType }} /
            {{ detail.sourceBusinessRef }}
</Descriptions.Item>
          <Descriptions.Item label="经营主体">
{{ detail.ownerType }} / {{ detail.ownerId }}
</Descriptions.Item>
        </Descriptions>

        <Card class="my-4" title="行项目">
          <Table
            :columns="[
              { dataIndex: 'lineNumber', title: '行号', width: 80 },
              { dataIndex: 'canonicalSkuId', title: '规范 SKU' },
              { dataIndex: 'requestedQuantity', title: '申请数量', width: 140 },
              { dataIndex: 'uomCode', title: '单位', width: 100 },
            ]"
            :data-source="detail.lines"
            :pagination="false"
            row-key="lineId"
          />
        </Card>

        <Card title="状态履历">
          <Timeline
            :items="
              detail.statusHistory.map((item) => ({
                children: `${item.stageLabel} · ${item.status} · ${item.changedAt}`,
                color: 'blue',
              }))
            "
          />
        </Card>
      </template>
    </Drawer>
  </Page>
</template>
