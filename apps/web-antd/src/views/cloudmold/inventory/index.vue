<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloudMoldInventoryApi } from '#/api/cloudmold/inventory';

import { Page } from '@vben/common-ui';

import { Alert, Tabs, Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getCloudMoldInventoryBalancePage,
  getCloudMoldInventoryLedgerPage,
  getCloudMoldInventoryReservationPage,
} from '#/api/cloudmold/inventory';

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

function getFieldValue(row: object, field: string) {
  return (row as Record<string, unknown>)[field];
}

function formatDecimal(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  return String(value).replace(/(\.\d*?[1-9])0+$|\.0+$/, '$1');
}

function getMeta(
  metadata: Record<number | string, { color: string; label: string }>,
  status: number | string,
) {
  return metadata[status] ?? { color: 'default', label: String(status) };
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
    <Alert
      class="mb-4"
      show-icon
      type="info"
      message="CloudMold 规范库存权威"
      description="本页只读取 CloudMold Inventory v3 的精确货主 / SKU / 仓库 / 库位 / Lot / 状态 / UOM 粒度，不读 product_sku.stock、erp_stock 或 wms_inventory 权威字段。"
    />

    <Tabs class="w-full">
      <Tabs.TabPane key="balances" tab="库存余额">
        <BalanceGrid table-title="规范库存余额">
          <template #stock-status="{ row }">
            <Tag :color="getMeta(stockStatusMeta, row.stockStatus).color">
              {{ getMeta(stockStatusMeta, row.stockStatus).label }}
            </Tag>
          </template>
          <template #quality-status="{ row }">
            <Tag :color="getMeta(qualityStatusMeta, row.qualityStatus).color">
              {{ getMeta(qualityStatusMeta, row.qualityStatus).label }}
            </Tag>
          </template>
          <template #quantity="{ row, column }">
            {{ formatDecimal(getFieldValue(row, column.field)) }}
          </template>
        </BalanceGrid>
      </Tabs.TabPane>

      <Tabs.TabPane key="reservations" tab="预占与分配">
        <ReservationGrid table-title="规范库存预占">
          <template #reservation-status="{ row }">
            <Tag :color="getMeta(reservationStatusMeta, row.status).color">
              {{ getMeta(reservationStatusMeta, row.status).label }}
            </Tag>
          </template>
          <template #allocation-status="{ row }">
            <Tag
              :color="
                getMeta(reservationStatusMeta, row.allocationStatus).color
              "
            >
              {{ getMeta(reservationStatusMeta, row.allocationStatus).label }}
            </Tag>
          </template>
          <template #quantity="{ row, column }">
            {{ formatDecimal(getFieldValue(row, column.field)) }}
          </template>
        </ReservationGrid>
      </Tabs.TabPane>

      <Tabs.TabPane key="ledger" tab="不可变账本">
        <LedgerGrid table-title="规范库存账本">
          <template #quantity="{ row, column }">
            {{ formatDecimal(getFieldValue(row, column.field)) }}
          </template>
        </LedgerGrid>
      </Tabs.TabPane>
    </Tabs>
  </Page>
</template>
