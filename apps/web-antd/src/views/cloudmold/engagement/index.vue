<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloudMoldEngagementApi } from '#/api/cloudmold/engagement';

import { Page } from '@vben/common-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getCloudMoldEngagementCampaignPage } from '#/api/cloudmold/engagement';

import CopyIdCell from '../shared/copy-id-cell.vue';
import EvidenceAlert from '../shared/evidence-alert.vue';
import StatusTag from '../shared/status-tag.vue';
import {
  notificationStatusMeta,
  useNotificationCampaignColumns,
  useNotificationCampaignFormSchema,
} from './data';

defineOptions({ name: 'CloudMoldEngagementCampaign' });

type StatusMeta = Record<string, { color: string; label: string }>;

function getMeta(metadata: StatusMeta, status: string) {
  return metadata[status] ?? { color: 'default', label: status };
}

const [Grid] = useVbenVxeGrid({
  formOptions: { schema: useNotificationCampaignFormSchema() },
  gridOptions: {
    columns: useNotificationCampaignColumns(),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) =>
          await getCloudMoldEngagementCampaignPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          }),
      },
    },
    rowConfig: { isHover: true, keyField: 'campaignId' },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<CloudMoldEngagementApi.Campaign>,
});
</script>

<template>
  <Page auto-content-height>
    <EvidenceAlert
      message="CloudMold 规范通知活动权威"
      description="本页只读取 CloudMold Engagement 通知活动；活动、投递、回执、社区内容彼此分离，不读取 yudao Member/Notify 业务表。"
    />

    <Grid table-title="规范通知活动">
      <template #campaign-id="{ row }">
        <CopyIdCell :value="row.campaignId" label="活动 ID" />
      </template>
      <template #status="{ row }">
        <StatusTag v-bind="getMeta(notificationStatusMeta, row.status)" />
      </template>
    </Grid>
  </Page>
</template>
