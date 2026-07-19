<script lang="ts" setup>
import type { CloudMoldDataReadinessApi } from '#/api/cloudmold/data-readiness';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Button, Card, Col, Descriptions, Row, Space } from 'ant-design-vue';

import { getCloudMoldDataReadinessOverview } from '#/api/cloudmold/data-readiness';

import EvidenceAlert from '../shared/evidence-alert.vue';
import StatusTag from '../shared/status-tag.vue';

defineOptions({ name: 'CloudMoldDataReadiness' });

const loading = ref(false);
const overview = ref<CloudMoldDataReadinessApi.Overview>();

const evidenceSections = [
  { key: 'cdc', title: 'CDC' },
  { key: 'dqc', title: 'DQC' },
  { key: 'ads', title: 'ADS' },
  { key: 'sourceGraduation', title: '来源准入' },
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

onMounted(loadOverview);
</script>

<template>
  <Page auto-content-height>
    <EvidenceAlert
      type="warning"
      message="证据状态按来源独立判定"
      description="Outbox 为当前租户实时聚合；CDC、DQC、ADS 和来源准入在外部观察器接入前明确显示 UNKNOWN / NOT_CONNECTED。零失败或零积压本身不代表链路健康。"
    />

    <div class="mb-4 flex items-center justify-between">
      <span class="text-muted-foreground">
        生成时间：{{ overview?.generatedAt ?? '-' }}
      </span>
      <Button :loading="loading" @click="loadOverview">刷新证据</Button>
    </div>

    <Card class="mb-4" title="事务 Outbox（实时、当前租户）">
      <Row :gutter="16">
        <Col :span="6">
          <Card size="small" title="待投递">
            {{ overview?.outbox.pendingCount ?? '-' }}
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small" title="已认领">
            {{ overview?.outbox.claimedCount ?? '-' }}
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small" title="已发布">
            {{ overview?.outbox.publishedCount ?? '-' }}
          </Card>
        </Col>
        <Col :span="6">
          <Card size="small" title="死信">
            {{ overview?.outbox.deadCount ?? '-' }}
          </Card>
        </Col>
      </Row>
      <Descriptions class="mt-4" bordered size="small" :column="2">
        <Descriptions.Item label="最早待投递">
          {{ overview?.outbox.oldestPendingRecordedAt ?? '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="最新记录">
          {{ overview?.outbox.latestRecordedAt ?? '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="最新发布">
          {{ overview?.outbox.latestPublishedAt ?? '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="证据边界">
          {{ overview?.outbox.boundary ?? '-' }}
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
        <Card :title="section.title">
          <Space class="mb-3">
            <StatusTag
              :color="statusColor(overview?.[section.key].status)"
              :label="overview?.[section.key].status"
            />
            <StatusTag :label="overview?.[section.key].connectionStatus" />
          </Space>
          <div>{{ overview?.[section.key].boundary ?? '尚无可验证证据' }}</div>
        </Card>
      </Col>
    </Row>
  </Page>
</template>
