<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloudMoldCatalogApi } from '#/api/cloudmold/catalog';

import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Button } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getCloudMoldCatalogSkuPage } from '#/api/cloudmold/catalog';

import CopyIdCell from '../shared/copy-id-cell.vue';
import EvidenceAlert from '../shared/evidence-alert.vue';
import StatusTag from '../shared/status-tag.vue';
import { catalogStatusMeta, useGridColumns, useGridFormSchema } from './data';
import DetailDrawer from './detail-drawer.vue';

defineOptions({ name: 'CloudMoldCatalog' });

const detailOpen = ref(false);
const detailSkuId = ref<null | string>(null);

function openDetail(skuId: string) {
  detailSkuId.value = skuId;
  detailOpen.value = true;
}

const [Grid] = useVbenVxeGrid({
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

    <Grid table-title="商品与 SKU">
      <template #sku-code="{ row }">
        <CopyIdCell :value="row.skuCode" label="规范 SKU" />
      </template>
      <template #catalog-status="{ row }">
        <StatusTag v-bind="getStatusMeta(row.catalogStatus)" />
      </template>
      <template #action="{ row }">
        <Button
          type="link"
          size="small"
          @click="openDetail(row.canonicalSkuId)"
        >
          详情
        </Button>
      </template>
    </Grid>

    <DetailDrawer v-model:open="detailOpen" :sku-id="detailSkuId" />
  </Page>
</template>
