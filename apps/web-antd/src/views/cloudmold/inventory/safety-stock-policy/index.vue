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
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Timeline,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  executeSafetyStockPolicyCommand,
  getSafetyStockPolicy,
  getSafetyStockPolicyPage,
} from '#/api/cloudmold/supply-planning';

import StatusTag from '../../shared/status-tag.vue';

defineOptions({ name: 'CloudMoldSafetyStockPolicy' });

const loading = ref(false);
const loadError = ref('');
const rows = ref<CloudMoldSupplyPlanningApi.SafetyStockPolicy[]>([]);
const total = ref(0);
const pageNo = ref(1);
const pageSize = ref(20);
const detailOpen = ref(false);
const detailLoading = ref(false);
const detail = ref<CloudMoldSupplyPlanningApi.SafetyStockPolicy>();
const createOpen = ref(false);
const createLoading = ref(false);

const query = reactive({
  keyword: '',
  status: undefined as string | undefined,
});

const form = reactive({
  canonicalSkuId: '',
  effectiveFrom: dayjs(),
  effectiveTo: undefined as dayjs.Dayjs | undefined,
  evidenceRef: '',
  leadTimeDays: 7,
  maximumStockQuantity: 0,
  ownerId: '',
  ownerType: 'MERCHANT',
  policyBasisCode: 'MANUAL',
  policyCode: '',
  replenishmentCycleDays: 7,
  reorderPointQuantity: 0,
  safetyStockQuantity: 0,
  targetServiceLevelBasisPoints: 9500,
  warehouseNetworkId: '',
});

const statusOptions = [
  { label: '草稿', value: 'DRAFT' },
  { label: '已批准', value: 'APPROVED' },
  { label: '已发布', value: 'PUBLISHED' },
  { label: '已退役', value: 'RETIRED' },
];

const columns = [
  { key: 'code', title: '策略编码', width: 220 },
  { key: 'target', title: '目标对象', width: 320 },
  { key: 'threshold', title: '安全库存阈值', width: 260 },
  { key: 'status', title: '状态', width: 180 },
  { key: 'updatedAt', title: '更新时间', width: 180 },
  { key: 'action', title: '操作', width: 220, fixed: 'right' as const },
];

const currentDraftCount = computed(
  () => rows.value.filter((row) => row.status === 'DRAFT').length,
);
const currentApprovedCount = computed(
  () => rows.value.filter((row) => row.status === 'APPROVED').length,
);
const currentPublishedCount = computed(
  () => rows.value.filter((row) => row.status === 'PUBLISHED').length,
);
const currentRetiredCount = computed(
  () => rows.value.filter((row) => row.status === 'RETIRED').length,
);

function statusMeta(status: string) {
  let color = 'processing';
  if (status === 'PUBLISHED') color = 'success';
  if (status === 'APPROVED') color = 'warning';
  if (status === 'RETIRED') color = 'default';
  return {
    color,
    label: statusOptions.find((item) => item.value === status)?.label ?? status,
  };
}

function formatDecimal(value: number | string | undefined) {
  if (value === undefined || value === null || value === '') return '-';
  return String(value).replace(/(\.\d*?[1-9])0+$|\.0+$/, '$1');
}

function asPolicy(record: Record<string, any>) {
  return record as CloudMoldSupplyPlanningApi.SafetyStockPolicy;
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
    const result = await getSafetyStockPolicyPage({
      keyword: query.keyword.trim() || undefined,
      pageNo: pageNo.value,
      pageSize: pageSize.value,
      status: query.status,
    });
    rows.value = result.list;
    total.value = result.total;
  } catch (error) {
    loadError.value =
      error instanceof Error ? error.message : '安全库存策略加载失败';
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
  query.status = undefined;
  pageNo.value = 1;
  void loadPage();
}

function changePage(page: number, size: number) {
  pageNo.value = page;
  pageSize.value = size;
  void loadPage();
}

async function openDetail(policyId: string) {
  detailOpen.value = true;
  detailLoading.value = true;
  detail.value = undefined;
  try {
    detail.value = await getSafetyStockPolicy(policyId);
  } catch (error) {
    message.error(error instanceof Error ? error.message : '策略详情加载失败');
  } finally {
    detailLoading.value = false;
  }
}

function policyActions(row: CloudMoldSupplyPlanningApi.SafetyStockPolicy) {
  if (row.status === 'DRAFT') {
    return [{ label: '批准', operation: 'APPROVE' }];
  }
  if (row.status === 'APPROVED') {
    return [{ label: '发布', operation: 'PUBLISH' }];
  }
  if (row.status === 'PUBLISHED') {
    return [{ label: '退役', operation: 'RETIRE' }];
  }
  return [];
}

async function runPolicyOperation(
  row: CloudMoldSupplyPlanningApi.SafetyStockPolicy,
  operation: CloudMoldSupplyPlanningApi.SafetyStockPolicyOperation,
) {
  const fullDetail =
    detail.value?.policyId === row.policyId
      ? detail.value
      : await getSafetyStockPolicy(row.policyId);
  const hide = message.loading({
    content: `正在执行${operation}…`,
    duration: 0,
  });
  try {
    await executeSafetyStockPolicyCommand({
      operation,
      policy: {
        canonicalSkuId: fullDetail.canonicalSkuId,
        effectiveFrom: fullDetail.effectiveFrom,
        effectiveTo: fullDetail.effectiveTo,
        evidenceRef: fullDetail.evidenceRef,
        expectedVersion: fullDetail.currentVersion,
        leadTimeDays: fullDetail.leadTimeDays,
        maximumStockQuantity: fullDetail.maximumStockQuantity,
        ownerId: fullDetail.ownerId,
        ownerType: fullDetail.ownerType,
        policyBasisCode: fullDetail.policyBasisCode,
        policyCode: fullDetail.policyCode,
        policyId: fullDetail.policyId,
        policySha256: fullDetail.policySha256,
        reorderPointQuantity: fullDetail.reorderPointQuantity,
        replenishmentCycleDays: fullDetail.replenishmentCycleDays,
        safetyStockQuantity: fullDetail.safetyStockQuantity,
        targetServiceLevelBasisPoints: fullDetail.targetServiceLevelBasisPoints,
        warehouseNetworkId: fullDetail.warehouseNetworkId,
      },
    });
    message.success('策略状态已更新');
    await loadPage();
    if (detailOpen.value) {
      await openDetail(row.policyId);
    }
  } catch (error) {
    message.error(error instanceof Error ? error.message : '策略命令执行失败');
  } finally {
    hide();
  }
}

function resetCreateForm() {
  form.canonicalSkuId = '';
  form.effectiveFrom = dayjs();
  form.effectiveTo = undefined;
  form.evidenceRef = '';
  form.leadTimeDays = 7;
  form.maximumStockQuantity = 0;
  form.ownerId = '';
  form.ownerType = 'MERCHANT';
  form.policyBasisCode = 'MANUAL';
  form.policyCode = '';
  form.replenishmentCycleDays = 7;
  form.reorderPointQuantity = 0;
  form.safetyStockQuantity = 0;
  form.targetServiceLevelBasisPoints = 9500;
  form.warehouseNetworkId = '';
}

function openCreate() {
  resetCreateForm();
  createOpen.value = true;
}

async function createDraftPolicy() {
  createLoading.value = true;
  try {
    const policyPayload = {
      canonicalSkuId: form.canonicalSkuId.trim(),
      effectiveFrom: form.effectiveFrom.format('YYYY-MM-DD'),
      effectiveTo: form.effectiveTo?.format('YYYY-MM-DD'),
      evidenceRef: form.evidenceRef.trim() || undefined,
      expectedVersion: undefined,
      leadTimeDays: form.leadTimeDays,
      maximumStockQuantity: String(form.maximumStockQuantity),
      ownerId: form.ownerId.trim(),
      ownerType: form.ownerType,
      policyBasisCode: form.policyBasisCode.trim(),
      policyCode: form.policyCode.trim() || `POL-${Date.now()}`,
      policyId: crypto.randomUUID(),
      policySha256: '',
      reorderPointQuantity: String(form.reorderPointQuantity),
      replenishmentCycleDays: form.replenishmentCycleDays,
      safetyStockQuantity: String(form.safetyStockQuantity),
      targetServiceLevelBasisPoints: form.targetServiceLevelBasisPoints,
      warehouseNetworkId: form.warehouseNetworkId.trim(),
    };
    policyPayload.policySha256 = await sha256Hex(policyPayload);
    await executeSafetyStockPolicyCommand({
      operation: 'SAVE_DRAFT',
      policy: policyPayload,
    });
    message.success('草稿策略已创建');
    createOpen.value = false;
    await loadPage();
  } catch (error) {
    message.error(error instanceof Error ? error.message : '策略草稿创建失败');
  } finally {
    createLoading.value = false;
  }
}

onMounted(loadPage);
</script>

<template>
  <Page
    description="把安全库存、订货点、目标服务水平和发布历史固定为正式策略对象，供库存控制与库存健康快照调用。"
    title="安全库存策略"
  >
    <Alert
      class="mb-4"
      message="库存控制正式契约"
      description="本页只读写 Safety Stock Policy 正式契约，不再把安全库存口径散落在预测、补货或库存健康页里。"
      show-icon
      type="info"
    />

    <Row :gutter="16" class="mb-4">
      <Col :lg="6" :xs="12">
        <Card><Statistic title="当前页草稿" :value="currentDraftCount" /></Card>
      </Col>
      <Col :lg="6" :xs="12">
        <Card>
          <Statistic title="当前页待发布" :value="currentApprovedCount" />
        </Card>
      </Col>
      <Col :lg="6" :xs="12">
        <Card>
          <Statistic title="当前页已发布" :value="currentPublishedCount" />
        </Card>
      </Col>
      <Col :lg="6" :xs="12">
        <Card>
          <Statistic title="当前页已退役" :value="currentRetiredCount" />
        </Card>
      </Col>
    </Row>

    <Card class="mb-4">
      <Space wrap>
        <Input
          v-model:value="query.keyword"
          allow-clear
          placeholder="搜索策略编码、货主、SKU 或仓网"
          style="width: 320px"
          @press-enter="search"
        />
        <Select
          v-model:value="query.status"
          allow-clear
          :options="statusOptions"
          placeholder="全部状态"
          style="width: 180px"
        />
        <Button type="primary" @click="search">查询</Button>
        <Button @click="reset">重置</Button>
        <Button
          v-access:code="['cloudmold:supply-planning:policy:command']"
          type="primary"
          @click="openCreate"
        >
          新建策略
        </Button>
      </Space>
    </Card>

    <Card title="策略列表">
      <template #extra>
        <Tag color="blue">Policy</Tag>
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
        row-key="policyId"
        :scroll="{ x: 1380 }"
        @change="
          (pagination) =>
            changePage(pagination.current ?? 1, pagination.pageSize ?? 20)
        "
      >
        <template #emptyText><Empty description="暂无安全库存策略" /></template>
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'code'">
            <div class="font-medium text-primary">{{ record.policyCode }}</div>
            <div class="text-xs text-muted-foreground">
              {{ record.policyId }}
            </div>
          </template>
          <template v-else-if="column.key === 'target'">
            <div>{{ record.ownerType }} / {{ record.ownerId }}</div>
            <div class="text-xs text-muted-foreground">
              SKU {{ record.canonicalSkuId }} · 仓网
              {{ record.warehouseNetworkId }}
            </div>
          </template>
          <template v-else-if="column.key === 'threshold'">
            <div>安全库存 {{ formatDecimal(record.safetyStockQuantity) }}</div>
            <div class="text-xs text-muted-foreground">
              订货点 {{ formatDecimal(record.reorderPointQuantity) }} · 最大
              {{ formatDecimal(record.maximumStockQuantity) }}
            </div>
          </template>
          <template v-else-if="column.key === 'status'">
            <StatusTag v-bind="statusMeta(record.status)" />
            <div class="text-xs text-muted-foreground">
              版本 {{ record.currentVersion }}
            </div>
          </template>
          <template v-else-if="column.key === 'updatedAt'">
            {{ record.updatedAt }}
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button
                type="link"
                size="small"
                @click="openDetail(record.policyId)"
              >
                详情
              </Button>
              <template
                v-for="action in policyActions(asPolicy(record))"
                :key="action.operation"
              >
                <Button
                  v-access:code="['cloudmold:supply-planning:policy:command']"
                  size="small"
                  type="link"
                  @click="
                    runPolicyOperation(
                      asPolicy(record),
                      action.operation as never,
                    )
                  "
                >
                  {{ action.label }}
                </Button>
              </template>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <Drawer
      v-model:open="detailOpen"
      destroy-on-close
      :title="
        detail
          ? `${detail.policyCode} · ${detail.ownerType}/${detail.ownerId}`
          : '安全库存策略详情'
      "
      width="960"
    >
      <template v-if="detailLoading">
        <Card loading />
      </template>
      <template v-else-if="detail">
        <Descriptions :column="2" bordered size="small">
          <Descriptions.Item label="策略编码">
            {{ detail.policyCode }}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <StatusTag v-bind="statusMeta(detail.status)" />
          </Descriptions.Item>
          <Descriptions.Item label="货主">
            {{ detail.ownerType }} / {{ detail.ownerId }}
          </Descriptions.Item>
          <Descriptions.Item label="规范 SKU">
            {{ detail.canonicalSkuId }}
          </Descriptions.Item>
          <Descriptions.Item label="仓网">
            {{ detail.warehouseNetworkId }}
          </Descriptions.Item>
          <Descriptions.Item label="目标服务水平">
            {{ detail.targetServiceLevelBasisPoints / 100 }}%
          </Descriptions.Item>
          <Descriptions.Item label="安全库存">
            {{ formatDecimal(detail.safetyStockQuantity) }}
          </Descriptions.Item>
          <Descriptions.Item label="订货点">
            {{ formatDecimal(detail.reorderPointQuantity) }}
          </Descriptions.Item>
          <Descriptions.Item label="最大库存">
            {{ formatDecimal(detail.maximumStockQuantity) }}
          </Descriptions.Item>
          <Descriptions.Item label="补货周期 / 交期">
            {{ detail.replenishmentCycleDays }} 天 /
            {{ detail.leadTimeDays }} 天
          </Descriptions.Item>
        </Descriptions>

        <Card class="mt-4" title="版本历史">
          <Timeline>
            <Timeline.Item
              v-for="version in detail.history"
              :key="version.policyVersionId"
            >
              <div class="font-medium">
                V{{ version.version }} · {{ statusMeta(version.status).label }}
              </div>
              <div class="text-xs text-muted-foreground">
                {{ version.createdAt }} ·
                {{ version.actorPrincipalId ?? 'SYSTEM' }}
              </div>
            </Timeline.Item>
          </Timeline>
        </Card>
      </template>
    </Drawer>

    <Modal
      v-model:open="createOpen"
      :confirm-loading="createLoading"
      title="新建安全库存策略"
      width="860"
      @ok="createDraftPolicy"
    >
      <Form layout="vertical">
        <Row :gutter="16">
          <Col :span="12">
            <Form.Item label="策略编码">
              <Input
                v-model:value="form.policyCode"
                placeholder="可留空自动生成"
              />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item label="策略依据码" required>
              <Input v-model:value="form.policyBasisCode" />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item label="货主类型" required>
              <Input v-model:value="form.ownerType" />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item label="货主 ID" required>
              <Input v-model:value="form.ownerId" />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item label="规范 SKU ID" required>
              <Input v-model:value="form.canonicalSkuId" />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item label="仓网 ID" required>
              <Input v-model:value="form.warehouseNetworkId" />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item label="生效开始日" required>
              <DatePicker v-model:value="form.effectiveFrom" class="w-full" />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item label="生效结束日">
              <DatePicker v-model:value="form.effectiveTo" class="w-full" />
            </Form.Item>
          </Col>
          <Col :span="8">
            <Form.Item label="目标服务水平 (bp)" required>
              <InputNumber
                v-model:value="form.targetServiceLevelBasisPoints"
                :min="0"
                :max="10000"
                class="w-full"
              />
            </Form.Item>
          </Col>
          <Col :span="8">
            <Form.Item label="安全库存" required>
              <InputNumber
                v-model:value="form.safetyStockQuantity"
                :min="0"
                :precision="6"
                class="w-full"
              />
            </Form.Item>
          </Col>
          <Col :span="8">
            <Form.Item label="订货点" required>
              <InputNumber
                v-model:value="form.reorderPointQuantity"
                :min="0"
                :precision="6"
                class="w-full"
              />
            </Form.Item>
          </Col>
          <Col :span="8">
            <Form.Item label="最大库存" required>
              <InputNumber
                v-model:value="form.maximumStockQuantity"
                :min="0"
                :precision="6"
                class="w-full"
              />
            </Form.Item>
          </Col>
          <Col :span="8">
            <Form.Item label="补货周期 (天)" required>
              <InputNumber
                v-model:value="form.replenishmentCycleDays"
                :min="1"
                class="w-full"
              />
            </Form.Item>
          </Col>
          <Col :span="8">
            <Form.Item label="交期 (天)" required>
              <InputNumber
                v-model:value="form.leadTimeDays"
                :min="1"
                class="w-full"
              />
            </Form.Item>
          </Col>
          <Col :span="24">
            <Form.Item label="证据引用">
              <Input
                v-model:value="form.evidenceRef"
                placeholder="evidence:policy-001"
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  </Page>
</template>
