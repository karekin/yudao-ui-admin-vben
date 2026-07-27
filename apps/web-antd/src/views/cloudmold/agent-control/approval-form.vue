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

import { buildApprovalPresentation } from './approval-presentation';

const props = defineProps<{ id?: string }>();

const loading = ref(false);
const loadFailed = ref(false);
const approval = ref<CloudMoldAgentControlApi.ApprovalDetail>();
const hasApprovalContext = ref(false);

const presentation = computed(() => buildApprovalPresentation(approval.value));
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
      <Alert
        v-if="presentation"
        class="mb-4"
        type="warning"
        show-icon
        :message="presentation.actionTitle"
        description="审批通过后，Agent 将写入规范商品目录并推进商品主数据生命周期。这些写入会形成正式的 Style、SPU、SKU 和条码记录。"
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
          {{ approval.requesterUserId ?? '-' }}
        </DescriptionsItem>
        <DescriptionsItem label="审批人">
          {{ approval.approverUserId ?? '-' }}
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
