<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloudMoldRiskApi } from '#/api/cloudmold/risk';

import { Page } from '@vben/common-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getCloudMoldRiskReviewPage } from '#/api/cloudmold/risk';

import CopyIdCell from '../shared/copy-id-cell.vue';
import EvidenceAlert from '../shared/evidence-alert.vue';
import StatusTag from '../shared/status-tag.vue';
import {
  reviewStatusMeta,
  useRiskReviewColumns,
  useRiskReviewFormSchema,
} from './data';

defineOptions({ name: 'CloudMoldRiskReview' });

type StatusMeta = Record<string, { color: string; label: string }>;

function getMeta(metadata: StatusMeta, status: string) {
  return metadata[status] ?? { color: 'default', label: status };
}

const [Grid] = useVbenVxeGrid({
  formOptions: { schema: useRiskReviewFormSchema() },
  gridOptions: {
    columns: useRiskReviewColumns(),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) =>
          await getCloudMoldRiskReviewPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          }),
      },
    },
    rowConfig: { isHover: true, keyField: 'caseId' },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<CloudMoldRiskApi.ReviewCase>,
});
</script>

<template>
  <Page auto-content-height>
    <EvidenceAlert
      message="CloudMold 规范风控审核权威"
      description="本页只读取 CloudMold Risk 审核案例；风控策略、情报聚类、审核决策彼此分离，不读取 yudao Mall 业务表。"
    />

    <Grid table-title="规范风控审核案例">
      <template #case-id="{ row }">
        <CopyIdCell :value="row.caseId" label="案例 ID" />
      </template>
      <template #status="{ row }">
        <StatusTag v-bind="getMeta(reviewStatusMeta, row.status)" />
      </template>
    </Grid>
  </Page>
</template>
