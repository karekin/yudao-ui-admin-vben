<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloudMoldOperationsIntelligenceApi } from '#/api/cloudmold/operations-intelligence';

import { Page } from '@vben/common-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getCloudMoldOperationsAlertPage } from '#/api/cloudmold/operations-intelligence';

import CopyIdCell from '../shared/copy-id-cell.vue';
import EvidenceAlert from '../shared/evidence-alert.vue';
import StatusTag from '../shared/status-tag.vue';
import {
  alertSeverityMeta,
  alertStatusMeta,
  useOperationsAlertColumns,
  useOperationsAlertFormSchema,
} from './data';

defineOptions({ name: 'CloudMoldOperationsAlert' });

type StatusMeta = Record<string, { color: string; label: string }>;

function getMeta(metadata: StatusMeta, status: string) {
  return metadata[status] ?? { color: 'default', label: status };
}

const [Grid] = useVbenVxeGrid({
  formOptions: { schema: useOperationsAlertFormSchema() },
  gridOptions: {
    columns: useOperationsAlertColumns(),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) =>
          await getCloudMoldOperationsAlertPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          }),
      },
    },
    rowConfig: { isHover: true, keyField: 'alertId' },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<CloudMoldOperationsIntelligenceApi.Alert>,
});
</script>

<template>
  <Page auto-content-height>
    <EvidenceAlert
      message="CloudMold 规范运营告警权威"
      description="本页只读取 CloudMold Operations Intelligence 告警工单；观察、线索、告警、复核彼此分离，告警标题仅存哈希以保护隐私，不读取 yudao 业务表。"
    />

    <Grid table-title="规范运营告警工单">
      <template #alert-id="{ row }">
        <CopyIdCell :value="row.alertId" label="告警 ID" />
      </template>
      <template #severity="{ row }">
        <StatusTag v-bind="getMeta(alertSeverityMeta, row.severity)" />
      </template>
      <template #status="{ row }">
        <StatusTag v-bind="getMeta(alertStatusMeta, row.status)" />
      </template>
    </Grid>
  </Page>
</template>
