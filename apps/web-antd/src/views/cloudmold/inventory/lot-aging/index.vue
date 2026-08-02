<script lang="ts" setup>
import type { CloudMoldInventoryApi } from '#/api/cloudmold/inventory';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Alert,
  Button,
  Card,
  Col,
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
} from 'ant-design-vue';

import { buildCommandEnvelope } from '#/api/cloudmold/command-helpers';
import {
  captureCloudMoldInventoryAgingSnapshot,
  getCloudMoldInventoryAgingSnapshot,
  getCloudMoldInventoryAgingSnapshotPage,
  getCloudMoldInventoryLot,
  getCloudMoldInventoryLotAvailability,
} from '#/api/cloudmold/inventory';

import StatusTag from '../../shared/status-tag.vue';

defineOptions({ name: 'CloudMoldInventoryLotAging' });

const pageLoading = ref(false);
const pageError = ref('');
const snapshotRows = ref<CloudMoldInventoryApi.AgingSnapshot[]>([]);
const total = ref(0);
const pageNo = ref(1);
const pageSize = ref(20);
const activeSnapshot = ref<CloudMoldInventoryApi.AgingSnapshot>();
const snapshotDetailLoading = ref(false);

const filters = reactive({
  keyword: '',
  localKeyword: '',
  riskBucket: undefined as string | undefined,
  snapshotId: undefined as string | undefined,
  warehouseOrLocation: '',
});

const captureOpen = ref(false);
const captureLoading = ref(false);
const captureForm = reactive({
  ageAgingMaxDays: 90,
  ageFreshMaxDays: 30,
  ageStaleMaxDays: 180,
  bucketPolicyCode: 'AGING_STANDARD',
  bucketPolicyVersion: 'v1',
  expiryCriticalMaxDays: 7,
  expiryWarningMaxDays: 30,
  ownerId: '',
  ownerType: 'MERCHANT',
  warehouseId: '',
});

const lotDrawerOpen = ref(false);
const lotLoading = ref(false);
const lot = ref<CloudMoldInventoryApi.Lot>();
const lotAvailability = ref<CloudMoldInventoryApi.LotAvailability[]>([]);

const riskOptions = [
  { label: '全部风险分类', value: undefined },
  { label: '临界效期', value: 'EXPIRY_CRITICAL' },
  { label: '效期预警', value: 'EXPIRY_WARNING' },
  { label: '库龄关注', value: 'AGE_ATTENTION' },
  { label: '库龄淘汰', value: 'AGE_OBSOLETE' },
  { label: '质量风险', value: 'QUALITY_AT_RISK' },
  { label: '库存受限', value: 'STOCK_RESTRICTED' },
  { label: '信息未知', value: 'UNKNOWN' },
  { label: '健康', value: 'HEALTHY' },
];

const snapshotOptions = computed(() =>
  snapshotRows.value.map((item) => ({
    label: `${item.snapshotCode} · ${item.snapshotDate}`,
    value: item.snapshotId,
  })),
);

const visibleLines = computed(() => {
  const lines = activeSnapshot.value?.lines ?? [];
  return lines.filter((line) => {
    const keyword = filters.localKeyword.trim().toLowerCase();
    const warehouseFilter = filters.warehouseOrLocation.trim().toLowerCase();
    const risk = classifyRisk(line);

    const keywordMatch =
      !keyword ||
      [
        line.canonicalSkuId,
        line.lotCode,
        line.lotId,
        line.balanceId,
        line.warehouseId,
        line.locationId,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));

    const warehouseMatch =
      !warehouseFilter ||
      [line.warehouseId, line.locationId]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(warehouseFilter));

    const riskMatch = !filters.riskBucket || risk === filters.riskBucket;
    return keywordMatch && warehouseMatch && riskMatch;
  });
});

const currentSnapshotMetrics = computed(() => {
  const snapshot = activeSnapshot.value;
  return {
    lineCount: snapshot?.lineCount ?? 0,
    snapshotVersion: snapshot?.snapshotVersion ?? 0,
    unknownAgeCount: snapshot?.unknownAgeCount ?? 0,
    unknownExpiryCount: snapshot?.unknownExpiryCount ?? 0,
  };
});

function classifyRisk(line: CloudMoldInventoryApi.AgingSnapshotLine) {
  return line.riskClassification || 'UNKNOWN';
}

function riskMeta(risk: string) {
  if (risk === 'UNKNOWN') {
    return { color: 'error', label: risk };
  }
  if (['AGE_ATTENTION', 'EXPIRY_CRITICAL', 'EXPIRY_WARNING'].includes(risk)) {
    return { color: 'warning', label: risk };
  }
  if (['AGE_OBSOLETE', 'QUALITY_AT_RISK', 'STOCK_RESTRICTED'].includes(risk)) {
    return { color: 'default', label: risk };
  }
  return { color: 'success', label: risk || 'HEALTHY' };
}

function lotStatusMeta(status?: string) {
  if (status === 'RECALLED') return { color: 'error', label: status };
  if (status === 'ACTIVE') return { color: 'success', label: status };
  if (status === 'CLOSED') return { color: 'default', label: status };
  return { color: 'processing', label: status ?? 'UNKNOWN' };
}

function formatDecimal(value: number | string | undefined) {
  if (value === undefined || value === null || value === '') return '-';
  return String(value).replace(/(\.\d*?[1-9])0+$|\.0+$/, '$1');
}

function formatAge(line: CloudMoldInventoryApi.AgingSnapshotLine) {
  if (line.ageDays === undefined || line.ageDays === null) return 'UNKNOWN';
  return `${line.ageDays} 天`;
}

function formatExpiry(line: CloudMoldInventoryApi.AgingSnapshotLine) {
  if (
    line.expiryDaysRemaining === undefined ||
    line.expiryDaysRemaining === null
  ) {
    return line.expiresOn ?? 'UNKNOWN';
  }
  return `${line.expiryDaysRemaining} 天`;
}

async function loadSnapshotPage() {
  pageLoading.value = true;
  pageError.value = '';
  try {
    const result = await getCloudMoldInventoryAgingSnapshotPage({
      keyword: filters.keyword.trim() || undefined,
      pageNo: pageNo.value,
      pageSize: pageSize.value,
    });
    snapshotRows.value = result.list;
    total.value = result.total;

    const nextSnapshotId =
      filters.snapshotId &&
      result.list.some((item) => item.snapshotId === filters.snapshotId)
        ? filters.snapshotId
        : result.list[0]?.snapshotId;
    if (nextSnapshotId) {
      filters.snapshotId = nextSnapshotId;
      await loadSnapshotDetail(nextSnapshotId);
    } else {
      activeSnapshot.value = undefined;
    }
  } catch (error) {
    pageError.value =
      error instanceof Error ? error.message : '库龄/效期快照加载失败';
    snapshotRows.value = [];
    activeSnapshot.value = undefined;
    total.value = 0;
  } finally {
    pageLoading.value = false;
  }
}

async function loadSnapshotDetail(snapshotId: string) {
  snapshotDetailLoading.value = true;
  try {
    activeSnapshot.value = await getCloudMoldInventoryAgingSnapshot(snapshotId);
  } catch (error) {
    message.error(error instanceof Error ? error.message : '快照详情读取失败');
  } finally {
    snapshotDetailLoading.value = false;
  }
}

function search() {
  pageNo.value = 1;
  void loadSnapshotPage();
}

function reset() {
  filters.keyword = '';
  filters.localKeyword = '';
  filters.riskBucket = undefined;
  filters.snapshotId = undefined;
  filters.warehouseOrLocation = '';
  pageNo.value = 1;
  void loadSnapshotPage();
}

function changePage(page: number, size: number) {
  pageNo.value = page;
  pageSize.value = size;
  void loadSnapshotPage();
}

async function openLotDetail(line: CloudMoldInventoryApi.AgingSnapshotLine) {
  if (!line.lotId || !activeSnapshot.value?.ledgerWatermarkOccurredAt) return;
  lotDrawerOpen.value = true;
  lotLoading.value = true;
  lot.value = undefined;
  lotAvailability.value = [];
  try {
    const eligibilityAt = activeSnapshot.value.ledgerWatermarkOccurredAt;
    const [lotDetail, availability] = await Promise.all([
      getCloudMoldInventoryLot(line.lotId, eligibilityAt),
      getCloudMoldInventoryLotAvailability(line.lotId, eligibilityAt),
    ]);
    lot.value = lotDetail;
    lotAvailability.value = availability;
  } catch (error) {
    message.error(error instanceof Error ? error.message : '批次详情加载失败');
  } finally {
    lotLoading.value = false;
  }
}

function openCaptureModal() {
  captureOpen.value = true;
}

async function captureSnapshot() {
  captureLoading.value = true;
  try {
    const envelope = buildCommandEnvelope();
    const command = {
      ...envelope,
      ageAgingMaxDays: captureForm.ageAgingMaxDays,
      ageFreshMaxDays: captureForm.ageFreshMaxDays,
      ageStaleMaxDays: captureForm.ageStaleMaxDays,
      bucketPolicyCode: captureForm.bucketPolicyCode.trim(),
      bucketPolicyVersion: captureForm.bucketPolicyVersion.trim(),
      expiryCriticalMaxDays: captureForm.expiryCriticalMaxDays,
      expiryWarningMaxDays: captureForm.expiryWarningMaxDays,
      ownerId: captureForm.ownerId.trim(),
      ownerType: captureForm.ownerType.trim(),
      sourceEventId: `cloudmold-admin:${envelope.idempotencyKey}`,
      warehouseId: captureForm.warehouseId.trim(),
    } satisfies CloudMoldInventoryApi.AgingSnapshotCommand;
    await captureCloudMoldInventoryAgingSnapshot(command);
    message.success('库存快照已提交');
    captureOpen.value = false;
    await loadSnapshotPage();
  } catch (error) {
    message.error(error instanceof Error ? error.message : '库存快照生成失败');
  } finally {
    captureLoading.value = false;
  }
}

watch(
  () => filters.snapshotId,
  (snapshotId) => {
    if (snapshotId) {
      void loadSnapshotDetail(snapshotId);
    }
  },
);

onMounted(() => {
  void loadSnapshotPage();
});
</script>

<template>
  <Page
    description="按不可变快照审视库存库龄、剩余效期、可分配数量与处置责任，所有批次行都冻结在同一条权威账本水位。"
    title="库存库龄与效期明细"
  >
    <Alert
      class="mb-4"
      message="库存安全控制"
      description="本页只读取 Inventory Aging Snapshot 与 Lot 正式契约；风险标签直接来自冻结行字段，不回查旧 ERP/WMS。"
      show-icon
      type="info"
    />

    <Row :gutter="16" class="mb-4">
      <Col :lg="6" :sm="12" :xs="24">
        <Card>
          <Statistic
            title="冻结行数"
            :value="currentSnapshotMetrics.lineCount"
          />
        </Card>
      </Col>
      <Col :lg="6" :sm="12" :xs="24">
        <Card>
          <Statistic
            title="库龄未知"
            :value="currentSnapshotMetrics.unknownAgeCount"
          />
        </Card>
      </Col>
      <Col :lg="6" :sm="12" :xs="24">
        <Card>
          <Statistic
            title="效期未知"
            :value="currentSnapshotMetrics.unknownExpiryCount"
          />
        </Card>
      </Col>
      <Col :lg="6" :sm="12" :xs="24">
        <Card>
          <Statistic
            title="快照版本"
            :value="currentSnapshotMetrics.snapshotVersion"
          />
        </Card>
      </Col>
    </Row>

    <Card class="mb-4">
      <Space wrap>
        <Input
          v-model:value="filters.keyword"
          allow-clear
          placeholder="快照编码、策略版本或账本水位"
          style="width: 280px"
          @press-enter="search"
        />
        <Select
          v-model:value="filters.snapshotId"
          allow-clear
          :options="snapshotOptions"
          placeholder="快照时点"
          style="width: 260px"
        />
        <Input
          v-model:value="filters.localKeyword"
          allow-clear
          placeholder="SKU / Lot / 余额 ID"
          style="width: 220px"
        />
        <Input
          v-model:value="filters.warehouseOrLocation"
          allow-clear
          placeholder="仓库 / 库位"
          style="width: 220px"
        />
        <Select
          v-model:value="filters.riskBucket"
          allow-clear
          :options="riskOptions"
          placeholder="风险分类"
          style="width: 180px"
        />
        <Button type="primary" @click="search">查询</Button>
        <Button @click="reset">重置</Button>
        <Button
          v-access:code="['cloudmold:inventory:aging-snapshot:command']"
          type="primary"
          @click="openCaptureModal"
        >
          生成库存快照
        </Button>
      </Space>
    </Card>

    <Card title="批次库龄与效期快照">
      <template #extra>
        <Space>
          <Tag color="green">不可变快照</Tag>
          <Tag v-if="activeSnapshot">
            {{ activeSnapshot.ledgerWatermarkRef }}
          </Tag>
        </Space>
      </template>
      <Alert
        v-if="pageError"
        class="mb-4"
        :message="pageError"
        show-icon
        type="error"
      />
      <Table
        :data-source="visibleLines"
        :loading="pageLoading || snapshotDetailLoading"
        :pagination="{
          current: pageNo,
          pageSize,
          showSizeChanger: true,
          total,
        }"
        row-key="lineId"
        :scroll="{ x: 1600 }"
        @change="
          (pagination) =>
            changePage(pagination.current ?? 1, pagination.pageSize ?? 20)
        "
      >
        <template #emptyText>
          <Empty description="当前没有可读取的库龄/效期快照行" />
        </template>

        <Table.Column key="skuLot" title="SKU / Lot" width="220">
          <template #default="{ record }">
            <div class="font-medium text-primary">
              {{ record.lotCode ?? '未按批次追踪' }}
            </div>
            <div class="text-xs text-muted-foreground">
              {{ record.canonicalSkuId }}
            </div>
          </template>
        </Table.Column>

        <Table.Column key="warehouse" title="仓库 / 库位" width="210">
          <template #default="{ record }">
            <div>{{ record.warehouseId }}</div>
            <div class="text-xs text-muted-foreground">
              {{ record.locationId }}
            </div>
          </template>
        </Table.Column>

        <Table.Column key="quantity" title="现存 / 可用" width="150">
          <template #default="{ record }">
            <div>
              {{ formatDecimal(record.onHandQuantity) }} /
              {{ formatDecimal(record.availableQuantity) }}
            </div>
            <div class="text-xs text-muted-foreground">
              {{ record.baseUomCode }}
            </div>
          </template>
        </Table.Column>

        <Table.Column key="aging" title="库龄 / 剩余效期" width="170">
          <template #default="{ record }">
            <div>{{ formatAge(record) }}</div>
            <div class="text-xs text-muted-foreground">
              {{ formatExpiry(record) }}
            </div>
          </template>
        </Table.Column>

        <Table.Column key="bucket" title="批次状态" width="150">
          <template #default="{ record }">
            <div>{{ record.ageBucket ?? 'UNKNOWN' }}</div>
            <div class="text-xs text-muted-foreground">
              {{ record.expiryBucket ?? 'UNKNOWN' }}
            </div>
          </template>
        </Table.Column>

        <Table.Column key="watermark" title="快照水位" width="160">
          <template #default>
            <div>{{ activeSnapshot?.ledgerWatermarkRef ?? '-' }}</div>
            <div class="text-xs text-muted-foreground">
              {{ activeSnapshot?.snapshotDate ?? '-' }}
            </div>
          </template>
        </Table.Column>

        <Table.Column key="risk" title="风险分类" width="130">
          <template #default="{ record }">
            <StatusTag v-bind="riskMeta(classifyRisk(record))" />
          </template>
        </Table.Column>

        <Table.Column key="eligibility" title="分配资格" width="140">
          <template #default="{ record }">
            <StatusTag
              :color="record.stockStatus === 'RECALLED' ? 'error' : 'success'"
              :label="record.stockStatus === 'RECALLED' ? 'RECALLED' : 'ACTIVE'"
            />
          </template>
        </Table.Column>

        <Table.Column key="owner" title="责任域" width="140">
          <template #default="{ record }">
            {{ record.ownerType }}
          </template>
        </Table.Column>

        <Table.Column key="action" title="操作" width="100" fixed="right">
          <template #default="{ record }">
            <Button
              v-if="record.lotId"
              v-access:code="['cloudmold:inventory:aging-snapshot:query']"
              size="small"
              type="link"
              @click="openLotDetail(record)"
            >
              查看
            </Button>
          </template>
        </Table.Column>
      </Table>
    </Card>

    <Modal
      v-model:open="captureOpen"
      :confirm-loading="captureLoading"
      title="生成库存快照"
      width="760"
      @ok="captureSnapshot"
    >
      <Form layout="vertical">
        <Row :gutter="16">
          <Col :span="12">
            <Form.Item label="货主类型" required>
              <Input v-model:value="captureForm.ownerType" />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item label="货主 ID" required>
              <Input v-model:value="captureForm.ownerId" />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item label="仓库 ID" required>
              <Input v-model:value="captureForm.warehouseId" />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item label="分桶策略版本" required>
              <Input v-model:value="captureForm.bucketPolicyVersion" />
            </Form.Item>
          </Col>
          <Col :span="8">
            <Form.Item label="Fresh ≤ 天" required>
              <InputNumber
                v-model:value="captureForm.ageFreshMaxDays"
                :min="0"
                class="w-full"
              />
            </Form.Item>
          </Col>
          <Col :span="8">
            <Form.Item label="Aging ≤ 天" required>
              <InputNumber
                v-model:value="captureForm.ageAgingMaxDays"
                :min="0"
                class="w-full"
              />
            </Form.Item>
          </Col>
          <Col :span="8">
            <Form.Item label="Stale ≤ 天" required>
              <InputNumber
                v-model:value="captureForm.ageStaleMaxDays"
                :min="0"
                class="w-full"
              />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item label="预警效期 ≤ 天" required>
              <InputNumber
                v-model:value="captureForm.expiryWarningMaxDays"
                :min="0"
                class="w-full"
              />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item label="临界效期 ≤ 天" required>
              <InputNumber
                v-model:value="captureForm.expiryCriticalMaxDays"
                :min="0"
                class="w-full"
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>

    <Drawer
      v-model:open="lotDrawerOpen"
      :title="lot ? `${lot.lotCode} · ${lot.canonicalSkuId}` : '批次详情'"
      width="820"
    >
      <template v-if="lotLoading">
        <Card loading />
      </template>
      <template v-else-if="lot">
        <Descriptions :column="2" bordered size="small">
          <Descriptions.Item label="批次状态">
            <StatusTag v-bind="lotStatusMeta(lot.status)" />
          </Descriptions.Item>
          <Descriptions.Item label="分配资格">
            {{ lot.allocationEligibility }}
          </Descriptions.Item>
          <Descriptions.Item label="生产日期">
            {{ lot.manufacturedOn ?? 'UNKNOWN' }}
          </Descriptions.Item>
          <Descriptions.Item label="到期日期">
            {{ lot.expiresOn ?? 'UNKNOWN' }}
          </Descriptions.Item>
          <Descriptions.Item label="来源映射">
            {{ lot.mappedSourceSystem ?? '-' }} /
            {{ lot.mappedSourceId ?? '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="映射状态">
            {{ lot.mappingStatus ?? '-' }}
          </Descriptions.Item>
        </Descriptions>

        <Card class="mt-4" title="按批次可分配余额">
          <Table
            :data-source="lotAvailability"
            :pagination="false"
            row-key="balanceId"
            size="small"
          >
            <Table.Column
              key="balanceId"
              data-index="balanceId"
              title="余额 ID"
            />
            <Table.Column
              key="warehouseId"
              data-index="warehouseId"
              title="仓库"
            />
            <Table.Column
              key="locationId"
              data-index="locationId"
              title="库位"
            />
            <Table.Column key="qty" title="现存 / 可分配">
              <template #default="{ record }">
                {{ formatDecimal(record.onHandQuantity) }} /
                {{ formatDecimal(record.allocatableQuantity) }}
                {{ record.baseUomCode }}
              </template>
            </Table.Column>
          </Table>
        </Card>
      </template>
    </Drawer>
  </Page>
</template>
