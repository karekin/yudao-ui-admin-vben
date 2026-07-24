<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloudMoldCommerceApi } from '#/api/cloudmold/commerce';
import type { CloudMoldCommerceCommandApi } from '#/api/cloudmold/commerce/command';

import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { message, Modal, Textarea } from 'ant-design-vue';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getCloudMoldListingPage } from '#/api/cloudmold/commerce';
import {
  approveBusinessListing,
  approveRiskListing,
  archiveListing,
  passCompletionListing,
  publishListing,
  rejectBusinessListing,
  rejectCompletionListing,
  rejectRiskListing,
  reviseListing,
  submitListing,
  suspendListing,
  unpublishListing,
} from '#/api/cloudmold/commerce/command';

import CopyIdCell from '../../shared/copy-id-cell.vue';
import EvidenceAlert from '../../shared/evidence-alert.vue';
import StatusTag from '../../shared/status-tag.vue';
import { commerceStatusColor } from '../status';
import { ListingStatus, useListingColumns, useListingFormSchema } from './data';

defineOptions({ name: 'CloudMoldCommerceListing' });

type Listing = CloudMoldCommerceApi.Listing;

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: { schema: useListingFormSchema() },
  gridOptions: {
    columns: useListingColumns(),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) =>
          await getCloudMoldListingPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          }),
      },
    },
    rowConfig: { isHover: true, keyField: 'listingId' },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<Listing>,
});

function handleRefresh() {
  gridApi.query();
}

/** 执行 listing 状态转换的统一闭环：防双击 loading → 幂等调用 → 成功/失败提示 → 刷新 */
async function runListingTransition(
  action: (
    listingId: string,
    expectedVersion: number,
  ) => Promise<CloudMoldCommerceCommandApi.CommandResult>,
  row: Listing,
  actionName: string,
) {
  const hideLoading = message.loading({
    content: `正在${actionName}…`,
    duration: 0,
  });
  try {
    const result = await action(row.listingId, row.version);
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

const handleSubmit = (row: Listing) =>
  runListingTransition(submitListing, row, '提交审核');
const handlePassCompletion = (row: Listing) =>
  runListingTransition(passCompletionListing, row, '通过完备性');
const handleApproveBusiness = (row: Listing) =>
  runListingTransition(approveBusinessListing, row, '通过业务');
const handleApproveRisk = (row: Listing) =>
  runListingTransition(approveRiskListing, row, '通过风控');
const handleRejectCompletion = (row: Listing) =>
  runListingTransition(rejectCompletionListing, row, '驳回完备性');
const handleRejectBusiness = (row: Listing) =>
  runListingTransition(rejectBusinessListing, row, '驳回业务');
const handleRejectRisk = (row: Listing) =>
  runListingTransition(rejectRiskListing, row, '驳回风控');
const handleRevise = (row: Listing) =>
  runListingTransition(reviseListing, row, '修订重提');
const handlePublish = (row: Listing) =>
  runListingTransition((id, v) => publishListing(id, v), row, '发布');
const handleUnpublish = (row: Listing) =>
  runListingTransition(unpublishListing, row, '下架');
const handleArchive = (row: Listing) =>
  runListingTransition(archiveListing, row, '归档');

/** 是否可重新发布（下架/暂停态可再次发布） */
function canRepublish(status: string) {
  return (
    status === ListingStatus.UNPUBLISHED || status === ListingStatus.SUSPENDED
  );
}

/** 是否可归档（草稿/驳回/下架/暂停态可归档） */
function canArchive(status: string) {
  return (
    status === ListingStatus.DRAFT ||
    status === ListingStatus.REJECTED ||
    status === ListingStatus.UNPUBLISHED ||
    status === ListingStatus.SUSPENDED
  );
}

// SUSPEND 需 reason，用受控 Modal 收集
const suspendOpen = ref(false);
const suspendReason = ref('');
const suspending = ref(false);
const suspendRow = ref<null | { listingId: string; version: number }>(null);

function handleSuspend(row: Listing) {
  suspendRow.value = {
    listingId: row.listingId,
    version: row.version,
  };
  suspendReason.value = '';
  suspendOpen.value = true;
}

async function confirmSuspend() {
  if (!suspendRow.value) return;
  const reason = suspendReason.value.trim();
  if (!reason) {
    message.warning('请输入暂停原因');
    return;
  }
  suspending.value = true;
  const hideLoading = message.loading({
    content: '正在暂停…',
    duration: 0,
  });
  try {
    const result = await suspendListing(
      suspendRow.value.listingId,
      suspendRow.value.version,
      reason,
    );
    if (result.duplicate) {
      message.warning('该操作已处理（幂等重放）');
    } else {
      message.success('暂停成功');
    }
    suspendOpen.value = false;
    handleRefresh();
  } catch (error) {
    message.error(
      `暂停失败：${error instanceof Error ? error.message : '请稍后重试'}`,
    );
  } finally {
    suspending.value = false;
    hideLoading();
  }
}
</script>

<template>
  <Page auto-content-height>
    <EvidenceAlert page="listing" />

    <Grid table-title="渠道商品">
      <template #listing-no="{ row }">
        <CopyIdCell :value="row.listingNo" label="刊登单号" />
      </template>
      <template #status="{ row }">
        <StatusTag
          :color="commerceStatusColor(row.status)"
          :label="row.status"
        />
      </template>
      <template #action="{ row }">
        <TableAction
          :actions="[
            {
              ifShow: () => row.status === ListingStatus.DRAFT,
              label: '提交',
              onClick: handleSubmit.bind(null, row),
              type: 'link',
            },
            {
              ifShow: () => row.status === ListingStatus.SUBMITTED,
              label: '通过完备',
              onClick: handlePassCompletion.bind(null, row),
              type: 'link',
            },
            {
              ifShow: () => row.status === ListingStatus.SUBMITTED,
              label: '驳回',
              onClick: handleRejectCompletion.bind(null, row),
              type: 'link',
            },
            {
              ifShow: () => row.status === ListingStatus.COMPLETION_PASSED,
              label: '通过业务',
              onClick: handleApproveBusiness.bind(null, row),
              type: 'link',
            },
            {
              ifShow: () => row.status === ListingStatus.COMPLETION_PASSED,
              label: '驳回',
              onClick: handleRejectBusiness.bind(null, row),
              type: 'link',
            },
            {
              ifShow: () => row.status === ListingStatus.BUSINESS_APPROVED,
              label: '通过风控',
              onClick: handleApproveRisk.bind(null, row),
              type: 'link',
            },
            {
              ifShow: () => row.status === ListingStatus.BUSINESS_APPROVED,
              label: '驳回',
              onClick: handleRejectRisk.bind(null, row),
              type: 'link',
            },
            {
              ifShow: () => row.status === ListingStatus.RISK_APPROVED,
              label: '发布',
              onClick: handlePublish.bind(null, row),
              type: 'link',
            },
            {
              ifShow: () => canRepublish(row.status),
              label: '重新发布',
              onClick: handlePublish.bind(null, row),
              type: 'link',
            },
            {
              ifShow: () => row.status === ListingStatus.REJECTED,
              label: '修订',
              onClick: handleRevise.bind(null, row),
              type: 'link',
            },
            {
              ifShow: () => row.status === ListingStatus.PUBLISHED,
              label: '下架',
              onClick: handleUnpublish.bind(null, row),
              type: 'link',
            },
            {
              ifShow: () => row.status === ListingStatus.PUBLISHED,
              label: '暂停',
              onClick: handleSuspend.bind(null, row),
              type: 'link',
            },
            {
              ifShow: () => canArchive(row.status),
              label: '归档',
              onClick: handleArchive.bind(null, row),
              type: 'link',
            },
          ]"
        />
      </template>
    </Grid>

    <Modal
      v-model:open="suspendOpen"
      :confirm-loading="suspending"
      title="暂停 Listing"
      @ok="confirmSuspend"
    >
      <Textarea
        v-model:value="suspendReason"
        :maxlength="256"
        :rows="3"
        placeholder="请输入暂停原因（必填，≤256 字符）"
        show-count
      />
    </Modal>
  </Page>
</template>
