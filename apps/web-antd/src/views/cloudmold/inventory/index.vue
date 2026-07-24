<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloudMoldInventoryApi } from '#/api/cloudmold/inventory';

import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Button, Tabs } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getCloudMoldInventoryBalancePage,
  getCloudMoldInventoryLedgerPage,
  getCloudMoldInventoryReservationPage,
} from '#/api/cloudmold/inventory';

import EvidenceAlert from '../shared/evidence-alert.vue';
import StatusTag from '../shared/status-tag.vue';
import BalanceDetailDrawer from './balance-detail-drawer.vue';
import {
  qualityStatusMeta,
  reservationStatusMeta,
  stockStatusMeta,
  useBalanceColumns,
  useBalanceFormSchema,
  useLedgerColumns,
  useLedgerFormSchema,
  useReservationColumns,
  useReservationFormSchema,
} from './data';

defineOptions({ name: 'CloudMoldInventory' });

type StatusMeta = Record<number | string, { color: string; label: string }>;

function getFieldValue(row: object, field: string) {
  return (row as Record<string, unknown>)[field];
}

function formatDecimal(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  return String(value).replace(/(\.\d*?[1-9])0+$|\.0+$/, '$1');
}

function getMeta(metadata: StatusMeta, status: number | string) {
  return metadata[status] ?? { color: 'default', label: String(status) };
}

const balanceDetailOpen = ref(false);
const detailBalanceId = ref<null | string>(null);

function openBalanceDetail(balanceId: string) {
  detailBalanceId.value = balanceId;
  balanceDetailOpen.value = true;
}

const [BalanceGrid] = useVbenVxeGrid({
  formOptions: { schema: useBalanceFormSchema() },
  gridOptions: {
    columns: useBalanceColumns(),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) =>
          await getCloudMoldInventoryBalancePage({
            onlyNonZero: true,
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          }),
      },
    },
    rowConfig: { isHover: true, keyField: 'balanceId' },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<CloudMoldInventoryApi.Balance>,
});

const [ReservationGrid] = useVbenVxeGrid({
  formOptions: { schema: useReservationFormSchema() },
  gridOptions: {
    columns: useReservationColumns(),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) =>
          await getCloudMoldInventoryReservationPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          }),
      },
    },
    rowConfig: { isHover: true, keyField: 'allocationId' },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<CloudMoldInventoryApi.Reservation>,
});

const [LedgerGrid] = useVbenVxeGrid({
  formOptions: { schema: useLedgerFormSchema() },
  gridOptions: {
    columns: useLedgerColumns(),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) =>
          await getCloudMoldInventoryLedgerPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          }),
      },
    },
    rowConfig: { isHover: true, keyField: 'ledgerEntryId' },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<CloudMoldInventoryApi.LedgerEntry>,
});
</script>

<template>
  <Page auto-content-height>
    <EvidenceAlert page="inventory" />

    <Tabs class="w-full">
      <Tabs.TabPane key="balances" tab="库存余额">
        <BalanceGrid table-title="库存余额">
          <template #stock-status="{ row }">
            <StatusTag v-bind="getMeta(stockStatusMeta, row.stockStatus)" />
          </template>
          <template #quality-status="{ row }">
            <StatusTag v-bind="getMeta(qualityStatusMeta, row.qualityStatus)" />
          </template>
          <template #quantity="{ row, column }">
            {{ formatDecimal(getFieldValue(row, column.field)) }}
          </template>
          <template #action="{ row }">
            <Button
              type="link"
              size="small"
              @click="openBalanceDetail(row.balanceId)"
            >
              详情
            </Button>
          </template>
        </BalanceGrid>
      </Tabs.TabPane>

      <Tabs.TabPane key="reservations" tab="预占与分配">
        <ReservationGrid table-title="库存预占">
          <template #reservation-status="{ row }">
            <StatusTag v-bind="getMeta(reservationStatusMeta, row.status)" />
          </template>
          <template #allocation-status="{ row }">
            <StatusTag
              v-bind="getMeta(reservationStatusMeta, row.allocationStatus)"
            />
          </template>
          <template #quantity="{ row, column }">
            {{ formatDecimal(getFieldValue(row, column.field)) }}
          </template>
        </ReservationGrid>
      </Tabs.TabPane>

      <Tabs.TabPane key="ledger" tab="不可变账本">
        <LedgerGrid table-title="库存流水">
          <template #quantity="{ row, column }">
            {{ formatDecimal(getFieldValue(row, column.field)) }}
          </template>
        </LedgerGrid>
      </Tabs.TabPane>
    </Tabs>

    <BalanceDetailDrawer
      v-model:open="balanceDetailOpen"
      :balance-id="detailBalanceId"
    />
  </Page>
</template>
