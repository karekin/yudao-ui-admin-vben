<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloudMoldCommerceApi } from '#/api/cloudmold/commerce';
import type { CloudMoldCommerceCommandApi } from '#/api/cloudmold/commerce/command';

import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Input, message, Modal } from 'ant-design-vue';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getCloudMoldFulfillmentPage } from '#/api/cloudmold/commerce';
import {
  deliverFulfillment,
  markFulfillmentInTransit,
  shipFulfillment,
} from '#/api/cloudmold/commerce/command';

import CopyIdCell from '../../shared/copy-id-cell.vue';
import EvidenceAlert from '../../shared/evidence-alert.vue';
import StatusTag from '../../shared/status-tag.vue';
import { commerceStatusColor } from '../status';
import {
  FulfillmentStatus,
  useFulfillmentColumns,
  useFulfillmentFormSchema,
} from './data';
import DetailDrawer from './detail-drawer.vue';

defineOptions({ name: 'CloudMoldCommerceFulfillment' });

const detailOpen = ref(false);
const detailFulfillmentId = ref<null | string>(null);

function openDetail(fulfillmentId: string) {
  detailFulfillmentId.value = fulfillmentId;
  detailOpen.value = true;
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: { schema: useFulfillmentFormSchema() },
  gridOptions: {
    columns: useFulfillmentColumns(),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) =>
          await getCloudMoldFulfillmentPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          }),
      },
    },
    rowConfig: { isHover: true, keyField: 'fulfillmentId' },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<CloudMoldCommerceApi.Fulfillment>,
});

function handleRefresh() {
  gridApi.query();
}

/** 执行履约状态转换的统一闭环：防双击 loading → 幂等调用 → 成功/失败提示 → 刷新 */
async function runFulfillmentTransition(
  action: (
    fulfillmentId: string,
    expectedVersion: number,
  ) => Promise<CloudMoldCommerceCommandApi.CommandResult>,
  row: CloudMoldCommerceApi.Fulfillment,
  actionName: string,
) {
  const hideLoading = message.loading({
    content: `正在${actionName}…`,
    duration: 0,
  });
  try {
    const result = await action(row.fulfillmentId, row.aggregateVersion);
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

function handleMarkInTransit(row: CloudMoldCommerceApi.Fulfillment) {
  return runFulfillmentTransition(markFulfillmentInTransit, row, '标记在途');
}

function handleDeliver(row: CloudMoldCommerceApi.Fulfillment) {
  return runFulfillmentTransition(deliverFulfillment, row, '投递完成');
}

function fulfillmentActionHint(status: string) {
  return (
    {
      [FulfillmentStatus.CANCELLATION_PENDING]: '取消处理中',
      [FulfillmentStatus.CANCELLED]: '已取消',
      [FulfillmentStatus.DELIVERED]: '流程已结束',
    }[status] ?? ''
  );
}

const shipOpen = ref(false);
const shipCarrierCode = ref('');
const shipWaybillNo = ref('');
const shipping = ref(false);
const shipRow = ref<CloudMoldCommerceApi.Fulfillment | null>(null);

function handleShip(row: CloudMoldCommerceApi.Fulfillment) {
  shipRow.value = row;
  shipCarrierCode.value = '';
  shipWaybillNo.value = '';
  shipOpen.value = true;
}

async function confirmShip() {
  if (
    !shipRow.value ||
    !shipCarrierCode.value.trim() ||
    !shipWaybillNo.value.trim()
  ) {
    message.warning('请输入承运商编码和运单号');
    return;
  }
  shipping.value = true;
  try {
    await shipFulfillment(
      shipRow.value.fulfillmentId,
      shipRow.value.aggregateVersion,
      shipCarrierCode.value.trim().toUpperCase(),
      shipWaybillNo.value.trim(),
    );
    message.success('发货成功');
    shipOpen.value = false;
    handleRefresh();
  } catch (error) {
    message.error(
      `发货失败：${error instanceof Error ? error.message : '请刷新后重试'}`,
    );
  } finally {
    shipping.value = false;
  }
}
</script>

<template>
  <Page auto-content-height>
    <EvidenceAlert page="fulfillment" />

    <Grid table-title="发货履约">
      <template #fulfillment-no="{ row }">
        <CopyIdCell :value="row.fulfillmentNo" label="履约单号" />
      </template>
      <template #status="{ row }">
        <StatusTag
          :color="commerceStatusColor(row.status)"
          :label="row.status"
        />
      </template>
      <template #shipment-status="{ row }">
        <StatusTag :label="row.firstSliceShipmentStatus" />
      </template>
      <template #action="{ row }">
        <TableAction
          :actions="[
            {
              label: '详情',
              onClick: () => openDetail(row.fulfillmentId),
              type: 'link',
            },
            {
              auth: ['cloudmold:fulfillment:command'],
              ifShow: () => row.status === FulfillmentStatus.CREATED,
              label: '发货',
              onClick: handleShip.bind(null, row),
              type: 'link',
            },
            {
              auth: ['cloudmold:fulfillment:command'],
              ifShow: () => row.status === FulfillmentStatus.SHIPPED,
              label: '标记在途',
              onClick: handleMarkInTransit.bind(null, row),
              type: 'link',
            },
            {
              auth: ['cloudmold:fulfillment:command'],
              ifShow: () => row.status === FulfillmentStatus.IN_TRANSIT,
              label: '投递完成',
              popConfirm: {
                confirm: handleDeliver.bind(null, row),
                title: '确认包裹已送达？该事实将参与订单完成门禁。',
              },
              type: 'link',
            },
            {
              disabled: true,
              ifShow: () => Boolean(fulfillmentActionHint(row.status)),
              label: fulfillmentActionHint(row.status),
              type: 'link',
            },
          ]"
        />
      </template>
    </Grid>

    <DetailDrawer
      v-model:open="detailOpen"
      :fulfillment-id="detailFulfillmentId"
    />
    <Modal
      v-model:open="shipOpen"
      :confirm-loading="shipping"
      title="确认发货"
      @ok="confirmShip"
    >
      <div class="mb-3 text-sm text-gray-500">
        承运商和运单号在发货后不可修改，请与实际面单核对。
      </div>
      <Input
        v-model:value="shipCarrierCode"
        class="mb-3"
        placeholder="承运商编码，例如 SF"
      />
      <Input v-model:value="shipWaybillNo" placeholder="运单号" />
    </Modal>
  </Page>
</template>
