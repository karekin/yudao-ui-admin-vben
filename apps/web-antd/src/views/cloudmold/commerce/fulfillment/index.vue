<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloudMoldCommerceApi } from '#/api/cloudmold/commerce';
import type { CloudMoldCommerceCommandApi } from '#/api/cloudmold/commerce/command';

import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getCloudMoldFulfillmentPage } from '#/api/cloudmold/commerce';
import {
  deliverFulfillment,
  markFulfillmentInTransit,
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
</script>

<template>
  <Page auto-content-height>
    <EvidenceAlert
      message="CloudMold 规范 Fulfillment 权威"
      description="本页读取 CloudMold Fulfillment 规范表，并支持履约状态转换（标记在途/投递完成，幂等命令 + 乐观版本）；履约意图与发运事实分离，不读取 yudao Mall Trade 或 ERP / WMS 业务表。"
    />

    <EvidenceAlert
      type="warning"
      message="当前为单发运首切片"
      description="页面展示正向履约和首个发运事实；多包裹与异常物流仍是后续验收门禁。"
    />

    <Grid table-title="规范 Fulfillment">
      <template #fulfillment-no="{ row }">
        <CopyIdCell :value="row.fulfillmentNo" label="履约单号" />
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
              label: '详情',
              onClick: () => openDetail(row.fulfillmentId),
              type: 'link',
            },
            {
              ifShow: () => row.status === FulfillmentStatus.SHIPPED,
              label: '标记在途',
              onClick: handleMarkInTransit.bind(null, row),
              type: 'link',
            },
            {
              ifShow: () => row.status === FulfillmentStatus.IN_TRANSIT,
              label: '投递完成',
              onClick: handleDeliver.bind(null, row),
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
  </Page>
</template>
