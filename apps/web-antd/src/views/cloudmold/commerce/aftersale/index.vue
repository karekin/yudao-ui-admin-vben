<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloudMoldCommerceApi } from '#/api/cloudmold/commerce';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getCloudMoldAfterSalePage } from '#/api/cloudmold/commerce';
import { approveAfterSale } from '#/api/cloudmold/commerce/command';

import CopyIdCell from '../../shared/copy-id-cell.vue';
import { getCurrentPrincipal } from '../../shared/current-principal';
import EvidenceAlert from '../../shared/evidence-alert.vue';
import StatusTag from '../../shared/status-tag.vue';
import { commerceStatusColor } from '../status';
import {
  AfterSaleCaseStatus,
  useAfterSaleColumns,
  useAfterSaleFormSchema,
} from './data';
import DetailDrawer from './detail-drawer.vue';

defineOptions({ name: 'CloudMoldCommerceAfterSale' });

const detailOpen = ref(false);
const detailAfterSaleId = ref<null | string>(null);
const currentPrincipal = ref<null | string>(null);

function openDetail(afterSaleId: string) {
  detailAfterSaleId.value = afterSaleId;
  detailOpen.value = true;
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: { schema: useAfterSaleFormSchema() },
  gridOptions: {
    columns: useAfterSaleColumns(),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) =>
          await getCloudMoldAfterSalePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          }),
      },
    },
    rowConfig: { isHover: true, keyField: 'afterSaleId' },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<CloudMoldCommerceApi.AfterSale>,
});

onMounted(async () => {
  currentPrincipal.value = await getCurrentPrincipal();
});

function handleRefresh() {
  gridApi.query();
}

/** 审核按钮可见：caseStatus 为 REQUESTED 且当前管理员已解析到 CloudMold principal */
function canApprove(row: CloudMoldCommerceApi.AfterSale) {
  return (
    row.caseStatus === AfterSaleCaseStatus.REQUESTED &&
    currentPrincipal.value !== null
  );
}

function afterSaleActionHint(row: CloudMoldCommerceApi.AfterSale) {
  if (row.caseStatus === AfterSaleCaseStatus.REQUESTED && !canApprove(row)) {
    return '待授权审核';
  }
  if (row.caseStatus === AfterSaleCaseStatus.APPROVED) {
    return '已审核';
  }
  if (row.caseStatus === AfterSaleCaseStatus.RESOLUTION_PENDING) {
    return '自动处理中';
  }
  return '';
}

async function handleApprove(row: CloudMoldCommerceApi.AfterSale) {
  if (!currentPrincipal.value) {
    message.error('当前管理员未解析到 CloudMold principal，无法审核');
    return;
  }
  const hideLoading = message.loading({
    content: '正在审核…',
    duration: 0,
  });
  try {
    const result = await approveAfterSale(
      row.afterSaleId,
      row.aggregateVersion,
      currentPrincipal.value,
    );
    if (result.duplicate) {
      message.warning('该操作已处理（幂等重放）');
    } else {
      message.success('审核通过');
    }
    handleRefresh();
  } catch (error) {
    message.error(
      `审核失败：${error instanceof Error ? error.message : '请稍后重试'}`,
    );
    handleRefresh();
  } finally {
    hideLoading();
  }
}
</script>

<template>
  <Page auto-content-height>
    <EvidenceAlert page="aftersale" />

    <Grid table-title="售后退款">
      <template #after-sale-no="{ row }">
        <CopyIdCell :value="row.afterSaleNo" label="售后单号" />
      </template>
      <template #status="{ row }">
        <StatusTag
          :color="commerceStatusColor(row.caseStatus)"
          :label="row.caseStatus"
        />
      </template>
      <template #refund-status="{ row }">
        <StatusTag :label="row.refundStatus" />
      </template>
      <template #saga-status="{ row }">
        <StatusTag :label="row.resolutionSagaStatus" />
      </template>
      <template #action="{ row }">
        <TableAction
          :actions="[
            {
              label: '详情',
              onClick: () => openDetail(row.afterSaleId),
              type: 'link',
            },
            {
              auth: ['cloudmold:aftersale:command'],
              ifShow: () => canApprove(row),
              label: '审核',
              onClick: handleApprove.bind(null, row),
              type: 'link',
            },
            {
              disabled: true,
              ifShow: () => Boolean(afterSaleActionHint(row)),
              label: afterSaleActionHint(row),
              type: 'link',
            },
          ]"
        />
      </template>
    </Grid>

    <DetailDrawer
      v-model:open="detailOpen"
      :after-sale-id="detailAfterSaleId"
    />
  </Page>
</template>
