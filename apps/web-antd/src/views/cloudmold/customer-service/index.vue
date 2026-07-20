<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloudMoldCustomerServiceApi } from '#/api/cloudmold/customer-service';
import type { CloudMoldCustomerServiceCommandApi } from '#/api/cloudmold/customer-service/command';

import { Page } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getCloudMoldCustomerServiceTicketPage } from '#/api/cloudmold/customer-service';
import {
  closeTicket,
  reopenTicket,
  resolveTicket,
  startProcessingTicket,
} from '#/api/cloudmold/customer-service/command';

import CopyIdCell from '../shared/copy-id-cell.vue';
import EvidenceAlert from '../shared/evidence-alert.vue';
import StatusTag from '../shared/status-tag.vue';
import {
  ticketPriorityMeta,
  TicketStatus,
  ticketStatusMeta,
  useCustomerServiceTicketColumns,
  useCustomerServiceTicketFormSchema,
} from './data';

defineOptions({ name: 'CloudMoldCustomerServiceTicket' });

type StatusMeta = Record<string, { color: string; label: string }>;

function getMeta(metadata: StatusMeta, status: string) {
  return metadata[status] ?? { color: 'default', label: status };
}

const [Grid, gridApi] = useVbenVxeGrid({
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

function handleRefresh() {
  gridApi.query();
}

/** 执行工单状态转换的统一闭环：防双击 loading → 幂等调用 → 成功/失败提示 → 刷新 */
async function runTicketTransition(
  action: (
    ticketId: string,
    expectedVersion: number,
  ) => Promise<CloudMoldCustomerServiceCommandApi.CommandResult>,
  row: CloudMoldCustomerServiceApi.Ticket,
  actionName: string,
) {
  const hideLoading = message.loading({
    content: `正在${actionName}…`,
    duration: 0,
  });
  try {
    const result = await action(row.ticketId, row.aggregateVersion);
    if (result.duplicate) {
      message.warning('该操作已处理（幂等重放）');
    } else {
      message.success(`${actionName}成功`);
    }
    handleRefresh();
  } catch (error) {
    message.error(
      `${actionName}失败：${error instanceof Error ? error.message : '请稍后重试'}`,
    );
    handleRefresh();
  } finally {
    hideLoading();
  }
}

function handleStartProcessing(row: CloudMoldCustomerServiceApi.Ticket) {
  return runTicketTransition(startProcessingTicket, row, '开始处理');
}

function handleResolve(row: CloudMoldCustomerServiceApi.Ticket) {
  return runTicketTransition(resolveTicket, row, '解决工单');
}

function handleClose(row: CloudMoldCustomerServiceApi.Ticket) {
  return runTicketTransition(closeTicket, row, '关闭工单');
}

function handleReopen(row: CloudMoldCustomerServiceApi.Ticket) {
  return runTicketTransition(reopenTicket, row, '重开工单');
}
</script>

<template>
  <Page auto-content-height>
    <EvidenceAlert
      message="CloudMold 规范客服工单权威"
      description="本页读取 CloudMold Customer Service 工单，并支持工单状态转换（开始处理/解决/关闭/重开，幂等命令 + 乐观版本）；工单、诉求、赔付、SLA 彼此分离，不读取 yudao Member 业务表。"
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
      <template #action="{ row }">
        <TableAction
          :actions="[
            {
              ifShow: () => row.status === TicketStatus.OPEN,
              label: '开始处理',
              onClick: handleStartProcessing.bind(null, row),
              type: 'link',
            },
            {
              ifShow: () =>
                row.status === TicketStatus.OPEN ||
                row.status === TicketStatus.IN_PROGRESS,
              label: '解决',
              onClick: handleResolve.bind(null, row),
              type: 'link',
            },
            {
              ifShow: () => row.status === TicketStatus.RESOLVED,
              label: '关闭',
              onClick: handleClose.bind(null, row),
              type: 'link',
            },
            {
              ifShow: () =>
                row.status === TicketStatus.RESOLVED ||
                row.status === TicketStatus.CLOSED,
              label: '重开',
              onClick: handleReopen.bind(null, row),
              type: 'link',
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
