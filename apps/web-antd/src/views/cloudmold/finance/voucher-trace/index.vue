<script lang="ts" setup>
import type { CloudMoldFinanceApi } from '#/api/cloudmold/finance';

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
} from 'ant-design-vue';

import {
  getFinancialImpact,
  getFinancialImpactPage,
} from '#/api/cloudmold/finance';

import StatusTag from '../../shared/status-tag.vue';
import { formatMinorMoney } from '../presentation';

defineOptions({ name: 'CloudMoldFinanceVoucherTrace' });

const rows = ref<CloudMoldFinanceApi.FinancialImpactPageItem[]>([]);
const loading = ref(false);
const loadError = ref('');
const keyword = ref('');
const sourceType = ref<string>();
const status = ref<string>();
const total = ref(0);
const pageNo = ref(1);
const pageSize = ref(20);
const detailOpen = ref(false);
const detailLoading = ref(false);
const detail = ref<CloudMoldFinanceApi.FinancialImpactDetail>();

const sourceTypeOptions = [
  { label: '供应商退供', value: 'SUPPLIER_RETURN' },
  { label: '盘点调整', value: 'STOCK_COUNT' },
  { label: '库存报废', value: 'INVENTORY_SCRAP' },
];

const statusOptions = [
  { label: '已过账', value: 'POSTED' },
  { label: '待过账', value: 'PENDING' },
  { label: '已反冲', value: 'REVERSED' },
];

const currentPagePending = computed(
  () => rows.value.filter((row) => row.postingStatus !== 'POSTED').length,
);
const currentPagePosted = computed(
  () => rows.value.filter((row) => row.postingStatus === 'POSTED').length,
);
const currentPageReversed = computed(
  () => rows.value.filter((row) => row.journalStatus === 'REVERSED').length,
);
const currentPageCount = computed(() => rows.value.length);

function sourceTypeLabel(source: string) {
  return (
    sourceTypeOptions.find((option) => option.value === source)?.label ?? source
  );
}

function postingMeta(statusValue?: string) {
  if (statusValue === 'POSTED') return { color: 'success', label: '已过账' };
  if (statusValue === 'REVERSED') return { color: 'warning', label: '已反冲' };
  if (statusValue === 'PENDING')
    return { color: 'processing', label: '待过账' };
  return { color: 'default', label: statusValue ?? 'UNKNOWN' };
}

function formatMoney(amountMinor?: string, currencyCode?: string) {
  if (!amountMinor || !currencyCode) return '—';
  return formatMinorMoney(amountMinor, currencyCode);
}

async function loadPage() {
  loading.value = true;
  loadError.value = '';
  try {
    const result = await getFinancialImpactPage({
      keyword: keyword.value.trim() || undefined,
      pageNo: pageNo.value,
      pageSize: pageSize.value,
      sourceType: sourceType.value,
      status: status.value,
    });
    rows.value = result.list;
    total.value = result.total;
  } catch (error) {
    rows.value = [];
    total.value = 0;
    loadError.value =
      error instanceof Error ? error.message : '财务影响加载失败';
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
  sourceType.value = undefined;
  status.value = undefined;
  pageNo.value = 1;
  void loadPage();
}

function changePage(page: number, size: number) {
  pageNo.value = page;
  pageSize.value = size;
  void loadPage();
}

async function openDetail(postingId: string) {
  detailOpen.value = true;
  detailLoading.value = true;
  detail.value = undefined;
  try {
    detail.value = await getFinancialImpact(postingId);
  } catch (error) {
    message.error(
      error instanceof Error ? error.message : '财务影响详情加载失败',
    );
  } finally {
    detailLoading.value = false;
  }
}

onMounted(() => {
  void loadPage();
});
</script>

<template>
  <Page
    description="从来源单据、估值影响到会计凭证，整个链路都落在正式财务影响记录上。"
    title="财务影响与凭证追踪"
  >
    <Alert
      class="mb-4"
      message="财务与风控"
      description="本页只读取 /cloudmold/finance/financial-impacts 正式查询，覆盖供应商退供、盘点和报废。"
      show-icon
      type="info"
    />

    <Row :gutter="16" class="mb-4">
      <Col :lg="6" :sm="12" :xs="24">
        <Card>
          <Statistic title="待生成凭证" :value="currentPagePending" />
        </Card>
      </Col>
      <Col :lg="6" :sm="12" :xs="24">
        <Card><Statistic title="已过账" :value="currentPagePosted" /></Card>
      </Col>
      <Col :lg="6" :sm="12" :xs="24">
        <Card><Statistic title="已反冲" :value="currentPageReversed" /></Card>
      </Col>
      <Col :lg="6" :sm="12" :xs="24">
        <Card>
          <Statistic title="当前页影响笔数" :value="currentPageCount" />
        </Card>
      </Col>
    </Row>

    <Card class="mb-4">
      <Space wrap>
        <Input
          v-model:value="keyword"
          allow-clear
          placeholder="来源单号、行号或会计凭证"
          style="width: 320px"
          @press-enter="search"
        />
        <Select
          v-model:value="sourceType"
          allow-clear
          :options="sourceTypeOptions"
          placeholder="业务影响类型"
          style="width: 180px"
        />
        <Select
          v-model:value="status"
          allow-clear
          :options="statusOptions"
          placeholder="过账状态"
          style="width: 180px"
        />
        <Button type="primary" @click="search">查询</Button>
        <Button @click="reset">重置</Button>
        <Button @click="loadPage">刷新追踪</Button>
      </Space>
    </Card>

    <Card title="业务影响与会计凭证链">
      <template #extra>
        <Tag color="green">来源可追溯</Tag>
      </template>
      <Alert
        v-if="loadError"
        class="mb-4"
        :message="loadError"
        show-icon
        type="error"
      />
      <Table
        :data-source="rows"
        :loading="loading"
        :pagination="{
          current: pageNo,
          pageSize,
          showSizeChanger: true,
          total,
        }"
        row-key="inventoryControlPostingId"
        :scroll="{ x: 1600 }"
        @change="
          (pagination) =>
            changePage(pagination.current ?? 1, pagination.pageSize ?? 20)
        "
      >
        <template #emptyText>
          <Empty description="暂无正式财务影响记录" />
        </template>

        <Table.Column key="source" title="来源单据 / 凭证" width="260">
          <template #default="{ record }">
            <div class="font-medium text-primary">
              {{ record.sourceDocumentId }}
            </div>
            <div class="text-xs text-muted-foreground">
              {{ record.sourceReferenceId ?? record.sourceLineId ?? '—' }}
            </div>
          </template>
        </Table.Column>

        <Table.Column key="impactType" title="业务影响类型" width="220">
          <template #default="{ record }">
            {{ sourceTypeLabel(record.sourceType) }}
            <div class="text-xs text-muted-foreground">
              {{ record.impactType }}
            </div>
          </template>
        </Table.Column>

        <Table.Column key="amount" title="金额 / 币种" width="220">
          <template #default="{ record }">
            <div>
              {{ formatMoney(record.totalAmountMinor, record.currencyCode) }}
            </div>
            <div class="text-xs text-muted-foreground">
              估值
              {{
                formatMoney(
                  record.valuationImpactAmountMinor,
                  record.currencyCode,
                )
              }}
            </div>
          </template>
        </Table.Column>

        <Table.Column key="apImpact" title="应付 / 估值影响" width="200">
          <template #default="{ record }">
            <div>
              {{ formatMoney(record.apImpactAmountMinor, record.currencyCode) }}
            </div>
            <div class="text-xs text-muted-foreground">
              {{ record.quantity ?? '—' }} {{ record.unitOfMeasure ?? '' }}
            </div>
          </template>
        </Table.Column>

        <Table.Column key="voucher" title="会计凭证" width="180">
          <template #default="{ record }">
            <div>{{ record.journalCode ?? '未生成' }}</div>
            <div class="text-xs text-muted-foreground">
              {{ record.journalEntryId ?? '—' }}
            </div>
          </template>
        </Table.Column>

        <Table.Column key="period" title="会计期间" width="140">
          <template #default="{ record }">
            {{ record.accountingPeriodId ?? '—' }}
          </template>
        </Table.Column>

        <Table.Column key="status" title="过账状态" width="130">
          <template #default="{ record }">
            <StatusTag v-bind="postingMeta(record.postingStatus)" />
          </template>
        </Table.Column>

        <Table.Column key="journalStatus" title="借贷校验" width="130">
          <template #default="{ record }">
            <StatusTag v-bind="postingMeta(record.journalStatus)" />
          </template>
        </Table.Column>

        <Table.Column key="action" title="操作" width="100" fixed="right">
          <template #default="{ record }">
            <Button
              v-access:code="['cloudmold:finance:financial-impact:query']"
              size="small"
              type="link"
              @click="openDetail(record.inventoryControlPostingId)"
            >
              追溯
            </Button>
          </template>
        </Table.Column>
      </Table>
    </Card>

    <Drawer
      v-model:open="detailOpen"
      :title="
        detail
          ? `${detail.sourceDocumentId} · ${sourceTypeLabel(detail.sourceType)}`
          : '财务影响详情'
      "
      width="980"
    >
      <template v-if="detailLoading">
        <Card loading />
      </template>
      <template v-else-if="detail">
        <Descriptions :column="2" bordered size="small">
          <Descriptions.Item label="来源单据">
            {{ detail.sourceDocumentId }} / {{ detail.sourceLineId ?? '—' }}
          </Descriptions.Item>
          <Descriptions.Item label="业务影响">
            {{ detail.impactType }}
          </Descriptions.Item>
          <Descriptions.Item label="会计凭证">
            {{ detail.journalCode ?? '未生成' }} /
            {{ detail.journalEntryId ?? '—' }}
          </Descriptions.Item>
          <Descriptions.Item label="过账状态">
            <StatusTag v-bind="postingMeta(detail.postingStatus)" />
          </Descriptions.Item>
          <Descriptions.Item label="估值影响">
            {{
              formatMoney(
                detail.valuationImpactAmountMinor,
                detail.currencyCode,
              )
            }}
          </Descriptions.Item>
          <Descriptions.Item label="应付影响">
            {{ formatMoney(detail.apImpactAmountMinor, detail.currencyCode) }}
          </Descriptions.Item>
          <Descriptions.Item label="总金额">
            {{ formatMoney(detail.totalAmountMinor, detail.currencyCode) }}
          </Descriptions.Item>
          <Descriptions.Item label="会计期间">
            {{ detail.accountingPeriodId ?? '—' }}
          </Descriptions.Item>
        </Descriptions>

        <Card class="mt-4" title="来源行">
          <Table
            :data-source="detail.sourceLines"
            :pagination="false"
            row-key="sourceLineId"
            size="small"
          >
            <Table.Column
              key="sourceLineId"
              data-index="sourceLineId"
              title="来源行"
            />
            <Table.Column key="po" title="采购 / 收货">
              <template #default="{ record }">
                <div>{{ record.purchaseOrderId ?? '—' }}</div>
                <div class="text-xs text-muted-foreground">
                  {{
                    record.receiptLineId ?? record.qualityDispositionId ?? '—'
                  }}
                </div>
              </template>
            </Table.Column>
            <Table.Column key="qty" title="数量">
              <template #default="{ record }">
                {{ record.quantity ?? '—' }} {{ record.unitOfMeasure ?? '' }}
              </template>
            </Table.Column>
            <Table.Column key="impact" title="财务影响">
              <template #default="{ record }">
                <div>
                  {{
                    formatMoney(
                      record.valuationImpactAmountMinor,
                      record.currencyCode,
                    )
                  }}
                </div>
                <div class="text-xs text-muted-foreground">
                  AP
                  {{
                    formatMoney(record.apImpactAmountMinor, record.currencyCode)
                  }}
                </div>
              </template>
            </Table.Column>
          </Table>
        </Card>

        <Card class="mt-4" title="应付回冲链">
          <Table
            :data-source="detail.apLineage"
            :pagination="false"
            row-key="invoiceLineId"
            size="small"
          >
            <Table.Column
              key="supplierInvoiceId"
              data-index="supplierInvoiceId"
              title="供应商发票"
            />
            <Table.Column
              key="apOpenItemId"
              data-index="apOpenItemId"
              title="AP Open Item"
            />
            <Table.Column key="reversalQuantity" title="回冲数量 / 金额">
              <template #default="{ record }">
                <div>
                  {{ record.reversalQuantity ?? '—' }}
                  {{ record.unitOfMeasure ?? '' }}
                </div>
                <div class="text-xs text-muted-foreground">
                  {{
                    formatMoney(
                      record.grossReversalAmountMinor,
                      detail.currencyCode,
                    )
                  }}
                </div>
              </template>
            </Table.Column>
          </Table>
        </Card>

        <Card v-if="detail.journal" class="mt-4" title="会计凭证">
          <Table
            :data-source="detail.journal.lines"
            :pagination="false"
            row-key="journalLineId"
            size="small"
          >
            <Table.Column
              key="lineNumber"
              data-index="lineNumber"
              title="行号"
              width="80"
            />
            <Table.Column key="account" title="会计科目">
              <template #default="{ record }">
                <div>{{ record.accountCode }}</div>
                <div class="text-xs text-muted-foreground">
                  {{ record.accountName }}
                </div>
              </template>
            </Table.Column>
            <Table.Column key="debit" title="借方">
              <template #default="{ record }">
                {{ formatMoney(record.debitAmountMinor, detail.currencyCode) }}
              </template>
            </Table.Column>
            <Table.Column key="credit" title="贷方">
              <template #default="{ record }">
                {{ formatMoney(record.creditAmountMinor, detail.currencyCode) }}
              </template>
            </Table.Column>
          </Table>
        </Card>
      </template>
    </Drawer>
  </Page>
</template>
