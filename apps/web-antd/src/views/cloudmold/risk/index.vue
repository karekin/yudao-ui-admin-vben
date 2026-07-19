<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloudMoldRiskApi } from '#/api/cloudmold/risk';

import { onMounted, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  closeReview,
  getCloudMoldRiskReviewPage,
  startReview,
} from '#/api/cloudmold/risk';

import CopyIdCell from '../shared/copy-id-cell.vue';
import { getCurrentPrincipal } from '../shared/current-principal';
import EvidenceAlert from '../shared/evidence-alert.vue';
import StatusTag from '../shared/status-tag.vue';
import {
  reviewStatusMeta,
  useRiskReviewColumns,
  useRiskReviewFormSchema,
} from './data';
import DecideForm from './modules/decide-form.vue';

defineOptions({ name: 'CloudMoldRiskReview' });

type StatusMeta = Record<string, { color: string; label: string }>;

function getMeta(metadata: StatusMeta, status: string) {
  return metadata[status] ?? { color: 'default', label: status };
}

const currentPrincipal = ref<null | string>(null);

const [DecideModal, decideModalApi] = useVbenModal({
  connectedComponent: DecideForm,
  destroyOnClose: true,
});

const [Grid, gridApi] = useVbenVxeGrid({
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

onMounted(async () => {
  currentPrincipal.value = await getCurrentPrincipal();
});

function handleRefresh() {
  gridApi.query();
}

/** 执行审核流转命令的统一闭环：防双击 loading → 幂等调用 → 成功/失败提示 → 刷新 */
async function runReviewAction(
  action: () => Promise<CloudMoldRiskApi.ReviewCommandResult>,
  actionName: string,
) {
  const hideLoading = message.loading({
    content: `正在${actionName}…`,
    duration: 0,
  });
  try {
    const result = await action();
    if (result.duplicate) {
      message.warning('该操作已处理（幂等重放）');
    } else {
      message.success(`${actionName}成功`);
    }
    handleRefresh();
  } catch (error) {
    message.error(
      `${actionName}失败：${error instanceof Error ? error.message : '请稍后重试'}`,
    );
    handleRefresh();
  } finally {
    hideLoading();
  }
}

function handleClose(row: CloudMoldRiskApi.ReviewCase) {
  return runReviewAction(
    () => closeReview(row.caseId, row.aggregateVersion),
    '关闭审核',
  );
}

function handleDecide(row: CloudMoldRiskApi.ReviewCase) {
  decideModalApi
    .setData({
      caseId: row.caseId,
      decidedByPrincipalId: row.reviewerPrincipalId,
      expectedVersion: row.aggregateVersion,
    })
    .open();
}

function handleStart(row: CloudMoldRiskApi.ReviewCase) {
  return runReviewAction(
    () => startReview(row.caseId, row.aggregateVersion),
    '开始审核',
  );
}
</script>

<template>
  <Page auto-content-height>
    <EvidenceAlert
      message="CloudMold 规范风控审核权威"
      description="本页读取 CloudMold Risk 审核案例，并支持审核流转（开始/决策/关闭，幂等命令 + 乐观版本）；决策仅指派审核员可操作。不读取 yudao Mall 业务表。"
    />

    <DecideModal @success="handleRefresh" />
    <Grid table-title="规范风控审核案例">
      <template #case-id="{ row }">
        <CopyIdCell :value="row.caseId" label="案例 ID" />
      </template>
      <template #status="{ row }">
        <StatusTag v-bind="getMeta(reviewStatusMeta, row.status)" />
      </template>
      <template #action="{ row }">
        <TableAction
          :actions="[
            {
              ifShow: () => row.status === 'OPEN',
              label: '开始审核',
              onClick: handleStart.bind(null, row),
              type: 'link',
            },
            {
              ifShow: () =>
                row.status === 'IN_REVIEW' &&
                currentPrincipal !== null &&
                row.reviewerPrincipalId === currentPrincipal,
              label: '决策',
              onClick: handleDecide.bind(null, row),
              type: 'link',
            },
            {
              ifShow: () => row.status === 'DECIDED',
              label: '关闭',
              onClick: handleClose.bind(null, row),
              type: 'link',
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
