<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloudMoldCommerceApi } from '#/api/cloudmold/commerce';

import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Button, Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getCloudMoldPaymentPage } from '#/api/cloudmold/commerce';

import CopyIdCell from '../../shared/copy-id-cell.vue';
import EvidenceAlert from '../../shared/evidence-alert.vue';
import StatusTag from '../../shared/status-tag.vue';
import { commerceStatusColor } from '../status';
import { usePaymentColumns, usePaymentFormSchema } from './data';
import DetailDrawer from './detail-drawer.vue';

defineOptions({ name: 'CloudMoldCommercePayment' });

const detailOpen = ref(false);
const detailPaymentId = ref<null | string>(null);

function openDetail(paymentId: string) {
  detailPaymentId.value = paymentId;
  detailOpen.value = true;
}

const [Grid] = useVbenVxeGrid({
  formOptions: { schema: usePaymentFormSchema() },
  gridOptions: {
    columns: usePaymentColumns(),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) =>
          await getCloudMoldPaymentPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          }),
      },
    },
    rowConfig: { isHover: true, keyField: 'paymentId' },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<CloudMoldCommerceApi.Payment>,
});
</script>

<template>
  <Page auto-content-height>
    <EvidenceAlert page="payment" />

    <Grid table-title="支付记录">
      <template #payment-no="{ row }">
        <CopyIdCell :value="row.paymentNo" label="支付单号" />
      </template>
      <template #status="{ row }">
        <StatusTag
          :color="commerceStatusColor(row.status)"
          :label="row.status"
        />
      </template>
      <template #test-mode="{ row }">
        <Tag :color="row.testMode ? 'warning' : 'success'">
          {{ row.testMode ? '内部测试' : '真实通道' }}
        </Tag>
      </template>
      <template #action="{ row }">
        <Button type="link" size="small" @click="openDetail(row.paymentId)">
          详情
        </Button>
      </template>
    </Grid>

    <DetailDrawer v-model:open="detailOpen" :payment-id="detailPaymentId" />
  </Page>
</template>
