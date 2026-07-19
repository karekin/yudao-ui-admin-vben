<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloudMoldIdentityApi } from '#/api/cloudmold/identity';

import { Page } from '@vben/common-ui';

import { Tabs } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getCloudMoldIdentityOperationPage,
  getCloudMoldIdentityPrincipalPage,
  getCloudMoldIdentitySourcePage,
} from '#/api/cloudmold/identity';

import CopyIdCell from '../shared/copy-id-cell.vue';
import EvidenceAlert from '../shared/evidence-alert.vue';
import StatusTag from '../shared/status-tag.vue';
import {
  operationStatusMeta,
  principalStatusMeta,
  principalTypeMeta,
  sourceStatusMeta,
  useOperationColumns,
  useOperationFormSchema,
  usePrincipalColumns,
  usePrincipalFormSchema,
  useSourceColumns,
  useSourceFormSchema,
} from './data';

defineOptions({ name: 'CloudMoldIdentity' });

type StatusMeta = Record<string, { color: string; label: string }>;

function getMeta(metadata: StatusMeta, status?: string) {
  if (status === undefined || status === null || status === '') {
    return { color: 'default', label: 'UNKNOWN' };
  }
  return metadata[status] ?? { color: 'default', label: String(status) };
}

function getOperationMeta(status?: number) {
  if (status === undefined || status === null) {
    return { color: 'default', label: 'UNKNOWN' };
  }
  return (
    operationStatusMeta[status] ?? { color: 'default', label: String(status) }
  );
}

const [PrincipalGrid] = useVbenVxeGrid({
  formOptions: { schema: usePrincipalFormSchema() },
  gridOptions: {
    columns: usePrincipalColumns(),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) =>
          await getCloudMoldIdentityPrincipalPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          }),
      },
    },
    rowConfig: { isHover: true, keyField: 'principalId' },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<CloudMoldIdentityApi.Principal>,
});

const [SourceGrid] = useVbenVxeGrid({
  formOptions: { schema: useSourceFormSchema() },
  gridOptions: {
    columns: useSourceColumns(),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) =>
          await getCloudMoldIdentitySourcePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          }),
      },
    },
    rowConfig: { isHover: true, keyField: 'sourceIdentityId' },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<CloudMoldIdentityApi.Source>,
});

const [OperationGrid] = useVbenVxeGrid({
  formOptions: { schema: useOperationFormSchema() },
  gridOptions: {
    columns: useOperationColumns(),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) =>
          await getCloudMoldIdentityOperationPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          }),
      },
    },
    rowConfig: { isHover: true, keyField: 'operationId' },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<CloudMoldIdentityApi.Operation>,
});
</script>

<template>
  <Page auto-content-height>
    <EvidenceAlert
      message="CloudMold 规范身份权威"
      description="本页只读取 CloudMold 身份主体 / 来源身份 / 操作记录规范表；System/Member 账号不等于 canonical Principal。按当前租户隔离，不读取 yudao 旧 member/system 业务表。"
    />

    <Tabs class="w-full">
      <Tabs.TabPane key="principals" tab="身份主体">
        <PrincipalGrid table-title="规范身份主体">
          <template #principal-id="{ row }">
            <CopyIdCell :value="row.principalId" label="身份主体 ID" />
          </template>
          <template #principal-type="{ row }">
            <StatusTag v-bind="getMeta(principalTypeMeta, row.principalType)" />
          </template>
          <template #principal-status="{ row }">
            <StatusTag v-bind="getMeta(principalStatusMeta, row.status)" />
          </template>
        </PrincipalGrid>
      </Tabs.TabPane>

      <Tabs.TabPane key="sources" tab="来源身份">
        <SourceGrid table-title="规范来源身份">
          <template #source-id="{ row }">
            <CopyIdCell :value="row.sourceIdentityId" label="来源身份 ID" />
          </template>
          <template #source-status="{ row }">
            <StatusTag v-bind="getMeta(sourceStatusMeta, row.status)" />
          </template>
        </SourceGrid>
      </Tabs.TabPane>

      <Tabs.TabPane key="operations" tab="操作记录">
        <OperationGrid table-title="身份操作记录">
          <template #idempotency-key="{ row }">
            <CopyIdCell :value="row.idempotencyKey" label="幂等键" />
          </template>
          <template #operation-status="{ row }">
            <StatusTag v-bind="getOperationMeta(row.status)" />
          </template>
        </OperationGrid>
      </Tabs.TabPane>
    </Tabs>
  </Page>
</template>
