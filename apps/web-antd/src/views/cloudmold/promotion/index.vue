<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloudMoldPromotionApi } from '#/api/cloudmold/promotion';

import { Page } from '@vben/common-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getCloudMoldPromotionCampaignPage } from '#/api/cloudmold/promotion';

import CopyIdCell from '../shared/copy-id-cell.vue';
import EvidenceAlert from '../shared/evidence-alert.vue';
import StatusTag from '../shared/status-tag.vue';
import {
  promotionStatusMeta,
  usePromotionCampaignColumns,
  usePromotionCampaignFormSchema,
} from './data';

defineOptions({ name: 'CloudMoldPromotionCampaign' });

type StatusMeta = Record<string, { color: string; label: string }>;

function getMeta(metadata: StatusMeta, status: string) {
  return metadata[status] ?? { color: 'default', label: status };
}

const [Grid] = useVbenVxeGrid({
  formOptions: { schema: usePromotionCampaignFormSchema() },
  gridOptions: {
    columns: usePromotionCampaignColumns(),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) =>
          await getCloudMoldPromotionCampaignPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          }),
      },
    },
    rowConfig: { isHover: true, keyField: 'campaignId' },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<CloudMoldPromotionApi.Campaign>,
});
</script>

<template>
  <Page auto-content-height>
    <EvidenceAlert
      message="CloudMold 规范营销活动权威"
      description="本页只读取 CloudMold Promotion 营销活动；活动、券模板、广告投放、实验结果彼此分离，不读取 yudao Mall/Promotion 业务表。"
    />

    <Grid table-title="规范营销活动">
      <template #campaign-id="{ row }">
        <CopyIdCell :value="row.campaignId" label="活动 ID" />
      </template>
      <template #status="{ row }">
        <StatusTag v-bind="getMeta(promotionStatusMeta, row.status)" />
      </template>
    </Grid>
  </Page>
</template>
