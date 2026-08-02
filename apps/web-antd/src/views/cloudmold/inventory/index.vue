<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloudMoldInventoryApi } from '#/api/cloudmold/inventory';

import { ref } from 'vue';
import { useRoute } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';

import { Tabs } from 'ant-design-vue';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getCloudMoldInventoryBalancePage,
  getCloudMoldInventoryLedgerPage,
  getCloudMoldInventoryReservationPage,
  InventoryOperation,
} from '#/api/cloudmold/inventory';

import EvidenceAlert from '../shared/evidence-alert.vue';
import StatusTag from '../shared/status-tag.vue';
import BalanceDetailDrawer from './balance-detail-drawer.vue';
import CommandModal from './command-modal.vue';
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

import '../shared/tabbed-grid.css';

defineOptions({ name: 'CloudMoldInventory' });

const route = useRoute();
const inventoryTab = ref(
  route.path.endsWith('/reservations')
    ? 'reservations'
    : route.path.endsWith('/ledger')
      ? 'ledger'
      : 'balances',
);

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
const [InventoryCommandModal, inventoryCommandModalApi] = useVbenModal({
  connectedComponent: CommandModal,
  destroyOnClose: true,
});

function openBalanceDetail(balanceId: string) {
  detailBalanceId.value = balanceId;
  balanceDetailOpen.value = true;
}

function openBalanceCommand(
  row: CloudMoldInventoryApi.Balance,
  operation: string,
) {
  inventoryCommandModalApi
    .setData({
      baseUomCode: row.baseUomCode,
      canonicalSkuId: row.canonicalSkuId,
      locationCode: row.locationCode,
      locationId: row.locationId,
      lotId: row.lotId,
      operation,
      ownerId: row.ownerId,
      ownerType: row.ownerType,
      qualityStatus: row.qualityStatus,
      skuCode: row.skuCode,
      stockStatus: row.stockStatus,
      warehouseCode: row.warehouseCode,
      warehouseId: row.warehouseId,
    })
    .open();
}

function openReservationCommand(
  row: CloudMoldInventoryApi.Reservation,
  operation: string,
) {
  inventoryCommandModalApi
    .setData({
      baseUomCode: row.baseUomCode,
      businessId: row.businessId,
      businessItemId: row.businessItemId,
      businessType: row.businessType,
      canonicalSkuId: row.canonicalSkuId,
      locationCode: row.locationCode,
      locationId: row.locationId,
      lotId: row.lotId,
      operation,
      ownerId: row.ownerId,
      ownerType: row.ownerType,
      qualityStatus: row.qualityStatus,
      quantity: row.allocationQuantity,
      reservationId: row.reservationId,
      skuCode: row.skuCode,
      stockStatus: row.stockStatus,
      warehouseCode: row.warehouseCode,
      warehouseId: row.warehouseId,
    })
    .open();
}

function refreshInventory() {
  BalanceGridApi.query();
  ReservationGridApi.query();
  LedgerGridApi.query();
}

const [BalanceGrid, BalanceGridApi] = useVbenVxeGrid({
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

const [ReservationGrid, ReservationGridApi] = useVbenVxeGrid({
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

const [LedgerGrid, LedgerGridApi] = useVbenVxeGrid({
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
  <Page auto-content-height content-class="flex min-h-0 flex-col">
    <EvidenceAlert page="inventory" />
    <InventoryCommandModal @success="refreshInventory" />

    <Tabs
      v-model:active-key="inventoryTab"
      class="cloudmold-grid-tabs min-h-0 w-full flex-1"
    >
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
            <TableAction
              :actions="[
                {
                  label: '详情',
                  onClick: () => openBalanceDetail(row.balanceId),
                  type: 'link',
                },
                {
                  auth: ['cloudmold:inventory:command'],
                  label: '入库',
                  onClick: () =>
                    openBalanceCommand(row, InventoryOperation.RECEIVE),
                  type: 'link',
                },
                {
                  auth: ['cloudmold:inventory:command'],
                  ifShow: () => row.allocationEligibility === 'ALLOCATABLE',
                  label: '预占',
                  onClick: () =>
                    openBalanceCommand(row, InventoryOperation.RESERVE),
                  type: 'link',
                },
                {
                  auth: ['cloudmold:inventory:command'],
                  label: '退货入库',
                  onClick: () =>
                    openBalanceCommand(row, InventoryOperation.RETURN),
                  type: 'link',
                },
              ]"
            />
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
          <template #action="{ row }">
            <TableAction
              :actions="[
                {
                  auth: ['cloudmold:inventory:command'],
                  ifShow: () => row.status === 10,
                  label: '确认出库',
                  popConfirm: {
                    confirm: () =>
                      openReservationCommand(row, InventoryOperation.SHIP),
                    title: '确认按该预占数量出库？出库后预占将进入已提交状态。',
                  },
                  type: 'link',
                },
                {
                  auth: ['cloudmold:inventory:command'],
                  ifShow: () => row.status === 10,
                  label: '释放',
                  popConfirm: {
                    confirm: () =>
                      openReservationCommand(row, InventoryOperation.RELEASE),
                    title:
                      '确认释放该预占？系统会恢复可用库存并记录不可变流水。',
                  },
                  type: 'link',
                },
              ]"
            />
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
