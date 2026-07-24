<script lang="ts" setup>
import type { CloudMoldAgentControlApi } from '#/api/cloudmold/agent-control';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
} from 'ant-design-vue';

import {
  getCloudMoldAgentBusinessCards,
  isAgentControlUnavailable,
} from '#/api/cloudmold/agent-control';

defineOptions({ name: 'CloudMoldAgentControl' });

const cards = ref<CloudMoldAgentControlApi.BusinessCard[]>([]);
const loading = ref(false);
const loadFailed = ref(false);
const serviceUnavailable = ref(false);
const roleCode = ref<string>();
const cardType = ref<CloudMoldAgentControlApi.CardType>();

const roleOptions = [
  { label: '全部岗位', value: undefined },
  { label: '库控', value: 'inventory-control' },
  { label: '买手', value: 'buyer' },
  { label: '客服', value: 'customer-service' },
  { label: '企划', value: 'planning' },
  { label: '招商', value: 'merchant-acquisition' },
  { label: '体验', value: 'customer-experience' },
];

const typeOptions = [
  { label: '全部事项', value: undefined },
  { label: '待审批', value: 'APPROVAL' },
  { label: '岗位交接', value: 'HANDOFF' },
  { label: '业务结果', value: 'RESULT' },
];

const roleNames: Record<string, string> = {
  buyer: '买手',
  'customer-experience': '体验',
  'customer-service': '客服',
  'inventory-control': '库控',
  'merchant-acquisition': '招商',
  planning: '企划',
};

const typeNames: Record<string, string> = {
  APPROVAL: '审批',
  HANDOFF: '交接',
  RESULT: '结果',
};

const statusNames: Record<string, string> = {
  ACCEPTED: '已接单',
  APPROVED: '已批准',
  COMPLETED: '已完成',
  PENDING: '待处理',
  REJECTED: '已拒绝',
};

function statusColor(status: string) {
  if (['ACCEPTED', 'APPROVED', 'COMPLETED'].includes(status)) return 'green';
  if (status === 'PENDING') return 'gold';
  if (status === 'REJECTED') return 'red';
  return 'blue';
}

function typeColor(type: string) {
  if (type === 'APPROVAL') return 'red';
  if (type === 'HANDOFF') return 'blue';
  return 'green';
}

function roleName(code?: string) {
  return code ? (roleNames[code] ?? code) : '-';
}

function formatTime(value?: string) {
  if (!value) return '-';
  return new Date(value).toLocaleString('zh-CN', { hour12: false });
}

async function loadCards() {
  loading.value = true;
  try {
    cards.value = await getCloudMoldAgentBusinessCards({
      cardType: cardType.value,
      limit: 100,
      roleCode: roleCode.value,
    });
    loadFailed.value = false;
    serviceUnavailable.value = false;
  } catch (error) {
    cards.value = [];
    serviceUnavailable.value = isAgentControlUnavailable(error);
    loadFailed.value = !serviceUnavailable.value;
  } finally {
    loading.value = false;
  }
}

onMounted(loadCards);
</script>

<template>
  <Page
    title="岗位协同中心"
    description="查看 Agent 之间真实发生的审批、交接和业务结果。"
  >
    <Alert
      class="mb-4"
      type="info"
      show-icon
      message="这里呈现业务进展，不展示 SkillTask、MCP 或运行参数"
      description="当前首条闭环覆盖库控、买手和客服。生产采购仍受独立审批与预算门禁约束。"
    />

    <Alert
      v-if="serviceUnavailable"
      class="mb-4"
      type="warning"
      show-icon
      message="Agent Control 当前未启用"
      description="该能力在 P0 激活评审前保持默认关闭；完成真实审批、DeerFlow E2E 与湖仓终态验收后再启用。"
    />
    <Alert
      v-else-if="loadFailed"
      class="mb-4"
      type="error"
      show-icon
      message="岗位进展加载失败"
      description="请检查后端服务与网络状态后重试。"
    />

    <Card v-if="!serviceUnavailable" class="mb-4" :bordered="false">
      <Space wrap>
        <Select
          v-model:value="roleCode"
          class="w-40"
          allow-clear
          placeholder="选择岗位"
          :options="roleOptions"
          @change="loadCards"
        />
        <Select
          v-model:value="cardType"
          class="w-40"
          allow-clear
          placeholder="选择事项"
          :options="typeOptions"
          @change="loadCards"
        />
        <Button :loading="loading" @click="loadCards">刷新进展</Button>
      </Space>
    </Card>

    <Spin v-if="!serviceUnavailable" :spinning="loading">
      <Empty v-if="!cards.length" description="当前没有符合条件的岗位事项" />
      <Row v-else :gutter="[16, 16]">
        <Col v-for="item in cards" :key="item.cardId" :xs="24" :lg="12" :xl="8">
          <Card class="h-full" :bordered="false">
            <template #title>
              <Space>
                <Tag :color="typeColor(item.cardType)">
                  {{ typeNames[item.cardType] ?? item.cardType }}
                </Tag>
                <span>{{ item.title }}</span>
              </Space>
            </template>
            <template #extra>
              <Tag :color="statusColor(item.status)">
                {{ statusNames[item.status] ?? item.status }}
              </Tag>
            </template>

            <Space direction="vertical" class="w-full" :size="10">
              <Typography.Text>
                承接岗位：<strong>{{ roleName(item.roleCode) }}</strong>
              </Typography.Text>
              <Typography.Text v-if="item.fromRoleCode" type="secondary">
                来自：{{ roleName(item.fromRoleCode) }}
              </Typography.Text>
              <Typography.Paragraph
                class="mb-0"
                :ellipsis="{ rows: 3, expandable: true }"
              >
                {{
                  item.summary ||
                  item.outcomeCode ||
                  '事项已记录，等待岗位处理。'
                }}
              </Typography.Paragraph>
              <Space>
                <Tag v-if="item.riskLevel" color="orange">
                  {{ item.riskLevel }}
                </Tag>
                <Typography.Text type="secondary">
                  {{ formatTime(item.occurredAt) }}
                </Typography.Text>
              </Space>
            </Space>
          </Card>
        </Col>
      </Row>
    </Spin>
  </Page>
</template>
