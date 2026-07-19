<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloudMoldCommerceApi } from '#/api/cloudmold/commerce';

import { Page } from '@vben/common-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getCloudMoldAfterSalePage } from '#/api/cloudmold/commerce';

import CopyIdCell from '../../shared/copy-id-cell.vue';
import EvidenceAlert from '../../shared/evidence-alert.vue';
import StatusTag from '../../shared/status-tag.vue';
import { commerceStatusColor } from '../status';
import { useAfterSaleColumns, useAfterSaleFormSchema } from './data';

defineOptions({ name: 'CloudMoldCommerceAfterSale' });

const [Grid] = useVbenVxeGrid({
  formOptions: { schema: useAfterSaleFormSchema() },
  gridOptions: {
    columns: useAfterSaleColumns(),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) =>
          await getCloudMoldAfterSalePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          }),
      },
    },
    rowConfig: { isHover: true, keyField: 'afterSaleId' },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<CloudMoldCommerceApi.AfterSale>,
});
</script>

<template>
  <Page auto-content-height>
    <EvidenceAlert
      message="CloudMold 规范 AfterSale 权威"
      description="本页只读取 CloudMold AfterSale 规范表；售后决策、逆向物流、退款与库存返还彼此分离，不读取 yudao Mall Trade 业务表。"
    />

    <Grid table-title="规范 AfterSale">
      <template #after-sale-no="{ row }">
        <CopyIdCell :value="row.afterSaleNo" label="售后单号" />
      </template>
      <template #status="{ row }">
        <StatusTag
          :color="commerceStatusColor(row.caseStatus)"
          :label="row.caseStatus"
        />
      </template>
    </Grid>
  </Page>
</template>
