<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloudMoldMerchantApi } from '#/api/cloudmold/merchant';

import { Page } from '@vben/common-ui';

import { Tabs } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getCloudMoldMerchantPage,
  getCloudMoldMerchantShopPage,
} from '#/api/cloudmold/merchant';

import CopyIdCell from '../shared/copy-id-cell.vue';
import EvidenceAlert from '../shared/evidence-alert.vue';
import StatusTag from '../shared/status-tag.vue';
import {
  merchantStatusMeta,
  shopStatusMeta,
  useMerchantColumns,
  useMerchantFormSchema,
  useShopColumns,
  useShopFormSchema,
} from './data';

defineOptions({ name: 'CloudMoldMerchant' });

type StatusMeta = Record<string, { color: string; label: string }>;

function getMeta(metadata: StatusMeta, status?: string) {
  if (status === undefined || status === null || status === '') {
    return { color: 'default', label: 'UNKNOWN' };
  }
  return metadata[status] ?? { color: 'default', label: String(status) };
}

const [MerchantGrid] = useVbenVxeGrid({
  formOptions: { schema: useMerchantFormSchema() },
  gridOptions: {
    columns: useMerchantColumns(),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) =>
          await getCloudMoldMerchantPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          }),
      },
    },
    rowConfig: { isHover: true, keyField: 'merchantId' },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<CloudMoldMerchantApi.Merchant>,
});

const [ShopGrid] = useVbenVxeGrid({
  formOptions: { schema: useShopFormSchema() },
  gridOptions: {
    columns: useShopColumns(),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) =>
          await getCloudMoldMerchantShopPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          }),
      },
    },
    rowConfig: { isHover: true, keyField: 'shopId' },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<CloudMoldMerchantApi.Shop>,
});
</script>

<template>
  <Page auto-content-height>
    <EvidenceAlert
      message="CloudMold 规范商家与渠道权威"
      description="本页只读取 CloudMold 商家账户与店铺规范表；不读取 yudao Member 账号或旧 member/merchant 业务表。System/Member 账号不等于 canonical Principal，商家(Merchant)不等于店铺(Shop)。"
    />

    <Tabs class="w-full">
      <Tabs.TabPane key="merchants" tab="商家">
        <MerchantGrid table-title="规范商家">
          <template #merchant-code="{ row }">
            <CopyIdCell :value="row.merchantCode" label="商家编码" />
          </template>
          <template #merchant-status="{ row }">
            <StatusTag v-bind="getMeta(merchantStatusMeta, row.status)" />
          </template>
        </MerchantGrid>
      </Tabs.TabPane>

      <Tabs.TabPane key="shops" tab="店铺">
        <ShopGrid table-title="规范店铺">
          <template #shop-id="{ row }">
            <CopyIdCell :value="row.shopId" label="规范店铺 ID" />
          </template>
          <template #shop-status="{ row }">
            <StatusTag v-bind="getMeta(shopStatusMeta, row.status)" />
          </template>
        </ShopGrid>
      </Tabs.TabPane>
    </Tabs>
  </Page>
</template>
