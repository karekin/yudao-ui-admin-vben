<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloudMoldMerchantApi } from '#/api/cloudmold/merchant';
import type { CloudMoldMerchantCommandApi } from '#/api/cloudmold/merchant/command';

import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Input, message, Modal, Tabs } from 'ant-design-vue';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getCloudMoldMerchantPage,
  getCloudMoldMerchantShopPage,
} from '#/api/cloudmold/merchant';
import {
  activateMerchant,
  activateShop,
  pauseShop,
  resumeMerchant,
  resumeShop,
  suspendMerchant,
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

import '../shared/tabbed-grid.css';

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

const reasonOpen = ref(false);
const reasonText = ref('');
const reasonTitle = ref('');
const reasonSubmitting = ref(false);
const reasonCommand = ref<(() => Promise<unknown>) | null>(null);

function askReason(
  title: string,
  command: (reason: string) => Promise<unknown>,
) {
  reasonTitle.value = title;
  reasonText.value = '';
  reasonCommand.value = () => command(reasonText.value.trim());
  reasonOpen.value = true;
}

async function confirmReasonCommand() {
  if (!reasonText.value.trim() || !reasonCommand.value) {
    message.warning('请输入操作原因');
    return;
  }
  reasonSubmitting.value = true;
  try {
    await reasonCommand.value();
    message.success(`${reasonTitle.value}成功`);
    reasonOpen.value = false;
    handleRefreshMerchant();
    handleRefreshShop();
  } catch (error) {
    message.error(
      `${reasonTitle.value}失败：${error instanceof Error ? error.message : '请刷新后重试'}`,
    );
  } finally {
    reasonSubmitting.value = false;
  }
}
</script>

<template>
  <Page auto-content-height content-class="flex min-h-0 flex-col">
    <EvidenceAlert page="merchant" />

    <Tabs class="cloudmold-grid-tabs min-h-0 w-full flex-1">
      <Tabs.TabPane key="merchants" tab="商家">
        <MerchantGrid table-title="商家">
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
                  auth: ['cloudmold:merchant:command'],
                  ifShow: () =>
                    row.status === MerchantStatus.PENDING_ACTIVATION,
                  label: '激活',
                  onClick: handleActivateMerchant.bind(null, row),
                  type: 'link',
                },
                {
                  auth: ['cloudmold:merchant:command'],
                  ifShow: () => row.status === MerchantStatus.SUSPENDED,
                  label: '恢复',
                  onClick: handleResumeMerchant.bind(null, row),
                  type: 'link',
                },
                {
                  auth: ['cloudmold:merchant:command'],
                  danger: true,
                  ifShow: () =>
                    [MerchantStatus.ACTIVE, MerchantStatus.RESTRICTED].includes(
                      row.status,
                    ),
                  label: '停用',
                  onClick: () =>
                    askReason('停用商家', (reason) =>
                      suspendMerchant(row.merchantId, row.version, reason),
                    ),
                  type: 'link',
                },
              ]"
            />
          </template>
        </MerchantGrid>
      </Tabs.TabPane>

      <Tabs.TabPane key="shops" tab="店铺">
        <ShopGrid table-title="店铺">
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
                  auth: ['cloudmold:merchant:command'],
                  ifShow: () => row.status === ShopStatus.DRAFT,
                  label: '激活',
                  onClick: handleActivateShop.bind(null, row),
                  type: 'link',
                },
                {
                  auth: ['cloudmold:merchant:command'],
                  ifShow: () => row.status === ShopStatus.PAUSED,
                  label: '恢复',
                  onClick: handleResumeShop.bind(null, row),
                  type: 'link',
                },
                {
                  auth: ['cloudmold:merchant:command'],
                  danger: true,
                  ifShow: () => row.status === ShopStatus.ACTIVE,
                  label: '暂停',
                  onClick: () =>
                    askReason('暂停店铺', (reason) =>
                      pauseShop(row.shopId, row.version, reason),
                    ),
                  type: 'link',
                },
              ]"
            />
          </template>
        </ShopGrid>
      </Tabs.TabPane>
    </Tabs>

    <Modal
      v-model:open="reasonOpen"
      :confirm-loading="reasonSubmitting"
      :title="reasonTitle"
      @ok="confirmReasonCommand"
    >
      <div class="mb-2 text-sm text-gray-500">
        该操作可能触发渠道商品物理下架；恢复营业后不会自动重新上架。
      </div>
      <Input.TextArea
        v-model:value="reasonText"
        :maxlength="256"
        :rows="4"
        show-count
        placeholder="请输入明确、可审计的操作原因"
      />
    </Modal>
  </Page>
</template>
