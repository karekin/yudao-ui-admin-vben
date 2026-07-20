<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloudMoldMerchantApi } from '#/api/cloudmold/merchant';
import type { CloudMoldMerchantCommandApi } from '#/api/cloudmold/merchant/command';

import { Page } from '@vben/common-ui';

import { message, Tabs } from 'ant-design-vue';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getCloudMoldMerchantPage,
  getCloudMoldMerchantShopPage,
} from '#/api/cloudmold/merchant';
import {
  activateMerchant,
  activateShop,
  resumeMerchant,
  resumeShop,
} from '#/api/cloudmold/merchant/command';

import CopyIdCell from '../shared/copy-id-cell.vue';
import EvidenceAlert from '../shared/evidence-alert.vue';
import StatusTag from '../shared/status-tag.vue';
import {
  MerchantStatus,
  merchantStatusMeta,
  ShopStatus,
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

const [MerchantGrid, merchantGridApi] = useVbenVxeGrid({
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

const [ShopGrid, shopGridApi] = useVbenVxeGrid({
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

function handleRefreshMerchant() {
  merchantGridApi.query();
}

function handleRefreshShop() {
  shopGridApi.query();
}

/** 执行商家状态转换的统一闭环：防双击 loading → 幂等调用 → 成功/失败提示 → 刷新 */
async function runMerchantTransition(
  action: (
    merchantId: string,
    expectedVersion: number,
  ) => Promise<CloudMoldMerchantCommandApi.CommandResult>,
  row: CloudMoldMerchantApi.Merchant,
  actionName: string,
) {
  const hideLoading = message.loading({
    content: `正在${actionName}…`,
    duration: 0,
  });
  try {
    const result = await action(row.merchantId, row.version);
    if (result.duplicate) {
      message.warning('该操作已处理（幂等重放）');
    } else {
      message.success(`${actionName}成功`);
    }
    handleRefreshMerchant();
  } catch (error) {
    message.error(
      `${actionName}失败：${error instanceof Error ? error.message : '请稍后重试'}`,
    );
    handleRefreshMerchant();
  } finally {
    hideLoading();
  }
}

async function runShopTransition(
  action: (
    shopId: string,
    expectedVersion: number,
  ) => Promise<CloudMoldMerchantCommandApi.CommandResult>,
  row: CloudMoldMerchantApi.Shop,
  actionName: string,
) {
  const hideLoading = message.loading({
    content: `正在${actionName}…`,
    duration: 0,
  });
  try {
    const result = await action(row.shopId, row.version);
    if (result.duplicate) {
      message.warning('该操作已处理（幂等重放）');
    } else {
      message.success(`${actionName}成功`);
    }
    handleRefreshShop();
  } catch (error) {
    message.error(
      `${actionName}失败：${error instanceof Error ? error.message : '请稍后重试'}`,
    );
    handleRefreshShop();
  } finally {
    hideLoading();
  }
}

function handleActivateMerchant(row: CloudMoldMerchantApi.Merchant) {
  return runMerchantTransition(activateMerchant, row, '激活商家');
}

function handleResumeMerchant(row: CloudMoldMerchantApi.Merchant) {
  return runMerchantTransition(resumeMerchant, row, '恢复商家');
}

function handleActivateShop(row: CloudMoldMerchantApi.Shop) {
  return runShopTransition(activateShop, row, '激活店铺');
}

function handleResumeShop(row: CloudMoldMerchantApi.Shop) {
  return runShopTransition(resumeShop, row, '恢复店铺');
}
</script>

<template>
  <Page auto-content-height>
    <EvidenceAlert
      message="CloudMold 规范商家与渠道权威"
      description="本页读取 CloudMold 商家账户与店铺规范表，并支持状态转换（激活/恢复，幂等命令 + 乐观版本）；不读取 yudao Member 账号或旧 member/merchant 业务表。System/Member 账号不等于 canonical Principal，商家(Merchant)不等于店铺(Shop)。"
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
          <template #merchant-action="{ row }">
            <TableAction
              :actions="[
                {
                  ifShow: () =>
                    row.status === MerchantStatus.PENDING_ACTIVATION,
                  label: '激活',
                  onClick: handleActivateMerchant.bind(null, row),
                  type: 'link',
                },
                {
                  ifShow: () => row.status === MerchantStatus.SUSPENDED,
                  label: '恢复',
                  onClick: handleResumeMerchant.bind(null, row),
                  type: 'link',
                },
              ]"
            />
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
          <template #shop-action="{ row }">
            <TableAction
              :actions="[
                {
                  ifShow: () => row.status === ShopStatus.DRAFT,
                  label: '激活',
                  onClick: handleActivateShop.bind(null, row),
                  type: 'link',
                },
                {
                  ifShow: () => row.status === ShopStatus.PAUSED,
                  label: '恢复',
                  onClick: handleResumeShop.bind(null, row),
                  type: 'link',
                },
              ]"
            />
          </template>
        </ShopGrid>
      </Tabs.TabPane>
    </Tabs>
  </Page>
</template>
