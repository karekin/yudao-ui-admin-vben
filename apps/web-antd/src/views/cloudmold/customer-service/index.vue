<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloudMoldCustomerServiceApi } from '#/api/cloudmold/customer-service';

import { Page } from '@vben/common-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getCloudMoldCustomerServiceTicketPage } from '#/api/cloudmold/customer-service';

import CopyIdCell from '../shared/copy-id-cell.vue';
import EvidenceAlert from '../shared/evidence-alert.vue';
import StatusTag from '../shared/status-tag.vue';
import {
  ticketPriorityMeta,
  ticketStatusMeta,
  useCustomerServiceTicketColumns,
  useCustomerServiceTicketFormSchema,
} from './data';

defineOptions({ name: 'CloudMoldCustomerServiceTicket' });

type StatusMeta = Record<string, { color: string; label: string }>;

function getMeta(metadata: StatusMeta, status: string) {
  return metadata[status] ?? { color: 'default', label: status };
}

const [Grid] = useVbenVxeGrid({
  formOptions: { schema: useCustomerServiceTicketFormSchema() },
  gridOptions: {
    columns: useCustomerServiceTicketColumns(),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) =>
          await getCloudMoldCustomerServiceTicketPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          }),
      },
    },
    rowConfig: { isHover: true, keyField: 'ticketId' },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<CloudMoldCustomerServiceApi.Ticket>,
});
</script>

<template>
  <Page auto-content-height>
    <EvidenceAlert
      message="CloudMold 规范客服工单权威"
      description="本页只读取 CloudMold Customer Service 工单；工单、诉求、赔付、SLA 彼此分离，不读取 yudao Member 业务表。"
    />

    <Grid table-title="规范客服工单">
      <template #ticket-no="{ row }">
        <CopyIdCell :value="row.ticketNo" label="工单号" />
      </template>
      <template #status="{ row }">
        <StatusTag v-bind="getMeta(ticketStatusMeta, row.status)" />
      </template>
      <template #priority="{ row }">
        <StatusTag v-bind="getMeta(ticketPriorityMeta, row.priority)" />
      </template>
    </Grid>
  </Page>
</template>
