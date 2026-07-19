<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloudMoldEventOutboxApi } from '#/api/cloudmold/data-contract';

import { Page } from '@vben/common-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getCloudMoldEventOutboxPage } from '#/api/cloudmold/data-contract';

import CopyIdCell from '../shared/copy-id-cell.vue';
import EvidenceAlert from '../shared/evidence-alert.vue';
import StatusTag from '../shared/status-tag.vue';
import {
  eventOutboxStatusMeta,
  useEventOutboxColumns,
  useEventOutboxFormSchema,
} from './data';

defineOptions({ name: 'CloudMoldEventOutbox' });

type StatusMeta = Record<string, { color: string; label: string }>;

function getMeta(metadata: StatusMeta, status: string) {
  return metadata[status] ?? { color: 'default', label: status };
}

const [Grid] = useVbenVxeGrid({
  formOptions: { schema: useEventOutboxFormSchema() },
  gridOptions: {
    columns: useEventOutboxColumns(),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) =>
          await getCloudMoldEventOutboxPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          }),
      },
    },
    rowConfig: { isHover: true, keyField: 'eventId' },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<CloudMoldEventOutboxApi.EventOutbox>,
});
</script>

<template>
  <Page auto-content-height>
    <EvidenceAlert
      message="CloudMold 规范事件外发权威"
      description="本页只读取 CloudMold Event Outbox 领域事件外发表；payload、headers、错误明细按设计不展示，不读取 yudao Infra 业务表。"
    />

    <Grid table-title="规范事件外发">
      <template #event-id="{ row }">
        <CopyIdCell :value="row.eventId" label="事件 ID" />
      </template>
      <template #status="{ row }">
        <StatusTag
          v-bind="getMeta(eventOutboxStatusMeta, String(row.status))"
        />
      </template>
    </Grid>
  </Page>
</template>
