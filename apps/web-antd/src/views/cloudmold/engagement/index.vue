<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloudMoldEngagementApi } from '#/api/cloudmold/engagement';

import { Page, useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  activateNotificationCampaign,
  completeNotificationCampaign,
  getCloudMoldEngagementCampaignPage,
  pauseNotificationCampaign,
} from '#/api/cloudmold/engagement';

import CopyIdCell from '../shared/copy-id-cell.vue';
import EvidenceAlert from '../shared/evidence-alert.vue';
import StatusTag from '../shared/status-tag.vue';
import {
  NotificationCampaignStatus,
  notificationStatusMeta,
  useNotificationCampaignColumns,
  useNotificationCampaignFormSchema,
} from './data';
import Form from './modules/form.vue';

defineOptions({ name: 'CloudMoldEngagementCampaign' });

type StatusMeta = Record<string, { color: string; label: string }>;

function getMeta(metadata: StatusMeta, status: string) {
  return metadata[status] ?? { color: 'default', label: status };
}

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [Grid, gridApi] = useVbenVxeGrid({
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

function handleCreate() {
  formModalApi.setData(null).open();
}

function handleRefresh() {
  gridApi.query();
}

/** 执行状态转换命令的统一闭环：防双击 loading → 幂等调用 → 成功/失败提示 → 刷新 */
async function runCampaignTransition(
  action: (
    row: CloudMoldEngagementApi.Campaign,
  ) => Promise<CloudMoldEngagementApi.EngagementCommandResult>,
  row: CloudMoldEngagementApi.Campaign,
  actionName: string,
) {
  const hideLoading = message.loading({
    content: `正在${actionName}…`,
    duration: 0,
  });
  try {
    const result = await action(row);
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

function handleActivate(row: CloudMoldEngagementApi.Campaign) {
  return runCampaignTransition(activateNotificationCampaign, row, '激活');
}

function handleComplete(row: CloudMoldEngagementApi.Campaign) {
  return runCampaignTransition(completeNotificationCampaign, row, '完成');
}

function handlePause(row: CloudMoldEngagementApi.Campaign) {
  return runCampaignTransition(pauseNotificationCampaign, row, '暂停');
}
</script>

<template>
  <Page auto-content-height>
    <EvidenceAlert
      message="CloudMold 规范通知活动权威"
      description="本页读取 CloudMold Engagement 通知活动，并支持新建与状态转换（幂等命令 + 乐观版本）；活动、投递、回执、社区内容彼此分离，不读取 yudao Member/Notify 业务表。"
    />

    <FormModal @success="handleRefresh" />
    <Grid table-title="规范通知活动">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              auth: ['cloudmold:engagement:notification:write'],
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
        <StatusTag v-bind="getMeta(notificationStatusMeta, row.status)" />
      </template>
      <template #action="{ row }">
        <TableAction
          :actions="[
            {
              ifShow: () =>
                [
                  NotificationCampaignStatus.DRAFT,
                  NotificationCampaignStatus.PAUSED,
                ].includes(row.status),
              label: '激活',
              onClick: handleActivate.bind(null, row),
              type: 'link',
            },
            {
              ifShow: () => row.status === NotificationCampaignStatus.ACTIVE,
              label: '暂停',
              onClick: handlePause.bind(null, row),
              type: 'link',
            },
            {
              ifShow: () =>
                [
                  NotificationCampaignStatus.ACTIVE,
                  NotificationCampaignStatus.PAUSED,
                ].includes(row.status),
              label: '完成',
              onClick: handleComplete.bind(null, row),
              type: 'link',
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
