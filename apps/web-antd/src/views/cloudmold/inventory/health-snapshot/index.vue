<script lang="ts" setup>
import type { CloudMoldSupplyPlanningApi } from '#/api/cloudmold/supply-planning';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  executeInventoryHealthSnapshotCommand,
  getInventoryHealthSnapshot,
  getInventoryHealthSnapshotPage,
} from '#/api/cloudmold/supply-planning';

import StatusTag from '../../shared/status-tag.vue';

defineOptions({ name: 'CloudMoldInventoryHealthSnapshot' });

const loading = ref(false);
const loadError = ref('');
const rows = ref<CloudMoldSupplyPlanningApi.InventoryHealthSnapshot[]>([]);
const total = ref(0);
const pageNo = ref(1);
const pageSize = ref(20);
const detailOpen = ref(false);
const detailLoading = ref(false);
const detail = ref<CloudMoldSupplyPlanningApi.InventoryHealthSnapshot>();
const createOpen = ref(false);
const createLoading = ref(false);

const query = reactive({
  keyword: '',
  policyId: '',
});

const form = reactive({
  agedCount: 0,
  atRiskQuantity: 0,
  excessQuantity: 0,
  issueIds: '',
  ledgerWatermarkOccurredAt: dayjs(),
  ledgerWatermarkRef: '',
  lowStockCount: 0,
  obsoleteCount: 0,
  overstockCount: 0,
  policyId: '',
  policyVersionId: '',
  shelfLifeRiskCount: 0,
  shortageQuantity: 0,
  stockoutCount: 0,
});

const columns = [
  { key: 'code', title: '快照编码', width: 220 },
  { key: 'policy', title: '策略引用', width: 260 },
  { key: 'metrics', title: '风险摘要', width: 420 },
  { key: 'status', title: '状态', width: 160 },
  { key: 'createdAt', title: '创建时间', width: 180 },
  { key: 'action', title: '操作', width: 120, fixed: 'right' as const },
];

const stockoutTotal = computed(() =>
  rows.value.reduce((sum, row) => sum + row.stockoutCount, 0),
);
const lowStockTotal = computed(() =>
  rows.value.reduce((sum, row) => sum + row.lowStockCount, 0),
);
const overstockTotal = computed(() =>
  rows.value.reduce((sum, row) => sum + row.overstockCount, 0),
);
const issueTotal = computed(() =>
  rows.value.reduce((sum, row) => sum + row.issueCount, 0),
);

function statusMeta(status: string) {
  return {
    color: status === 'CAPTURED' ? 'success' : 'processing',
    label: status,
  };
}

function formatDecimal(value: number | string | undefined) {
  if (value === undefined || value === null || value === '') return '-';
  return String(value).replace(/(\.\d*?[1-9])0+$|\.0+$/, '$1');
}

async function sha256Hex(payload: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
}

async function loadPage() {
  loading.value = true;
  loadError.value = '';
  try {
    const result = await getInventoryHealthSnapshotPage({
      keyword: query.keyword.trim() || undefined,
      pageNo: pageNo.value,
      pageSize: pageSize.value,
      policyId: query.policyId.trim() || undefined,
    });
    rows.value = result.list;
    total.value = result.total;
  } catch (error) {
    loadError.value =
      error instanceof Error ? error.message : '库存健康快照加载失败';
  } finally {
    loading.value = false;
  }
}

function search() {
  pageNo.value = 1;
  void loadPage();
}

function reset() {
  query.keyword = '';
  query.policyId = '';
  pageNo.value = 1;
  void loadPage();
}

function changePage(page: number, size: number) {
  pageNo.value = page;
  pageSize.value = size;
  void loadPage();
}

async function openDetail(snapshotId: string) {
  detailOpen.value = true;
  detailLoading.value = true;
  detail.value = undefined;
  try {
    detail.value = await getInventoryHealthSnapshot(snapshotId);
  } catch (error) {
    message.error(error instanceof Error ? error.message : '快照详情加载失败');
  } finally {
    detailLoading.value = false;
  }
}

function resetForm() {
  form.agedCount = 0;
  form.atRiskQuantity = 0;
  form.excessQuantity = 0;
  form.issueIds = '';
  form.ledgerWatermarkOccurredAt = dayjs();
  form.ledgerWatermarkRef = '';
  form.lowStockCount = 0;
  form.obsoleteCount = 0;
  form.overstockCount = 0;
  form.policyId = '';
  form.policyVersionId = '';
  form.shelfLifeRiskCount = 0;
  form.shortageQuantity = 0;
  form.stockoutCount = 0;
}

function openCreate() {
  resetForm();
  createOpen.value = true;
}

async function createSnapshot() {
  createLoading.value = true;
  try {
    const snapshot = {
      agedCount: form.agedCount,
      atRiskQuantity: String(form.atRiskQuantity),
      excessQuantity: String(form.excessQuantity),
      issueRefs: form.issueIds
        .split(/[\n,]/)
        .map((value) => value.trim())
        .filter(Boolean)
        .map((issueId) => ({ issueId })),
      ledgerWatermarkOccurredAt: form.ledgerWatermarkOccurredAt.toISOString(),
      ledgerWatermarkRef: form.ledgerWatermarkRef.trim(),
      lowStockCount: form.lowStockCount,
      obsoleteCount: form.obsoleteCount,
      overstockCount: form.overstockCount,
      policyId: form.policyId.trim(),
      policyVersionId: form.policyVersionId.trim(),
      shelfLifeRiskCount: form.shelfLifeRiskCount,
      shortageQuantity: String(form.shortageQuantity),
      snapshotCode: `HSHOT-${Date.now()}`,
      snapshotId: crypto.randomUUID(),
      snapshotSha256: '',
      stockoutCount: form.stockoutCount,
    };
    snapshot.snapshotSha256 = await sha256Hex(snapshot);
    await executeInventoryHealthSnapshotCommand({ snapshot });
    message.success('库存健康快照已创建');
    createOpen.value = false;
    await loadPage();
  } catch (error) {
    message.error(
      error instanceof Error ? error.message : '库存健康快照创建失败',
    );
  } finally {
    createLoading.value = false;
  }
}

onMounted(loadPage);
</script>

<template>
  <Page
    description="把某一版已发布安全库存策略下的库存健康诊断冻结为不可变快照，承接库存风险与控制分析。"
    title="库存健康快照"
  >
    <Alert
      class="mb-4"
      message="库存健康正式快照"
      description="每次快照都绑定策略版本、水位引用、聚合指标和问题引用，作为库存控制域的正式证据。"
      show-icon
      type="info"
    />

    <Row :gutter="16" class="mb-4">
      <Col :lg="6" :xs="12">
        <Card><Statistic title="缺货项合计" :value="stockoutTotal" /></Card>
      </Col>
      <Col :lg="6" :xs="12">
        <Card><Statistic title="低库存项合计" :value="lowStockTotal" /></Card>
      </Col>
      <Col :lg="6" :xs="12">
        <Card><Statistic title="超储项合计" :value="overstockTotal" /></Card>
      </Col>
      <Col :lg="6" :xs="12">
        <Card><Statistic title="问题引用合计" :value="issueTotal" /></Card>
      </Col>
    </Row>

    <Card class="mb-4">
      <Space wrap>
        <Input
          v-model:value="query.keyword"
          allow-clear
          placeholder="搜索快照编码、策略版本或账本水位"
          style="width: 320px"
          @press-enter="search"
        />
        <Input
          v-model:value="query.policyId"
          allow-clear
          placeholder="按策略 ID 过滤"
          style="width: 220px"
          @press-enter="search"
        />
        <Button type="primary" @click="search">查询</Button>
        <Button @click="reset">重置</Button>
        <Button
          v-access:code="['cloudmold:supply-planning:health-snapshot:command']"
          type="primary"
          @click="openCreate"
        >
          新建快照
        </Button>
      </Space>
    </Card>

    <Card title="快照列表">
      <template #extra>
        <Tag color="blue">Snapshot</Tag>
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
        row-key="snapshotId"
        :scroll="{ x: 1380 }"
        @change="
          (pagination) =>
            changePage(pagination.current ?? 1, pagination.pageSize ?? 20)
        "
      >
        <template #emptyText><Empty description="暂无库存健康快照" /></template>
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'code'">
            <div class="font-medium text-primary">
              {{ record.snapshotCode }}
            </div>
            <div class="text-xs text-muted-foreground">
              {{ record.snapshotId }}
            </div>
          </template>
          <template v-else-if="column.key === 'policy'">
            <div>{{ record.policyCode }}</div>
            <div class="text-xs text-muted-foreground">
              {{ record.policyId }} · V{{ record.policyVersion }}
            </div>
          </template>
          <template v-else-if="column.key === 'metrics'">
            <div>
              缺货 {{ record.stockoutCount }} · 低库存
              {{ record.lowStockCount }} · 超储 {{ record.overstockCount }}
            </div>
            <div class="text-xs text-muted-foreground">
              缺口 {{ formatDecimal(record.shortageQuantity) }} · 超额
              {{ formatDecimal(record.excessQuantity) }} · 风险
              {{ formatDecimal(record.atRiskQuantity) }}
            </div>
          </template>
          <template v-else-if="column.key === 'status'">
            <StatusTag v-bind="statusMeta(record.status)" />
          </template>
          <template v-else-if="column.key === 'createdAt'">
            {{ record.createdAt }}
          </template>
          <template v-else-if="column.key === 'action'">
            <Button
              type="link"
              size="small"
              @click="openDetail(record.snapshotId)"
            >
              详情
            </Button>
          </template>
        </template>
      </Table>
    </Card>

    <Drawer
      v-model:open="detailOpen"
      destroy-on-close
      :title="
        detail
          ? `${detail.snapshotCode} · ${detail.policyCode}`
          : '库存健康快照详情'
      "
      width="960"
    >
      <template v-if="detailLoading">
        <Card loading />
      </template>
      <template v-else-if="detail">
        <Descriptions :column="2" bordered size="small">
          <Descriptions.Item label="快照编码">
            {{ detail.snapshotCode }}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <StatusTag v-bind="statusMeta(detail.status)" />
          </Descriptions.Item>
          <Descriptions.Item label="策略">
            {{ detail.policyCode }}
          </Descriptions.Item>
          <Descriptions.Item label="策略版本">
            {{ detail.policyVersionId }} · V{{ detail.policyVersion }}
          </Descriptions.Item>
          <Descriptions.Item label="账本水位">
            {{ detail.ledgerWatermarkRef }}
          </Descriptions.Item>
          <Descriptions.Item label="水位时间">
            {{ detail.ledgerWatermarkOccurredAt }}
          </Descriptions.Item>
          <Descriptions.Item label="风险数量">
            缺口 {{ formatDecimal(detail.shortageQuantity) }} / 超额
            {{ formatDecimal(detail.excessQuantity) }} / 风险
            {{ formatDecimal(detail.atRiskQuantity) }}
          </Descriptions.Item>
          <Descriptions.Item label="问题数量">
            缺货 {{ detail.stockoutCount }} · 低库存
            {{ detail.lowStockCount }} · 超储 {{ detail.overstockCount }} · 引用
            {{ detail.issueCount }}
          </Descriptions.Item>
        </Descriptions>

        <Card class="mt-4" title="问题引用">
          <Table
            :data-source="detail.issues"
            :pagination="false"
            row-key="issueId"
            size="small"
          >
            <Table.Column key="issueId" data-index="issueId" title="问题 ID" />
            <Table.Column
              key="issueType"
              data-index="issueType"
              title="类型"
              width="140"
            />
            <Table.Column
              key="severity"
              data-index="severity"
              title="严重级别"
              width="140"
            />
            <Table.Column
              key="status"
              data-index="status"
              title="状态"
              width="140"
            />
            <Table.Column
              key="sourceBalanceId"
              data-index="sourceBalanceId"
              title="来源余额"
            />
          </Table>
        </Card>
      </template>
    </Drawer>

    <Modal
      v-model:open="createOpen"
      :confirm-loading="createLoading"
      title="新建库存健康快照"
      width="860"
      @ok="createSnapshot"
    >
      <Form layout="vertical">
        <Row :gutter="16">
          <Col :span="12">
            <Form.Item label="策略 ID" required>
              <Input v-model:value="form.policyId" />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item label="策略版本 ID" required>
              <Input v-model:value="form.policyVersionId" />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item label="账本水位引用" required>
              <Input v-model:value="form.ledgerWatermarkRef" />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item label="账本水位时间" required>
              <DatePicker
                v-model:value="form.ledgerWatermarkOccurredAt"
                class="w-full"
                show-time
              />
            </Form.Item>
          </Col>
          <Col :span="6">
            <Form.Item label="缺货项">
              <InputNumber
                v-model:value="form.stockoutCount"
                :min="0"
                class="w-full"
              />
            </Form.Item>
          </Col>
          <Col :span="6">
            <Form.Item label="低库存项">
              <InputNumber
                v-model:value="form.lowStockCount"
                :min="0"
                class="w-full"
              />
            </Form.Item>
          </Col>
          <Col :span="6">
            <Form.Item label="超储项">
              <InputNumber
                v-model:value="form.overstockCount"
                :min="0"
                class="w-full"
              />
            </Form.Item>
          </Col>
          <Col :span="6">
            <Form.Item label="库龄风险项">
              <InputNumber
                v-model:value="form.agedCount"
                :min="0"
                class="w-full"
              />
            </Form.Item>
          </Col>
          <Col :span="6">
            <Form.Item label="淘汰项">
              <InputNumber
                v-model:value="form.obsoleteCount"
                :min="0"
                class="w-full"
              />
            </Form.Item>
          </Col>
          <Col :span="6">
            <Form.Item label="保质期风险项">
              <InputNumber
                v-model:value="form.shelfLifeRiskCount"
                :min="0"
                class="w-full"
              />
            </Form.Item>
          </Col>
          <Col :span="6">
            <Form.Item label="缺口数量">
              <InputNumber
                v-model:value="form.shortageQuantity"
                :min="0"
                :precision="6"
                class="w-full"
              />
            </Form.Item>
          </Col>
          <Col :span="6">
            <Form.Item label="超额数量">
              <InputNumber
                v-model:value="form.excessQuantity"
                :min="0"
                :precision="6"
                class="w-full"
              />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item label="风险数量">
              <InputNumber
                v-model:value="form.atRiskQuantity"
                :min="0"
                :precision="6"
                class="w-full"
              />
            </Form.Item>
          </Col>
          <Col :span="24">
            <Form.Item label="问题引用 ID（逗号或换行分隔）">
              <Input.TextArea v-model:value="form.issueIds" :rows="4" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  </Page>
</template>
