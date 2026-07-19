<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloudMoldWarehouseApi } from '#/api/cloudmold/warehouse';

import { Page } from '@vben/common-ui';

import { Tabs } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getCloudMoldWarehouseLocationPage,
  getCloudMoldWarehousePage,
  getCloudMoldWarehouseZonePage,
} from '#/api/cloudmold/warehouse';

import CopyIdCell from '../shared/copy-id-cell.vue';
import EvidenceAlert from '../shared/evidence-alert.vue';
import StatusTag from '../shared/status-tag.vue';
import {
  useLocationColumns,
  useLocationFormSchema,
  useWarehouseColumns,
  useWarehouseFormSchema,
  useZoneColumns,
  useZoneFormSchema,
  warehouseStatusMeta,
} from './data';

defineOptions({ name: 'CloudMoldWarehouse' });

type StatusMeta = Record<string, { color: string; label: string }>;

function getMeta(metadata: StatusMeta, status?: string) {
  if (status === undefined || status === null || status === '') {
    return { color: 'default', label: 'UNKNOWN' };
  }
  return metadata[status] ?? { color: 'default', label: String(status) };
}

function fieldValue(row: object, field: string) {
  return (row as Record<string, unknown>)[field];
}

function formatDecimal(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  return String(value).replace(/(\.\d*?[1-9])0+$|\.0+$/, '$1');
}

const [WarehouseGrid] = useVbenVxeGrid({
  formOptions: { schema: useWarehouseFormSchema() },
  gridOptions: {
    columns: useWarehouseColumns(),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) =>
          await getCloudMoldWarehousePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          }),
      },
    },
    rowConfig: { isHover: true, keyField: 'warehouseId' },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<CloudMoldWarehouseApi.Warehouse>,
});

const [ZoneGrid] = useVbenVxeGrid({
  formOptions: { schema: useZoneFormSchema() },
  gridOptions: {
    columns: useZoneColumns(),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) =>
          await getCloudMoldWarehouseZonePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          }),
      },
    },
    rowConfig: { isHover: true, keyField: 'zoneId' },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<CloudMoldWarehouseApi.Zone>,
});

const [LocationGrid] = useVbenVxeGrid({
  formOptions: { schema: useLocationFormSchema() },
  gridOptions: {
    columns: useLocationColumns(),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) =>
          await getCloudMoldWarehouseLocationPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          }),
      },
    },
    rowConfig: { isHover: true, keyField: 'locationId' },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<CloudMoldWarehouseApi.Location>,
});
</script>

<template>
  <Page auto-content-height>
    <EvidenceAlert
      message="CloudMold 规范仓网主数据权威"
      description="本页只读取 CloudMold 仓库 / 库区 / 库位主数据规范表；Warehouse Network 管主数据，Inventory 管数量账本，WMS 管物理作业，三者不混。不读取 yudao 旧 WMS 业务表。"
    />

    <Tabs class="w-full">
      <Tabs.TabPane key="warehouses" tab="仓库">
        <WarehouseGrid table-title="规范仓库">
          <template #warehouse-code="{ row }">
            <CopyIdCell :value="row.warehouseCode" label="仓库编码" />
          </template>
          <template #warehouse-status="{ row }">
            <StatusTag v-bind="getMeta(warehouseStatusMeta, row.status)" />
          </template>
        </WarehouseGrid>
      </Tabs.TabPane>

      <Tabs.TabPane key="zones" tab="库区">
        <ZoneGrid table-title="规范库区">
          <template #zone-code="{ row }">
            <CopyIdCell :value="row.zoneCode" label="库区编码" />
          </template>
          <template #zone-status="{ row }">
            <StatusTag v-bind="getMeta(warehouseStatusMeta, row.status)" />
          </template>
        </ZoneGrid>
      </Tabs.TabPane>

      <Tabs.TabPane key="locations" tab="库位">
        <LocationGrid table-title="规范库位">
          <template #location-code="{ row }">
            <CopyIdCell :value="row.locationCode" label="库位编码" />
          </template>
          <template #location-status="{ row }">
            <StatusTag v-bind="getMeta(warehouseStatusMeta, row.status)" />
          </template>
          <template #quantity="{ row, column }">
            {{ formatDecimal(fieldValue(row, column.field)) }}
          </template>
        </LocationGrid>
      </Tabs.TabPane>
    </Tabs>
  </Page>
</template>
