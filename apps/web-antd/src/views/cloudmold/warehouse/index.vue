<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloudMoldWarehouseApi } from '#/api/cloudmold/warehouse';
import type { CloudMoldWarehouseCommandApi } from '#/api/cloudmold/warehouse/command';

import { Page } from '@vben/common-ui';

import { message, Tabs } from 'ant-design-vue';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getCloudMoldWarehouseLocationPage,
  getCloudMoldWarehousePage,
  getCloudMoldWarehouseZonePage,
} from '#/api/cloudmold/warehouse';
import {
  changeLocationStatus,
  changeWarehouseStatus,
  changeZoneStatus,
  WarehouseLifecycle,
} from '#/api/cloudmold/warehouse/command';

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

const [WarehouseGrid, warehouseGridApi] = useVbenVxeGrid({
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

const [ZoneGrid, zoneGridApi] = useVbenVxeGrid({
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

const [LocationGrid, locationGridApi] = useVbenVxeGrid({
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

/**
 * 仓/区/位状态转换统一工厂：三者同构（command + 行 version + target lifecycle）。
 * target 仅 ACTIVE / INACTIVE（后端 requireLifecycle 约束，不能回 DRAFT）。
 */
function entityTransition(
  command: (
    id: string,
    expectedVersion: number,
    status: string,
  ) => Promise<CloudMoldWarehouseCommandApi.CommandResult>,
  entityLabel: string,
  refresh: () => void,
) {
  const run = async (
    id: string,
    version: number,
    status: string,
    label: string,
  ) => {
    const hideLoading = message.loading({
      content: `正在${label}…`,
      duration: 0,
    });
    try {
      const result = await command(id, version, status);
      if (result.duplicate) {
        message.warning('该操作已处理（幂等重放）');
      } else {
        message.success(`${label}成功`);
      }
      refresh();
    } catch (error) {
      message.error(
        `${label}失败：${error instanceof Error ? error.message : '请稍后重试'}`,
      );
      refresh();
    } finally {
      hideLoading();
    }
  };
  return {
    disable: (row: { version: number }, id: string) =>
      run(id, row.version, WarehouseLifecycle.INACTIVE, `停用${entityLabel}`),
    enable: (row: { version: number }, id: string) =>
      run(id, row.version, WarehouseLifecycle.ACTIVE, `启用${entityLabel}`),
  };
}

const warehouseActions = entityTransition(changeWarehouseStatus, '仓库', () =>
  warehouseGridApi.query(),
);
const zoneActions = entityTransition(changeZoneStatus, '库区', () =>
  zoneGridApi.query(),
);
const locationActions = entityTransition(changeLocationStatus, '库位', () =>
  locationGridApi.query(),
);
</script>

<template>
  <Page auto-content-height>
    <EvidenceAlert
      message="CloudMold 规范仓网主数据权威"
      description="本页读取 CloudMold 仓库/库区/库位主数据规范表，并支持状态转换（启用/停用，幂等命令 + 乐观版本）；Warehouse Network 管主数据，Inventory 管数量账本，WMS 管物理作业，三者不混。不读取 yudao 旧 WMS 业务表。"
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
          <template #warehouse-action="{ row }">
            <TableAction
              :actions="[
                {
                  ifShow: () => row.status !== 'ACTIVE',
                  label: '启用',
                  onClick: warehouseActions.enable.bind(
                    null,
                    row,
                    row.warehouseId,
                  ),
                  type: 'link',
                },
                {
                  ifShow: () => row.status === 'ACTIVE',
                  label: '停用',
                  onClick: warehouseActions.disable.bind(
                    null,
                    row,
                    row.warehouseId,
                  ),
                  type: 'link',
                },
              ]"
            />
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
          <template #zone-action="{ row }">
            <TableAction
              :actions="[
                {
                  ifShow: () => row.status !== 'ACTIVE',
                  label: '启用',
                  onClick: zoneActions.enable.bind(null, row, row.zoneId),
                  type: 'link',
                },
                {
                  ifShow: () => row.status === 'ACTIVE',
                  label: '停用',
                  onClick: zoneActions.disable.bind(null, row, row.zoneId),
                  type: 'link',
                },
              ]"
            />
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
          <template #location-action="{ row }">
            <TableAction
              :actions="[
                {
                  ifShow: () => row.status !== 'ACTIVE',
                  label: '启用',
                  onClick: locationActions.enable.bind(
                    null,
                    row,
                    row.locationId,
                  ),
                  type: 'link',
                },
                {
                  ifShow: () => row.status === 'ACTIVE',
                  label: '停用',
                  onClick: locationActions.disable.bind(
                    null,
                    row,
                    row.locationId,
                  ),
                  type: 'link',
                },
              ]"
            />
          </template>
        </LocationGrid>
      </Tabs.TabPane>
    </Tabs>
  </Page>
</template>
