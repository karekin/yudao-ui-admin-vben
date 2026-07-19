<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloudMoldCommerceApi } from '#/api/cloudmold/commerce';

import { Page } from '@vben/common-ui';

import { Alert, Tabs, Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getCloudMoldAfterSalePage,
  getCloudMoldFulfillmentPage,
  getCloudMoldListingPage,
  getCloudMoldOrderPage,
  getCloudMoldPaymentPage,
} from '#/api/cloudmold/commerce';

import {
  useAfterSaleColumns,
  useAfterSaleFormSchema,
  useFulfillmentColumns,
  useFulfillmentFormSchema,
  useListingColumns,
  useListingFormSchema,
  useOrderColumns,
  useOrderFormSchema,
  usePaymentColumns,
  usePaymentFormSchema,
} from './data';

defineOptions({ name: 'CloudMoldCommerce' });

const successStates = new Set([
  'CAPTURED',
  'COMPLETED',
  'DELIVERED',
  'PUBLISHED',
  'REFUNDED',
  'RESOLVED',
]);
const warningStates = new Set([
  'CANCELLED',
  'REJECTED',
  'RETURNED',
  'SUSPENDED',
  'UNPUBLISHED',
]);

function statusColor(status: unknown) {
  const value = String(status ?? 'UNKNOWN');
  if (successStates.has(value)) return 'success';
  if (warningStates.has(value)) return 'warning';
  if (value.includes('FAIL') || value.includes('ERROR')) return 'error';
  return 'processing';
}

function fieldValue(row: object, field: string) {
  return (row as Record<string, unknown>)[field];
}

const [ListingGrid] = useVbenVxeGrid({
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
  } as VxeTableGridOptions<CloudMoldCommerceApi.Listing>,
});

const [OrderGrid] = useVbenVxeGrid({
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

const [PaymentGrid] = useVbenVxeGrid({
  formOptions: { schema: usePaymentFormSchema() },
  gridOptions: {
    columns: usePaymentColumns(),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) =>
          await getCloudMoldPaymentPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          }),
      },
    },
    rowConfig: { isHover: true, keyField: 'paymentId' },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<CloudMoldCommerceApi.Payment>,
});

const [FulfillmentGrid] = useVbenVxeGrid({
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

const [AfterSaleGrid] = useVbenVxeGrid({
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
</script>

<template>
  <Page auto-content-height>
    <Alert
      class="mb-4"
      show-icon
      type="info"
      message="CloudMold 规范交易与履约权威"
      description="本页只读取 CloudMold Listing / Order / Payment / Fulfillment / AfterSale 规范表；不读取 yudao Mall Trade、Pay、ERP 或 WMS 业务表。"
    />

    <Tabs class="w-full">
      <Tabs.TabPane key="listing" tab="渠道刊登">
        <ListingGrid table-title="规范 Listing">
          <template #status="{ row, column }">
            <Tag :color="statusColor(fieldValue(row, column.field))">
              {{ fieldValue(row, column.field) }}
            </Tag>
          </template>
        </ListingGrid>
      </Tabs.TabPane>

      <Tabs.TabPane key="order" tab="订单">
        <OrderGrid table-title="规范 Order">
          <template #status="{ row, column }">
            <Tag :color="statusColor(fieldValue(row, column.field))">
              {{ fieldValue(row, column.field) }}
            </Tag>
          </template>
        </OrderGrid>
      </Tabs.TabPane>

      <Tabs.TabPane key="payment" tab="支付">
        <Alert
          class="mb-3"
          show-icon
          type="warning"
          message="当前支付首切片为 INTERNAL_TEST"
          description="测试通道事实不能视为真实支付渠道已投产；接入真实 Provider 后仍需独立验收。"
        />
        <PaymentGrid table-title="规范 Payment">
          <template #status="{ row, column }">
            <Tag :color="statusColor(fieldValue(row, column.field))">
              {{ fieldValue(row, column.field) }}
            </Tag>
          </template>
          <template #test-mode="{ row }">
            <Tag :color="row.testMode ? 'warning' : 'success'">
              {{ row.testMode ? 'INTERNAL_TEST' : '真实通道' }}
            </Tag>
          </template>
        </PaymentGrid>
      </Tabs.TabPane>

      <Tabs.TabPane key="fulfillment" tab="履约">
        <Alert
          class="mb-3"
          show-icon
          type="info"
          message="当前为单发运首切片"
          description="页面展示正向履约和首个发运事实；多包裹与异常物流仍是后续验收门禁。"
        />
        <FulfillmentGrid table-title="规范 Fulfillment">
          <template #status="{ row, column }">
            <Tag :color="statusColor(fieldValue(row, column.field))">
              {{ fieldValue(row, column.field) }}
            </Tag>
          </template>
        </FulfillmentGrid>
      </Tabs.TabPane>

      <Tabs.TabPane key="aftersale" tab="售后">
        <AfterSaleGrid table-title="规范 AfterSale">
          <template #status="{ row, column }">
            <Tag :color="statusColor(fieldValue(row, column.field))">
              {{ fieldValue(row, column.field) }}
            </Tag>
          </template>
        </AfterSaleGrid>
      </Tabs.TabPane>
    </Tabs>
  </Page>
</template>
