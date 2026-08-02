<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloudMoldMerchantApi } from '#/api/cloudmold/merchant';
import type { CloudMoldMerchantCommandApi } from '#/api/cloudmold/merchant/command';

import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Alert,
  Descriptions,
  DescriptionsItem,
  Drawer,
  Input,
  message,
  Modal,
  Spin,
  Tabs,
  Tag,
} from 'ant-design-vue';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getCloudMoldMerchantPage,
  getCloudMoldMerchantShopPage,
  getCloudMoldManagedAdmissionWorkflowByMerchant,
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
const managedGrowthOpen = ref(false);
const managedGrowthLoading = ref(false);
const managedGrowth = ref<CloudMoldMerchantApi.ManagedAdmissionWorkflow>();
const managedGrowthMerchant = ref<CloudMoldMerchantApi.Merchant>();

const workflowStatusMeta: StatusMeta = {
  FAILED: { color: 'error', label: '已终止' },
  PREPARE: { color: 'default', label: '待建档' },
  RUNNING: { color: 'processing', label: '进行中' },
  SUCCEEDED: { color: 'success', label: '已完成' },
  WAITING: { color: 'warning', label: '待处理' },
};

function workflowStatus(status?: string) {
  return getMeta(workflowStatusMeta, status);
}

async function viewManagedGrowth(row: CloudMoldMerchantApi.Merchant) {
  managedGrowthMerchant.value = row;
  managedGrowth.value = undefined;
  managedGrowthOpen.value = true;
  managedGrowthLoading.value = true;
  try {
    managedGrowth.value = await getCloudMoldManagedAdmissionWorkflowByMerchant(
      row.merchantId,
    );
  } catch (error) {
    message.error(
      `托管成长记录加载失败：${error instanceof Error ? error.message : '请稍后重试'}`,
    );
  } finally {
    managedGrowthLoading.value = false;
  }
}

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
                  auth: ['cloudmold:merchant:query'],
                  label: '托管成长',
                  onClick: viewManagedGrowth.bind(null, row),
                  type: 'link',
                },
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

    <Drawer
      v-model:open="managedGrowthOpen"
      :destroy-on-close="true"
      placement="right"
      title="托管商家成长运营"
      width="min(920px, calc(100vw - 24px))"
    >
      <Spin :spinning="managedGrowthLoading">
        <template v-if="managedGrowth && managedGrowthMerchant">
          <Alert
            class="mb-4"
            show-icon
            type="info"
            message="只读业务事实"
            description="本页读回托管准入、验厂、试用期和月度成材的已记录结论；不会自动变更商家等级、权益、买手、店铺或清退状态。"
          />
          <Descriptions :column="2" bordered size="small" title="当前托管成长状态">
            <DescriptionsItem label="商家">{{ managedGrowthMerchant.legalName || managedGrowthMerchant.merchantCode }}</DescriptionsItem>
            <DescriptionsItem label="规范商家 ID">{{ managedGrowthMerchant.merchantId }}</DescriptionsItem>
            <DescriptionsItem label="当前阶段">{{ managedGrowth.phase }}</DescriptionsItem>
            <DescriptionsItem label="流程状态"><Tag :color="workflowStatus(managedGrowth.status).color">{{ workflowStatus(managedGrowth.status).label }}</Tag></DescriptionsItem>
            <DescriptionsItem label="流程结论" :span="2">{{ managedGrowth.summary }}</DescriptionsItem>
          </Descriptions>

          <Descriptions class="mt-4" :column="2" bordered size="small" title="准入与成材结论">
            <DescriptionsItem label="邀请归因">{{ managedGrowth.invitationStatus || '未记录' }}</DescriptionsItem>
            <DescriptionsItem label="买手分配">{{ managedGrowth.buyerAssignmentStatus || '未记录' }}</DescriptionsItem>
            <DescriptionsItem label="商家等级">{{ managedGrowth.gradeCode || '未评定' }}{{ managedGrowth.gradeDecisionStatus ? `（${managedGrowth.gradeDecisionStatus}）` : '' }}</DescriptionsItem>
            <DescriptionsItem label="试用期三关">{{ managedGrowth.probationAssessmentStatus || '未评估' }}</DescriptionsItem>
            <DescriptionsItem label="月度九项义务">{{ managedGrowth.scorecardStatus || '未评分' }}{{ managedGrowth.scorecardMonth ? `（${managedGrowth.scorecardMonth}）` : '' }}</DescriptionsItem>
            <DescriptionsItem label="清退判断">{{ managedGrowth.exitDecisionStatus || '未触发' }}{{ managedGrowth.exitReasonType ? `（${managedGrowth.exitReasonType}）` : '' }}</DescriptionsItem>
          </Descriptions>

          <div class="mt-5 font-medium">可追溯业务产物</div>
          <div class="mt-2 flex flex-wrap gap-2">
            <Tag v-for="artifact in managedGrowth.artifacts" :key="artifact.id" :color="artifact.status === 'APPROVED' || artifact.status === 'COMPLETED' ? 'success' : 'blue'">
              {{ artifact.label }} · {{ artifact.status }}
            </Tag>
            <span v-if="!managedGrowth.artifacts.length" class="text-sm text-gray-500">暂无已记录产物</span>
          </div>

          <template v-if="managedGrowth.blockers.length || managedGrowth.nextActions.length">
            <div class="mt-5 font-medium">人工门禁与下一步</div>
            <Alert
              v-if="managedGrowth.blockers.length"
              class="mt-2"
              show-icon
              type="warning"
              :message="managedGrowth.blockers.join('；')"
            />
            <Alert
              v-if="managedGrowth.nextActions.length"
              class="mt-2"
              show-icon
              type="info"
              :message="managedGrowth.nextActions.join('；')"
            />
          </template>
        </template>
        <Alert
          v-else-if="!managedGrowthLoading"
          show-icon
          type="warning"
          message="未能读取托管成长记录"
          description="请确认后端已升级，且当前账号具有 cloudmold:merchant:query 权限。"
        />
      </Spin>
    </Drawer>
  </Page>
</template>
