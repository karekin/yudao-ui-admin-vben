<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloudMoldAiOperationsApi } from '#/api/cloudmold/ai-operations';

import { Page } from '@vben/common-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getCloudMoldAiWorkflowRunPage } from '#/api/cloudmold/ai-operations';

import CopyIdCell from '../shared/copy-id-cell.vue';
import EvidenceAlert from '../shared/evidence-alert.vue';
import StatusTag from '../shared/status-tag.vue';
import {
  useAiWorkflowRunColumns,
  useAiWorkflowRunFormSchema,
  workflowRunStatusMeta,
} from './data';

defineOptions({ name: 'CloudMoldAiWorkflowRun' });

type StatusMeta = Record<string, { color: string; label: string }>;

function getMeta(metadata: StatusMeta, status: string) {
  return metadata[status] ?? { color: 'default', label: status };
}

const [Grid] = useVbenVxeGrid({
  formOptions: { schema: useAiWorkflowRunFormSchema() },
  gridOptions: {
    columns: useAiWorkflowRunColumns(),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) =>
          await getCloudMoldAiWorkflowRunPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          }),
      },
    },
    rowConfig: { isHover: true, keyField: 'runId' },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<CloudMoldAiOperationsApi.WorkflowRun>,
});
</script>

<template>
  <Page auto-content-height>
    <EvidenceAlert
      message="CloudMold 规范 AI 工作流运行权威"
      description="本页只读取 CloudMold AI Operations 工作流运行表；调用明细、反馈与定义彼此分离，不读取 yudao Infra 业务表。"
    />

    <Grid table-title="规范 AI 工作流运行">
      <template #run-id="{ row }">
        <CopyIdCell :value="row.runId" label="运行 ID" />
      </template>
      <template #status="{ row }">
        <StatusTag v-bind="getMeta(workflowRunStatusMeta, row.status)" />
      </template>
    </Grid>
  </Page>
</template>
