<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloudMoldMetadataApi } from '#/api/cloudmold/metadata';

import { Page } from '@vben/common-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getCloudMoldMetadataDefinitionPage } from '#/api/cloudmold/metadata';

import CopyIdCell from '../shared/copy-id-cell.vue';
import EvidenceAlert from '../shared/evidence-alert.vue';
import StatusTag from '../shared/status-tag.vue';
import {
  definitionKindMeta,
  definitionStatusMeta,
  useMetadataDefinitionColumns,
  useMetadataDefinitionFormSchema,
} from './data';

defineOptions({ name: 'CloudMoldMetadataDefinition' });

type StatusMeta = Record<string, { color: string; label: string }>;

function getMeta(metadata: StatusMeta, status: string) {
  return metadata[status] ?? { color: 'default', label: status };
}

const [Grid] = useVbenVxeGrid({
  formOptions: { schema: useMetadataDefinitionFormSchema() },
  gridOptions: {
    columns: useMetadataDefinitionColumns(),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) =>
          await getCloudMoldMetadataDefinitionPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          }),
      },
    },
    rowConfig: { isHover: true, keyField: 'definitionId' },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<CloudMoldMetadataApi.Definition>,
});
</script>

<template>
  <Page auto-content-height>
    <EvidenceAlert
      message="CloudMold 规范元数据定义权威"
      description="本页只读取 CloudMold Metadata 逻辑定义；定义、版本、字段 schema、血缘、质量规则彼此分离，不读取 yudao Infra 业务表。"
    />

    <Grid table-title="规范元数据定义">
      <template #definition-id="{ row }">
        <CopyIdCell :value="row.definitionId" label="定义 ID" />
      </template>
      <template #definition-kind="{ row }">
        <StatusTag v-bind="getMeta(definitionKindMeta, row.definitionKind)" />
      </template>
      <template #status="{ row }">
        <StatusTag v-bind="getMeta(definitionStatusMeta, row.status)" />
      </template>
    </Grid>
  </Page>
</template>
