<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloudMoldCommerceApi } from '#/api/cloudmold/commerce';
import type { CloudMoldCommerceCommandApi } from '#/api/cloudmold/commerce/command';

import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getCloudMoldOrderPage } from '#/api/cloudmold/commerce';
import {
  completeOrder,
  completeOrderAfterDelivery,
  confirmOrderInventory,
} from '#/api/cloudmold/commerce/command';

import CopyIdCell from '../../shared/copy-id-cell.vue';
import EvidenceAlert from '../../shared/evidence-alert.vue';
import StatusTag from '../../shared/status-tag.vue';
import { commerceStatusColor } from '../status';
import { OrderStatus, useOrderColumns, useOrderFormSchema } from './data';
import DetailDrawer from './detail-drawer.vue';

defineOptions({ name: 'CloudMoldCommerceOrder' });

const detailOpen = ref(false);
const detailOrderId = ref<null | string>(null);

function openDetail(orderId: string) {
  detailOrderId.value = orderId;
  detailOpen.value = true;
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: { schema: useOrderFormSchema() },
  gridOptions: {
    columns: useOrderColumns(),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) =>
          await getCloudMoldOrderPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          }),
      },
    },
    rowConfig: { isHover: true, keyField: 'orderId' },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<CloudMoldCommerceApi.Order>,
});

function handleRefresh() {
  gridApi.query();
}

/** 执行订单状态转换的统一闭环：防双击 loading → 幂等调用 → 成功/失败提示 → 刷新 */
async function runOrderTransition(
  action: (
    orderId: string,
    expectedVersion: number,
  ) => Promise<CloudMoldCommerceCommandApi.CommandResult>,
  row: CloudMoldCommerceApi.Order,
  actionName: string,
) {
  const hideLoading = message.loading({
    content: `正在${actionName}…`,
    duration: 0,
  });
  try {
    const result = await action(row.orderId, row.aggregateVersion);
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

function handleConfirmInventory(row: CloudMoldCommerceApi.Order) {
  return runOrderTransition(confirmOrderInventory, row, '库存确认');
}

function handleComplete(row: CloudMoldCommerceApi.Order) {
  return runOrderTransition(
    row.fulfillmentId ? completeOrderAfterDelivery : completeOrder,
    row,
    '完成订单',
  );
}

function orderActionHint(status: string) {
  return (
    {
      [OrderStatus.CANCELLATION_PENDING]: '取消处理中',
      [OrderStatus.CANCELLED]: '已取消',
      [OrderStatus.COMPLETED]: '已完成',
      [OrderStatus.INVENTORY_RESERVED]: '等待支付',
      [OrderStatus.PAYMENT_CONFIRMED]: '等待履约',
    }[status] ?? ''
  );
}
</script>

<template>
  <Page auto-content-height>
    <EvidenceAlert page="order" />

    <Grid table-title="订单">
      <template #order-no="{ row }">
        <CopyIdCell :value="row.orderNo" label="订单号" />
      </template>
      <template #status="{ row }">
        <StatusTag
          :color="commerceStatusColor(row.status)"
          :label="row.status"
        />
      </template>
      <template #payment-status="{ row }">
        <StatusTag :label="row.paymentStatus" />
      </template>
      <template #fulfillment-status="{ row }">
        <StatusTag :label="row.fulfillmentStatus" />
      </template>
      <template #action="{ row }">
        <TableAction
          :actions="[
            {
              label: '详情',
              onClick: () => openDetail(row.orderId),
              type: 'link',
            },
            {
              auth: ['cloudmold:order:command'],
              ifShow: () => row.status === OrderStatus.PLACED,
              label: '库存确认',
              onClick: handleConfirmInventory.bind(null, row),
              type: 'link',
            },
            {
              auth: ['cloudmold:order:command'],
              ifShow: () => row.status === OrderStatus.SHIPPED,
              label: '完成',
              popConfirm: {
                confirm: handleComplete.bind(null, row),
                title: row.fulfillmentId
                  ? '确认完成该渠道商品订单？系统会校验绑定履约单已经送达。'
                  : '确认该普通订单已经满足完成条件？系统会校验聚合状态和版本。',
              },
              type: 'link',
            },
            {
              disabled: true,
              ifShow: () => Boolean(orderActionHint(row.status)),
              label: orderActionHint(row.status),
              type: 'link',
            },
          ]"
        />
      </template>
    </Grid>

    <DetailDrawer v-model:open="detailOpen" :order-id="detailOrderId" />
  </Page>
</template>
