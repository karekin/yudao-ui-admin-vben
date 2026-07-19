<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloudMoldGamificationApi } from '#/api/cloudmold/gamification';

import { Page } from '@vben/common-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getCloudMoldGamificationAccountPage } from '#/api/cloudmold/gamification';

import CopyIdCell from '../shared/copy-id-cell.vue';
import EvidenceAlert from '../shared/evidence-alert.vue';
import StatusTag from '../shared/status-tag.vue';
import {
  gamificationAccountStatusMeta,
  useGamificationAccountColumns,
  useGamificationAccountFormSchema,
} from './data';

defineOptions({ name: 'CloudMoldGamificationAccount' });

type StatusMeta = Record<string, { color: string; label: string }>;

function getMeta(metadata: StatusMeta, status: string) {
  return metadata[status] ?? { color: 'default', label: status };
}

const [Grid] = useVbenVxeGrid({
  formOptions: { schema: useGamificationAccountFormSchema() },
  gridOptions: {
    columns: useGamificationAccountColumns(),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) =>
          await getCloudMoldGamificationAccountPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          }),
      },
    },
    rowConfig: { isHover: true, keyField: 'accountId' },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<CloudMoldGamificationApi.Account>,
});
</script>

<template>
  <Page auto-content-height>
    <EvidenceAlert
      message="CloudMold 规范游戏币账户权威"
      description="本页只读取 CloudMold Gamification 货币账户；账户、流水、复式记账明细、奖励发放彼此分离，不读取 yudao Mall/Point 业务表。"
    />

    <Grid table-title="规范游戏币账户">
      <template #account-id="{ row }">
        <CopyIdCell :value="row.accountId" label="账户 ID" />
      </template>
      <template #status="{ row }">
        <StatusTag
          v-bind="getMeta(gamificationAccountStatusMeta, row.status)"
        />
      </template>
    </Grid>
  </Page>
</template>
