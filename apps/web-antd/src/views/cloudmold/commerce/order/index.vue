<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloudMoldCommerceApi } from '#/api/cloudmold/commerce';

import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Button } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getCloudMoldOrderPage } from '#/api/cloudmold/commerce';

import CopyIdCell from '../../shared/copy-id-cell.vue';
import EvidenceAlert from '../../shared/evidence-alert.vue';
import StatusTag from '../../shared/status-tag.vue';
import { commerceStatusColor } from '../status';
import { useOrderColumns, useOrderFormSchema } from './data';
import DetailDrawer from './detail-drawer.vue';

defineOptions({ name: 'CloudMoldCommerceOrder' });

const detailOpen = ref(false);
const detailOrderId = ref<null | string>(null);

function openDetail(orderId: string) {
  detailOrderId.value = orderId;
  detailOpen.value = true;
}

const [Grid] = useVbenVxeGrid({
  formOptions: { schema: useOrderFormSchema() },
  gridOptions: {
    columns: useOrderColumns(),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) =>
          await getCloudMoldOrderPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          }),
      },
    },
    rowConfig: { isHover: true, keyField: 'orderId' },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<CloudMoldCommerceApi.Order>,
});
</script>

<template>
  <Page auto-content-height>
    <EvidenceAlert
      message="CloudMold 规范 Order 权威"
      description="本页只读取 CloudMold Order 规范表；订单、资金事实与支付通道状态彼此分离，不读取 yudao Mall Trade 业务表。"
    />

    <Grid table-title="规范 Order">
      <template #order-no="{ row }">
        <CopyIdCell :value="row.orderNo" label="订单号" />
      </template>
      <template #status="{ row }">
        <StatusTag
          :color="commerceStatusColor(row.status)"
          :label="row.status"
        />
      </template>
      <template #action="{ row }">
        <Button type="link" size="small" @click="openDetail(row.orderId)">
          详情
        </Button>
      </template>
    </Grid>

    <DetailDrawer v-model:open="detailOpen" :order-id="detailOrderId" />
  </Page>
</template>
