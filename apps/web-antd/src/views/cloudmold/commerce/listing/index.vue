<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloudMoldCommerceApi } from '#/api/cloudmold/commerce';

import { Page } from '@vben/common-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getCloudMoldListingPage } from '#/api/cloudmold/commerce';

import CopyIdCell from '../../shared/copy-id-cell.vue';
import EvidenceAlert from '../../shared/evidence-alert.vue';
import StatusTag from '../../shared/status-tag.vue';
import { commerceStatusColor } from '../status';
import { useListingColumns, useListingFormSchema } from './data';

defineOptions({ name: 'CloudMoldCommerceListing' });

const [Grid] = useVbenVxeGrid({
  formOptions: { schema: useListingFormSchema() },
  gridOptions: {
    columns: useListingColumns(),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) =>
          await getCloudMoldListingPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          }),
      },
    },
    rowConfig: { isHover: true, keyField: 'listingId' },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<CloudMoldCommerceApi.Listing>,
});
</script>

<template>
  <Page auto-content-height>
    <EvidenceAlert
      message="CloudMold 规范 Listing 权威"
      description="本页只读取 CloudMold Listing 规范表；不读取 yudao Mall Trade、Pay、ERP 或 WMS 业务表。"
    />

    <Grid table-title="规范 Listing">
      <template #listing-no="{ row }">
        <CopyIdCell :value="row.listingNo" label="刊登单号" />
      </template>
      <template #status="{ row }">
        <StatusTag
          :color="commerceStatusColor(row.status)"
          :label="row.status"
        />
      </template>
    </Grid>
  </Page>
</template>
