<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloudMoldTokenPlatformApi } from '#/api/cloudmold/token-platform';

import { Page } from '@vben/common-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getCloudMoldTokenPlatformAccountPage } from '#/api/cloudmold/token-platform';

import CopyIdCell from '../shared/copy-id-cell.vue';
import EvidenceAlert from '../shared/evidence-alert.vue';
import StatusTag from '../shared/status-tag.vue';
import {
  tokenAccountStatusMeta,
  useTokenAccountColumns,
  useTokenAccountFormSchema,
} from './data';

defineOptions({ name: 'CloudMoldTokenPlatformAccount' });

type StatusMeta = Record<string, { color: string; label: string }>;

function getMeta(metadata: StatusMeta, status: string) {
  return metadata[status] ?? { color: 'default', label: status };
}

const [Grid] = useVbenVxeGrid({
  formOptions: { schema: useTokenAccountFormSchema() },
  gridOptions: {
    columns: useTokenAccountColumns(),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) =>
          await getCloudMoldTokenPlatformAccountPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          }),
      },
    },
    rowConfig: { isHover: true, keyField: 'accountId' },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<CloudMoldTokenPlatformApi.Account>,
});
</script>

<template>
  <Page auto-content-height>
    <EvidenceAlert
      message="CloudMold 规范 AI Token 配额账户权威"
      description="本页只读取 CloudMold Token Platform 配额账户；账户、配额流水、调用计费彼此分离，不读取 yudao Ai 业务表。"
    />

    <Grid table-title="规范 AI Token 配额账户">
      <template #account-id="{ row }">
        <CopyIdCell :value="row.accountId" label="账户 ID" />
      </template>
      <template #status="{ row }">
        <StatusTag v-bind="getMeta(tokenAccountStatusMeta, row.status)" />
      </template>
    </Grid>
  </Page>
</template>
