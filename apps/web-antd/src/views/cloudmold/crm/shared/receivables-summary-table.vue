<script lang="ts" setup>
import type { CloudMoldReceivablesSummaryView } from '#/api/cloudmold/crm/finance-summary';

import { Empty, Table } from 'ant-design-vue';

const props = withDefaults(
  defineProps<{
    emptyDescription?: string;
    loading?: boolean;
    rows: CloudMoldReceivablesSummaryView[];
  }>(),
  {
    emptyDescription: '暂无回款汇总',
    loading: false,
  },
);

function formatMoney(value?: number, currencyCode?: string) {
  if (value === undefined || value === null) return '—';
  return `${(value / 100).toFixed(2)} ${currencyCode ?? ''}`.trim();
}
</script>

<template>
  <Table
    :columns="[
      { key: 'scope', title: '范围', width: 220 },
      { key: 'plan', title: '应收计划', width: 180 },
      { key: 'receipt', title: '收款记录', width: 180 },
      { key: 'allocation', title: '核销', width: 180 },
      { key: 'outstanding', title: '未结清', width: 180 },
    ]"
    :data-source="props.rows"
    :loading="props.loading"
    :pagination="false"
    row-key="salesContractId"
    size="small"
  >
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'scope'">
        <div class="flex flex-col gap-1">
          <span class="font-medium">
            {{ record.salesContractId || record.customerId || '摘要' }}
          </span>
          <span class="text-xs text-[var(--ant-color-text-description)]">
            {{ record.currencyCode || '无币种' }}
          </span>
        </div>
      </template>
      <template v-else-if="column.key === 'plan'">
        <span>
          {{ record.receivablePlanCount ?? 0 }} /
          {{
            formatMoney(record.receivablePlanAmountMinor, record.currencyCode)
          }}
        </span>
      </template>
      <template v-else-if="column.key === 'receipt'">
        <span>
          {{ record.receiptCount ?? 0 }} /
          {{ formatMoney(record.receiptAmountMinor, record.currencyCode) }}
        </span>
      </template>
      <template v-else-if="column.key === 'allocation'">
        <span>
          {{ record.allocationCount ?? 0 }} /
          {{ formatMoney(record.allocationAmountMinor, record.currencyCode) }}
        </span>
      </template>
      <template v-else-if="column.key === 'outstanding'">
        <span>{{
          formatMoney(
            record.receivablePlanOutstandingMinor,
            record.currencyCode,
          )
        }}</span>
      </template>
    </template>
    <template #emptyText>
      <Empty :description="props.emptyDescription" />
    </template>
  </Table>
</template>
