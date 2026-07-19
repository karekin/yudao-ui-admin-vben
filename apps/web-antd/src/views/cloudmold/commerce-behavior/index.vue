<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloudMoldCommerceBehaviorApi } from '#/api/cloudmold/commerce-behavior';

import { Page } from '@vben/common-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getCloudMoldCommerceBehaviorEventPage } from '#/api/cloudmold/commerce-behavior';

import CopyIdCell from '../shared/copy-id-cell.vue';
import EvidenceAlert from '../shared/evidence-alert.vue';
import StatusTag from '../shared/status-tag.vue';
import {
  behaviorTypeMeta,
  useCommerceBehaviorEventColumns,
  useCommerceBehaviorEventFormSchema,
} from './data';

defineOptions({ name: 'CloudMoldCommerceBehaviorEvent' });

type StatusMeta = Record<string, { color: string; label: string }>;

function getMeta(metadata: StatusMeta, status: string) {
  return metadata[status] ?? { color: 'default', label: status };
}

const [Grid] = useVbenVxeGrid({
  formOptions: { schema: useCommerceBehaviorEventFormSchema() },
  gridOptions: {
    columns: useCommerceBehaviorEventColumns(),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) =>
          await getCloudMoldCommerceBehaviorEventPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          }),
      },
    },
    rowConfig: { isHover: true, keyField: 'behaviorId' },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<CloudMoldCommerceBehaviorApi.BehaviorEvent>,
});
</script>

<template>
  <Page auto-content-height>
    <EvidenceAlert
      message="CloudMold 规范交易行为权威"
      description="本页只读取 CloudMold Commerce Behavior 事件流；会话、行为事件、支付归因彼此分离，不读取 yudao Mall 业务表。"
    />

    <Grid table-title="规范交易行为事件">
      <template #behavior-id="{ row }">
        <CopyIdCell :value="row.behaviorId" label="行为 ID" />
      </template>
      <template #behavior-type="{ row }">
        <StatusTag v-bind="getMeta(behaviorTypeMeta, row.behaviorType)" />
      </template>
    </Grid>
  </Page>
</template>
