<script lang="ts" setup>
import type { CloudMoldDataReadinessApi } from '#/api/cloudmold/data-readiness';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import {
  Button,
  Card,
  Col,
  Descriptions,
  Row,
  Space,
  Statistic,
} from 'ant-design-vue';

import { getCloudMoldDataReadinessOverview } from '#/api/cloudmold/data-readiness';

import CopyIdCell from '../shared/copy-id-cell.vue';
import EvidenceAlert from '../shared/evidence-alert.vue';
import StatusTag from '../shared/status-tag.vue';

defineOptions({ name: 'CloudMoldDataReadiness' });

const loading = ref(false);
const overview = ref<CloudMoldDataReadinessApi.Overview>();
const outboxSummary =
  '当前仅统计本租户的事件投递数量，不展示事件内容和错误详情，也不代表同步、质量或报表数据已经就绪。';

const evidenceSections = [
  {
    key: 'cdc',
    title: '数据同步（CDC）',
    boundary: '显示业务数据是否已接入持续同步；未接入时不会推测运行状态。',
  },
  {
    key: 'dqc',
    title: '数据质量（DQC）',
    boundary: '显示数据质量检查是否已接入，以及当前是否存在质量风险。',
  },
  {
    key: 'ads',
    title: '报表数据（ADS）',
    boundary: '显示面向报表的数据是否已生成并达到可用条件。',
  },
  {
    key: 'sourceGraduation',
    title: '来源准入',
    boundary: '显示外部数据来源是否通过完整性和一致性验收。',
  },
] as const;

async function loadOverview() {
  loading.value = true;
  try {
    overview.value = await getCloudMoldDataReadinessOverview();
  } finally {
    loading.value = false;
  }
}

function statusColor(status?: string) {
  if (status === 'HEALTHY' || status === 'READY') return 'success';
  if (status === 'STALE' || status === 'WARNING') return 'warning';
  if (status === 'FAILED' || status === 'UNHEALTHY') return 'error';
  return 'default';
}

function formatEvidenceTime(value?: string) {
  if (!value) return '-';
  const source = /^\d{13}$/.test(value) ? Number(value) : value;
  return formatDateTime(source);
}

onMounted(loadOverview);
</script>

<template>
  <Page auto-content-height>
    <EvidenceAlert page="dataReadiness" type="warning" />

    <div class="mb-4 flex items-center justify-between">
      <span class="text-muted-foreground">
        更新时间：{{ formatEvidenceTime(overview?.generatedAt) }}
      </span>
      <Button size="small" :loading="loading" @click="loadOverview">
        刷新状态
      </Button>
    </div>

    <Card class="mb-4" title="事件投递" size="small">
      <Row :gutter="16">
        <Col :span="6">
          <Statistic title="待投递" :value="overview?.outbox.pendingCount" />
        </Col>
        <Col :span="6">
          <Statistic title="处理中" :value="overview?.outbox.claimedCount" />
        </Col>
        <Col :span="6">
          <Statistic title="已发布" :value="overview?.outbox.publishedCount" />
        </Col>
        <Col :span="6">
          <Statistic title="投递失败" :value="overview?.outbox.deadCount" />
        </Col>
      </Row>
      <Descriptions
        class="mt-3"
        bordered
        size="small"
        :column="2"
        :label-style="{ whiteSpace: 'nowrap', width: '104px' }"
        :content-style="{ minWidth: 0, whiteSpace: 'nowrap' }"
      >
        <Descriptions.Item label="最早待投递">
          {{ formatEvidenceTime(overview?.outbox.oldestPendingRecordedAt) }}
        </Descriptions.Item>
        <Descriptions.Item label="最新记录">
          {{ formatEvidenceTime(overview?.outbox.latestRecordedAt) }}
        </Descriptions.Item>
        <Descriptions.Item label="最新发布">
          {{ formatEvidenceTime(overview?.outbox.latestPublishedAt) }}
        </Descriptions.Item>
        <Descriptions.Item label="说明">
          <CopyIdCell
            :value="overview?.outbox.boundary ?? outboxSummary"
            label="说明"
          />
        </Descriptions.Item>
      </Descriptions>
    </Card>

    <Row :gutter="16">
      <Col
        v-for="section in evidenceSections"
        :key="section.key"
        :span="12"
        class="mb-4"
      >
        <Card :title="section.title" size="small">
          <Space class="mb-3">
            <StatusTag
              :color="statusColor(overview?.[section.key].status)"
              :label="overview?.[section.key].status"
            />
            <StatusTag :label="overview?.[section.key].connectionStatus" />
          </Space>
          <div class="text-muted-foreground">
            {{ section.boundary }}
          </div>
          <div class="mt-2">
            当前证据：{{ overview?.[section.key].boundary ?? '尚无可验证证据' }}
          </div>
        </Card>
      </Col>
    </Row>
  </Page>
</template>
