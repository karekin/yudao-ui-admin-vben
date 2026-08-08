<script lang="ts" setup>
import type { CloudMoldCrmFollowUpView } from '#/api/cloudmold/crm';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Alert, Card, Col, Empty, Row, Statistic, Table } from 'ant-design-vue';

import { getCloudMoldCrmWorkbench } from '#/api/cloudmold/crm';
import CopyIdCell from '#/views/cloudmold/shared/copy-id-cell.vue';
import EvidenceAlert from '#/views/cloudmold/shared/evidence-alert.vue';
import { cloudMoldStatusMeta } from '#/views/cloudmold/shared/status-meta';
import StatusTag from '#/views/cloudmold/shared/status-tag.vue';

defineOptions({ name: 'CloudMoldCrmWorkbench' });

const loading = ref(false);
const loadError = ref('');
const ownerPrincipalId = ref('');
const summary = ref({
  dueFollowUpCount: 0,
  openOpportunityCount: 0,
  overdueFollowUpCount: 0,
  ownedCustomerCount: 0,
  ownedLeadCount: 0,
  poolCustomerCount: 0,
});
const upcomingFollowUps = ref<CloudMoldCrmFollowUpView[]>([]);

function formatTime(value?: string) {
  if (!value) return '—';
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return value;
  return new Date(timestamp).toLocaleString('zh-CN', { hour12: false });
}

const cards = computed(() => [
  { label: '我的客户', value: summary.value.ownedCustomerCount },
  { label: '公海客户', value: summary.value.poolCustomerCount },
  { label: '我的线索', value: summary.value.ownedLeadCount },
  { label: '开放商机', value: summary.value.openOpportunityCount },
  { label: '今日待跟进', value: summary.value.dueFollowUpCount },
  { label: '已逾期跟进', value: summary.value.overdueFollowUpCount },
]);

async function loadWorkbench() {
  loading.value = true;
  loadError.value = '';
  try {
    const result = await getCloudMoldCrmWorkbench();
    ownerPrincipalId.value = result.ownerPrincipalId || '';
    summary.value = {
      dueFollowUpCount: result.dueFollowUpCount,
      openOpportunityCount: result.openOpportunityCount,
      overdueFollowUpCount: result.overdueFollowUpCount,
      ownedCustomerCount: result.ownedCustomerCount,
      ownedLeadCount: result.ownedLeadCount,
      poolCustomerCount: result.poolCustomerCount,
    };
    upcomingFollowUps.value = result.upcomingFollowUps;
  } catch (error) {
    upcomingFollowUps.value = [];
    loadError.value =
      error instanceof Error ? error.message : '销售工作台加载失败';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void loadWorkbench();
});
</script>

<template>
  <Page auto-content-height>
    <EvidenceAlert
      message="CloudMold CRM 销售工作台"
      description="工作台聚合 owner 视角的客户、线索、商机与跟进统计；即使没有后端菜单，也能直接通过真实 component 页面读取 /cloudmold/crm/workbench。"
    />

    <Alert
      v-if="loadError"
      class="mb-3"
      type="error"
      show-icon
      message="销售工作台加载失败"
      :description="loadError"
    />

    <Card class="mb-3" size="small">
      <div class="text-sm text-[var(--ant-color-text-description)]">
        当前 ownerPrincipalId：{{ ownerPrincipalId || '未返回 owner' }}
      </div>
    </Card>

    <Row :gutter="12" class="mb-3">
      <Col v-for="card in cards" :key="card.label" :span="8">
        <Card size="small">
          <Statistic :title="card.label" :value="card.value" />
        </Card>
      </Col>
    </Row>

    <Card :loading="loading" size="small" title="即将到来的跟进">
      <Table
        :columns="[
          { key: 'subjectName', title: '主体', width: 240 },
          { key: 'methodCode', title: '跟进方式', width: 130 },
          { key: 'nextFollowUpAt', title: '下次跟进时间', width: 180 },
          { key: 'summary', title: '摘要', width: 260 },
          { key: 'actorPrincipalId', title: '执行主体', width: 160 },
        ]"
        :data-source="upcomingFollowUps"
        :loading="loading"
        :pagination="false"
        row-key="followUpId"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'subjectName'">
            <div class="flex flex-col gap-1">
              <span class="font-medium">{{
                record.subjectName || record.subjectId
              }}</span>
              <CopyIdCell
                :value="
                  record.subjectCode || record.subjectId || record.followUpId
                "
                label="主体编号"
              />
            </div>
          </template>
          <template v-else-if="column.key === 'methodCode'">
            <StatusTag v-bind="cloudMoldStatusMeta(record.methodCode)" />
          </template>
          <template v-else-if="column.key === 'nextFollowUpAt'">
            <span>{{ formatTime(record.nextFollowUpAt) }}</span>
          </template>
          <template v-else-if="column.key === 'summary'">
            <span>{{ record.summary || '—' }}</span>
          </template>
          <template v-else-if="column.key === 'actorPrincipalId'">
            <span>{{ record.actorPrincipalId || '—' }}</span>
          </template>
        </template>

        <template #emptyText>
          <Empty description="当前没有待处理跟进" />
        </template>
      </Table>
    </Card>
  </Page>
</template>
