<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloudMoldCommerceApi } from '#/api/cloudmold/commerce';

import { Page } from '@vben/common-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getCloudMoldFulfillmentPage } from '#/api/cloudmold/commerce';

import CopyIdCell from '../../shared/copy-id-cell.vue';
import EvidenceAlert from '../../shared/evidence-alert.vue';
import StatusTag from '../../shared/status-tag.vue';
import { commerceStatusColor } from '../status';
import { useFulfillmentColumns, useFulfillmentFormSchema } from './data';

defineOptions({ name: 'CloudMoldCommerceFulfillment' });

const [Grid] = useVbenVxeGrid({
  formOptions: { schema: useFulfillmentFormSchema() },
  gridOptions: {
    columns: useFulfillmentColumns(),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) =>
          await getCloudMoldFulfillmentPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          }),
      },
    },
    rowConfig: { isHover: true, keyField: 'fulfillmentId' },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<CloudMoldCommerceApi.Fulfillment>,
});
</script>

<template>
  <Page auto-content-height>
    <EvidenceAlert
      message="CloudMold 规范 Fulfillment 权威"
      description="本页只读取 CloudMold Fulfillment 规范表；履约意图与发运事实分离，不读取 yudao Mall Trade 或 ERP / WMS 业务表。"
    />

    <EvidenceAlert
      type="warning"
      message="当前为单发运首切片"
      description="页面展示正向履约和首个发运事实；多包裹与异常物流仍是后续验收门禁。"
    />

    <Grid table-title="规范 Fulfillment">
      <template #fulfillment-no="{ row }">
        <CopyIdCell :value="row.fulfillmentNo" label="履约单号" />
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
