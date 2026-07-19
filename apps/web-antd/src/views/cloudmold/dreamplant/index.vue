<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloudMoldDreamPlantApi } from '#/api/cloudmold/dreamplant';

import { Page } from '@vben/common-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getCloudMoldDreamPlantExplorationPage } from '#/api/cloudmold/dreamplant';

import CopyIdCell from '../shared/copy-id-cell.vue';
import EvidenceAlert from '../shared/evidence-alert.vue';
import StatusTag from '../shared/status-tag.vue';
import {
  explorationStatusMeta,
  useDreamPlantExplorationColumns,
  useDreamPlantExplorationFormSchema,
} from './data';

defineOptions({ name: 'CloudMoldDreamPlantExploration' });

type StatusMeta = Record<string, { color: string; label: string }>;

function getMeta(metadata: StatusMeta, status: string) {
  return metadata[status] ?? { color: 'default', label: status };
}

const [Grid] = useVbenVxeGrid({
  formOptions: { schema: useDreamPlantExplorationFormSchema() },
  gridOptions: {
    columns: useDreamPlantExplorationColumns(),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) =>
          await getCloudMoldDreamPlantExplorationPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          }),
      },
    },
    rowConfig: { isHover: true, keyField: 'explorationRunId' },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<CloudMoldDreamPlantApi.Exploration>,
});
</script>

<template>
  <Page auto-content-height>
    <EvidenceAlert
      message="CloudMold 规范 DreamPlant 探索权威"
      description="本页只读取 CloudMold DreamPlant 探索运行表；世界地图快照、知识图谱与上下文负载按设计不展示，不读取 yudao Infra 业务表。"
    />

    <Grid table-title="规范 DreamPlant 探索运行">
      <template #exploration-run-id="{ row }">
        <CopyIdCell :value="row.explorationRunId" label="探索运行 ID" />
      </template>
      <template #status="{ row }">
        <StatusTag v-bind="getMeta(explorationStatusMeta, row.status)" />
      </template>
    </Grid>
  </Page>
</template>
