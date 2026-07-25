<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloudMoldCatalogApi } from '#/api/cloudmold/catalog';

import { ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getCloudMoldCatalogSkuDetail,
  getCloudMoldCatalogSkuPage,
} from '#/api/cloudmold/catalog';
import {
  activateCatalogDefinition,
  CatalogEntityType,
  CatalogLifecycleAction,
  changeCatalogLifecycle,
} from '#/api/cloudmold/catalog/command';

import CopyIdCell from '../shared/copy-id-cell.vue';
import EvidenceAlert from '../shared/evidence-alert.vue';
import StatusTag from '../shared/status-tag.vue';
import { catalogStatusMeta, useGridColumns, useGridFormSchema } from './data';
import DetailDrawer from './detail-drawer.vue';
import SkuForm from './sku-form.vue';

defineOptions({ name: 'CloudMoldCatalog' });

const detailOpen = ref(false);
const detailSkuId = ref<null | string>(null);
const [SkuModal, skuModalApi] = useVbenModal({
  connectedComponent: SkuForm,
  destroyOnClose: true,
});

function openDetail(skuId: string) {
  detailSkuId.value = skuId;
  detailOpen.value = true;
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getCloudMoldCatalogSkuPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'canonicalSkuId',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<CloudMoldCatalogApi.Sku>,
});

const simpleStatusName = (status: number) =>
  ({ 0: 'DRAFT', 10: 'ACTIVE', 20: 'INACTIVE', 90: 'ARCHIVED' })[status] ??
  'UNKNOWN';
const spuStatusName = (status: number) =>
  ({
    0: 'DRAFT',
    10: 'SUBMITTED',
    20: 'APPROVED',
    30: 'ACTIVE',
    40: 'INACTIVE',
    50: 'REJECTED',
    90: 'ARCHIVED',
  })[status] ?? 'UNKNOWN';

async function handleActivate(row: CloudMoldCatalogApi.Sku) {
  const hide = message.loading({
    content: '正在按依赖顺序推进商品…',
    duration: 0,
  });
  try {
    const detail = await getCloudMoldCatalogSkuDetail(row.canonicalSkuId);
    if (!detail) throw new Error('商品不存在或无权访问');
    await activateCatalogDefinition({
      aggregateVersion: detail.aggregateVersion,
      canonicalSkuId: detail.canonicalSkuId,
      canonicalSpuId: detail.canonicalSpuId,
      canonicalStyleId: detail.canonicalStyleId,
      colorId: detail.colorId ?? '',
      colorStatus: simpleStatusName(detail.colorStatus),
      colorVersion: detail.colorVersion,
      created: false,
      duplicate: false,
      operationId: 0,
      primaryBarcodeId: '',
      sizeGroupId: detail.sizeGroupId,
      sizeGroupStatus: simpleStatusName(detail.sizeGroupStatus),
      sizeGroupVersion: detail.sizeGroupVersion,
      sizeId: detail.sizeId ?? '',
      sizeStatus: simpleStatusName(detail.sizeStatus),
      sizeVersion: detail.sizeVersion,
      skuStatus: simpleStatusName(detail.catalogStatus),
      spuStatus: spuStatusName(detail.spuStatus),
      spuVersion: detail.spuVersion,
      styleStatus: simpleStatusName(detail.styleStatus),
      styleVersion: detail.styleVersion,
    });
    message.success('商品及依赖主数据已推进到生效');
    gridApi.query();
  } catch (error) {
    message.error(
      `推进失败：${error instanceof Error ? error.message : '请刷新后重试'}`,
    );
  } finally {
    hide();
  }
}

async function runSkuLifecycle(
  row: CloudMoldCatalogApi.Sku,
  action: string,
  actionName: string,
) {
  const hide = message.loading({ content: `正在${actionName}…`, duration: 0 });
  try {
    await changeCatalogLifecycle(
      CatalogEntityType.SKU,
      row.canonicalSkuId,
      action,
      row.aggregateVersion,
      `管理后台${actionName} SKU`,
    );
    message.success(`${actionName}成功`);
    gridApi.query();
  } catch (error) {
    message.error(
      `${actionName}失败：${error instanceof Error ? error.message : '请刷新后重试'}`,
    );
  } finally {
    hide();
  }
}

function getStatusMeta(status: number) {
  return (
    catalogStatusMeta[status] ?? {
      color: 'default',
      label: `未知 (${status})`,
    }
  );
}
</script>

<template>
  <Page auto-content-height>
    <EvidenceAlert page="catalog" />

    <SkuModal @success="gridApi.query()" />
    <Grid table-title="商品与 SKU">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              auth: ['cloudmold:catalog:sku:define'],
              icon: ACTION_ICON.ADD,
              label: '新建商品',
              onClick: () => skuModalApi.open(),
              type: 'primary',
            },
          ]"
        />
      </template>
      <template #sku-code="{ row }">
        <CopyIdCell :value="row.skuCode" label="规范 SKU" />
      </template>
      <template #catalog-status="{ row }">
        <StatusTag v-bind="getStatusMeta(row.catalogStatus)" />
      </template>
      <template #action="{ row }">
        <TableAction
          :actions="[
            {
              label: '详情',
              onClick: () => openDetail(row.canonicalSkuId),
              type: 'link',
            },
            {
              auth: ['cloudmold:catalog:lifecycle'],
              ifShow: () => [0, 20].includes(row.catalogStatus),
              label: '推进生效',
              onClick: () => handleActivate(row),
              type: 'link',
            },
            {
              auth: ['cloudmold:catalog:lifecycle'],
              ifShow: () => row.catalogStatus === 10,
              label: '停用',
              popConfirm: {
                confirm: () =>
                  runSkuLifecycle(
                    row,
                    CatalogLifecycleAction.DEACTIVATE,
                    '停用',
                  ),
                title:
                  '停用后该 SKU 将不能被新 Listing 和库存业务使用，确认继续？',
              },
              type: 'link',
            },
            {
              auth: ['cloudmold:catalog:lifecycle'],
              danger: true,
              ifShow: () => [0, 20].includes(row.catalogStatus),
              label: '归档',
              popConfirm: {
                confirm: () =>
                  runSkuLifecycle(row, CatalogLifecycleAction.ARCHIVE, '归档'),
                title: '归档不可直接恢复，确认归档该 SKU？',
              },
              type: 'link',
            },
          ]"
        />
      </template>
    </Grid>

    <DetailDrawer v-model:open="detailOpen" :sku-id="detailSkuId" />
  </Page>
</template>
