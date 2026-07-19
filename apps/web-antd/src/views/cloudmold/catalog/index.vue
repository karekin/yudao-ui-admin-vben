<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloudMoldCatalogApi } from '#/api/cloudmold/catalog';

import { Page } from '@vben/common-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getCloudMoldCatalogSkuPage } from '#/api/cloudmold/catalog';

import CopyIdCell from '../shared/copy-id-cell.vue';
import EvidenceAlert from '../shared/evidence-alert.vue';
import StatusTag from '../shared/status-tag.vue';
import { catalogStatusMeta, useGridColumns, useGridFormSchema } from './data';

defineOptions({ name: 'CloudMoldCatalog' });

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
    <EvidenceAlert
      message="CloudMold 规范商品权威"
      description="本页只读取 CloudMold Catalog 的 Style / SPU / SKU / 款色码 / 条码和生命周期，不读取 yudao Mall、ERP 或 WMS 的旧商品表。"
    />

    <Grid table-title="规范 SKU 列表">
      <template #sku-code="{ row }">
        <CopyIdCell :value="row.skuCode" label="规范 SKU" />
      </template>
      <template #catalog-status="{ row }">
        <StatusTag v-bind="getStatusMeta(row.catalogStatus)" />
      </template>
    </Grid>
  </Page>
</template>
