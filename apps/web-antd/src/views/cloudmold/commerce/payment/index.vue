<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloudMoldCommerceApi } from '#/api/cloudmold/commerce';

import { Page } from '@vben/common-ui';

import { Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getCloudMoldPaymentPage } from '#/api/cloudmold/commerce';

import CopyIdCell from '../../shared/copy-id-cell.vue';
import EvidenceAlert from '../../shared/evidence-alert.vue';
import StatusTag from '../../shared/status-tag.vue';
import { commerceStatusColor } from '../status';
import { usePaymentColumns, usePaymentFormSchema } from './data';

defineOptions({ name: 'CloudMoldCommercePayment' });

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
    <EvidenceAlert
      type="info"
      message="CloudMold 规范 Payment 权威"
      description="本页只读取 CloudMold Payment 规范表；资金事实与支付通道状态分离，不读取 yudao Mall Pay 业务表。"
    />

    <EvidenceAlert
      type="warning"
      message="当前支付首切片为 INTERNAL_TEST"
      description="测试通道事实不能视为真实支付渠道已投产；接入真实 Provider 后仍需独立验收。"
    />

    <Grid table-title="规范 Payment">
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
          {{ row.testMode ? 'INTERNAL_TEST' : '真实通道' }}
        </Tag>
      </template>
    </Grid>
  </Page>
</template>
