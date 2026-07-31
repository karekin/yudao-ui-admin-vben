<script lang="ts" setup>
import type { CloudMoldAgentControlApi } from '#/api/cloudmold/agent-control';

import { computed, ref, watch } from 'vue';

import {
  Alert,
  Descriptions,
  DescriptionsItem,
  Skeleton,
  Table,
  Tag,
  Typography,
} from 'ant-design-vue';

import { getCloudMoldAgentApprovalDetail } from '#/api/cloudmold/agent-control';
import { getSimpleUser } from '#/api/system/user';

import {
  buildApprovalDecisionPresentation,
  buildApprovalPresentation,
  buildGenericApprovalPresentation,
} from './approval-presentation';

const props = defineProps<{ id?: string }>();

const loading = ref(false);
const loadFailed = ref(false);
const approval = ref<CloudMoldAgentControlApi.ApprovalDetail>();
const hasApprovalContext = ref(false);
const userNames = ref<Record<number, string>>({});

const presentation = computed(() => buildApprovalPresentation(approval.value));
const genericPresentation = computed(() =>
  presentation.value
    ? undefined
    : buildGenericApprovalPresentation(approval.value),
);
const decisionPresentation = computed(() =>
  buildApprovalDecisionPresentation(approval.value),
);
const roleLabel = computed(() =>
  approval.value?.roleCode === 'merchandising'
    ? '商品运营'
    : approval.value?.roleCode || '-',
);
const triggerLabel = computed(() =>
  approval.value?.reasonCode === 'TEMPORAL_SCHEDULED_WRITE'
    ? 'Temporal 每小时定时任务'
    : approval.value?.reasonCode || '-',
);

const skuColumns = [
  { dataIndex: 'skuCode', key: 'skuCode', title: 'SKU' },
  { dataIndex: 'color', key: 'color', title: '颜色', width: 100 },
  { dataIndex: 'size', key: 'size', title: '尺码', width: 90 },
  { dataIndex: 'barcode', key: 'barcode', title: '条码' },
];

function approvalIdFromBusinessKey(value?: string) {
  if (!value) return undefined;
  const parts = value.split(':');
  return parts.length >= 3 ? parts.slice(2).join(':') : value;
}

function userName(userId?: number) {
  if (!userId) return '-';
  return userNames.value[userId] || '加载用户名称中…';
}

async function loadUserNames(detail?: CloudMoldAgentControlApi.ApprovalDetail) {
  const userIds = [
    ...new Set(
      [detail?.requesterUserId, detail?.approverUserId].filter(
        (userId): userId is number => Number.isInteger(userId),
      ),
    ),
  ];
  await Promise.all(
    userIds.map(async (userId) => {
      try {
        const user = await getSimpleUser(userId);
        userNames.value = {
          ...userNames.value,
          [userId]: user.nickname || user.username || '未知用户',
        };
      } catch {
        userNames.value = { ...userNames.value, [userId]: '未知用户' };
      }
    }),
  );
}

async function loadApproval() {
  const approvalId = approvalIdFromBusinessKey(props.id);
  hasApprovalContext.value = Boolean(approvalId);
  if (!approvalId) {
    approval.value = undefined;
    loadFailed.value = false;
    return;
  }
  loading.value = true;
  try {
    approval.value = await getCloudMoldAgentApprovalDetail(approvalId);
    await loadUserNames(approval.value);
    loadFailed.value = !approval.value;
  } catch {
    approval.value = undefined;
    loadFailed.value = true;
  } finally {
    loading.value = false;
  }
}

watch(() => props.id, loadApproval, { immediate: true });
</script>

<template>
  <div class="rounded-md border bg-card p-4">
    <Typography.Title :level="5" class="!mb-3">
      Agent 高风险动作审批
    </Typography.Title>

    <template v-if="!hasApprovalContext">
      <Alert
        type="info"
        show-icon
        message="该流程由 AI 运营工作流自动发起"
        description="进入具体流程实例后，此处会展示审批前已冻结的业务对象、拟执行动作、影响范围和执行边界。"
      />
    </template>

    <Skeleton v-else-if="loading" active :paragraph="{ rows: 6 }" />

    <Alert
      v-else-if="loadFailed"
      type="warning"
      show-icon
      message="审批业务上下文暂时无法读取"
      description="请勿在无法确认业务对象和影响范围时审批。"
    />

    <template v-else-if="approval">
      <template v-if="decisionPresentation">
        <Alert
          class="mb-4"
          type="warning"
          show-icon
          message="审批前请确认：业务目标、预期产出与风险依据"
          description="审批只放行下方已冻结的业务范围；不放行未展示的对象、金额或后续动作。"
        />
        <Descriptions :column="1" bordered size="small" class="mb-4">
          <DescriptionsItem label="本次要完成什么">
            {{ decisionPresentation.objective }}
          </DescriptionsItem>
          <DescriptionsItem label="审批后将留下什么">
            <Tag
              v-for="output in decisionPresentation.outputs"
              :key="output"
              color="blue"
            >
              {{ output }}
            </Tag>
          </DescriptionsItem>
          <DescriptionsItem label="为什么需要高风险审批">
            {{ decisionPresentation.riskReason }}
          </DescriptionsItem>
        </Descriptions>
      </template>
      <Alert
        v-if="presentation"
        class="mb-4"
        type="warning"
        show-icon
        :message="presentation.actionTitle"
        description="审批通过后，Agent 将写入规范商品目录并推进商品主数据生命周期。这些写入会形成正式的 Style、SPU、SKU 和条码记录。"
      />
      <Alert
        v-else-if="genericPresentation"
        class="mb-4"
        type="info"
        show-icon
        :message="genericPresentation.actionTitle"
        :description="genericPresentation.summary"
      />
      <Alert
        v-else
        class="mb-4"
        type="warning"
        show-icon
        message="冻结业务快照缺失或无法解析"
        description="当前无法确认具体业务对象和影响范围，不建议审批。"
      />

      <template v-if="presentation">
        <Typography.Title :level="5" class="!mb-2">
          拟写入的商品主数据
        </Typography.Title>
        <Descriptions :column="2" bordered size="small">
          <DescriptionsItem label="新品名称" :span="2">
            {{ presentation.productName }}
          </DescriptionsItem>
          <DescriptionsItem label="SPU">
            {{ presentation.spuCode }}
          </DescriptionsItem>
          <DescriptionsItem label="规划">
            {{ presentation.planningYear || '-' }} / {{ presentation.season }} /
            {{ presentation.category }}
          </DescriptionsItem>
          <DescriptionsItem label="颜色">
            <Tag
              v-for="color in presentation.colorNames"
              :key="color"
              color="blue"
            >
              {{ color }}
            </Tag>
          </DescriptionsItem>
          <DescriptionsItem label="尺码">
            <Tag v-for="size in presentation.sizeNames" :key="size">
              {{ size }}
            </Tag>
          </DescriptionsItem>
          <DescriptionsItem label="变体规模">
            {{ presentation.skuRows.length }} 个 SKU /
            {{ presentation.barcodeCount }} 个条码
          </DescriptionsItem>
          <DescriptionsItem label="生命周期写入">
            {{ presentation.lifecycleCount }} 个状态动作
          </DescriptionsItem>
        </Descriptions>

        <Typography.Title :level="5" class="!mb-2 !mt-4">
          SKU 明细
        </Typography.Title>
        <Table
          :columns="skuColumns"
          :data-source="presentation.skuRows"
          :pagination="false"
          :scroll="{ x: 640 }"
          size="small"
        />

        <Alert
          class="mt-4"
          type="info"
          show-icon
          message="本次审批的执行边界"
          description="本次只批准 Catalog 建档与启用，不包含定价、库存入账、渠道商品发布或真正上架；后续动作必须由各自的权威服务和审批卡口处理。"
        />
      </template>

      <template v-else-if="genericPresentation">
        <Typography.Title :level="5" class="!mb-2">
          已冻结的业务范围
        </Typography.Title>
        <Descriptions :column="2" bordered size="small">
          <DescriptionsItem label="业务步骤">
            {{ genericPresentation.operationCount || '-' }} 项
          </DescriptionsItem>
          <DescriptionsItem label="计划动作" :span="1">
            {{
              genericPresentation.operationNames.join('、') || '已冻结业务输入'
            }}
          </DescriptionsItem>
          <DescriptionsItem
            v-for="entry in genericPresentation.entries"
            :key="entry.label"
            :label="entry.label"
            :span="2"
          >
            {{ entry.value }}
          </DescriptionsItem>
        </Descriptions>
        <Alert
          class="mt-4"
          type="info"
          show-icon
          message="本次审批的执行边界"
          description="本页只展示服务端已冻结的业务范围和步骤；审批通过后仍须由 Temporal、一次性执行凭证和领域服务分别校验后才会写入业务数据。"
        />
      </template>

      <Typography.Title :level="5" class="!mb-2 !mt-4">
        审批追踪
      </Typography.Title>
      <Descriptions :column="2" bordered size="small">
        <DescriptionsItem label="风险等级">
          <Tag color="orange">{{ approval.riskLevel }}</Tag>
        </DescriptionsItem>
        <DescriptionsItem label="触发来源">
          {{ triggerLabel }}
        </DescriptionsItem>
        <DescriptionsItem label="执行岗位">
          {{ roleLabel }}
          <Typography.Text type="secondary">
            （{{ approval.roleCode }}）
          </Typography.Text>
        </DescriptionsItem>
        <DescriptionsItem label="技术动作">
          {{ approval.actionCode }}
        </DescriptionsItem>
        <DescriptionsItem label="申请人">
          {{ userName(approval.requesterUserId) }}
        </DescriptionsItem>
        <DescriptionsItem label="审批人">
          {{ userName(approval.approverUserId) }}
        </DescriptionsItem>
        <DescriptionsItem label="审批 ID" :span="2">
          {{ approval.approvalId }}
        </DescriptionsItem>
        <DescriptionsItem label="工作单" :span="2">
          {{ approval.workOrderId }}
        </DescriptionsItem>
      </Descriptions>
    </template>
  </div>
</template>
