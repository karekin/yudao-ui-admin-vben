<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloudMoldPromotionApi } from '#/api/cloudmold/promotion';

import { Page, useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  activateCampaign,
  cancelCampaign,
  completeCampaign,
  getCloudMoldPromotionCampaignPage,
  pauseCampaign,
} from '#/api/cloudmold/promotion';

import CopyIdCell from '../shared/copy-id-cell.vue';
import EvidenceAlert from '../shared/evidence-alert.vue';
import StatusTag from '../shared/status-tag.vue';
import {
  PromotionCampaignStatus,
  promotionStatusMeta,
  usePromotionCampaignColumns,
  usePromotionCampaignFormSchema,
} from './data';
import Form from './modules/form.vue';

defineOptions({ name: 'CloudMoldPromotionCampaign' });

type StatusMeta = Record<string, { color: string; label: string }>;

function getMeta(metadata: StatusMeta, status: string) {
  return metadata[status] ?? { color: 'default', label: status };
}

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [Grid, gridApi] = useVbenVxeGrid({
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

function handleCreate() {
  formModalApi.setData(null).open();
}

function handleRefresh() {
  gridApi.query();
}

/** 执行状态转换命令的统一闭环：防双击 loading → 幂等调用 → 成功/失败提示 → 刷新 */
async function runCampaignTransition(
  action: (
    campaignId: string,
    expectedVersion: number,
  ) => Promise<CloudMoldPromotionApi.CampaignCommandResult>,
  row: CloudMoldPromotionApi.Campaign,
  actionName: string,
) {
  const hideLoading = message.loading({
    content: `正在${actionName}…`,
    duration: 0,
  });
  try {
    const result = await action(row.campaignId, row.aggregateVersion);
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

function handleActivate(row: CloudMoldPromotionApi.Campaign) {
  return runCampaignTransition(activateCampaign, row, '激活');
}

function handleCancel(row: CloudMoldPromotionApi.Campaign) {
  return runCampaignTransition(cancelCampaign, row, '取消');
}

function handleComplete(row: CloudMoldPromotionApi.Campaign) {
  return runCampaignTransition(completeCampaign, row, '完成');
}

function handlePause(row: CloudMoldPromotionApi.Campaign) {
  return runCampaignTransition(pauseCampaign, row, '暂停');
}
</script>

<template>
  <Page auto-content-height>
    <EvidenceAlert
      message="CloudMold 规范营销活动权威"
      description="本页读取 CloudMold Promotion 营销活动，并支持新建与状态转换（幂等命令 + 乐观版本）；活动、券模板、广告投放、实验结果彼此分离，不读取 yudao Mall/Promotion 业务表。"
    />

    <FormModal @success="handleRefresh" />
    <Grid table-title="规范营销活动">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              auth: ['cloudmold:promotion:command'],
              icon: ACTION_ICON.ADD,
              label: '新建活动',
              onClick: handleCreate,
              type: 'primary',
            },
          ]"
        />
      </template>
      <template #campaign-id="{ row }">
        <CopyIdCell :value="row.campaignId" label="活动 ID" />
      </template>
      <template #status="{ row }">
        <StatusTag v-bind="getMeta(promotionStatusMeta, row.status)" />
      </template>
      <template #action="{ row }">
        <TableAction
          :actions="[
            {
              ifShow: () =>
                [
                  PromotionCampaignStatus.DRAFT,
                  PromotionCampaignStatus.PAUSED,
                ].includes(row.status),
              label: '激活',
              onClick: handleActivate.bind(null, row),
              type: 'link',
            },
            {
              ifShow: () => row.status === PromotionCampaignStatus.ACTIVE,
              label: '暂停',
              onClick: handlePause.bind(null, row),
              type: 'link',
            },
            {
              ifShow: () => row.status === PromotionCampaignStatus.ACTIVE,
              label: '完成',
              onClick: handleComplete.bind(null, row),
              type: 'link',
            },
            {
              danger: true,
              ifShow: () =>
                [
                  PromotionCampaignStatus.ACTIVE,
                  PromotionCampaignStatus.DRAFT,
                  PromotionCampaignStatus.PAUSED,
                ].includes(row.status),
              label: '取消',
              popConfirm: {
                confirm: handleCancel.bind(null, row),
                title: '确认取消该活动？取消后不可恢复。',
              },
              type: 'link',
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
