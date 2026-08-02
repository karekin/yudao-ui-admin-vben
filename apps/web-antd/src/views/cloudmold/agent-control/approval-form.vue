<script lang="ts" setup>
import type { CloudMoldAgentControlApi } from '#/api/cloudmold/agent-control';
import type { CloudMoldAiOperationsApi } from '#/api/cloudmold/ai-operations';

import { computed, ref, watch } from 'vue';

import { Alert, Skeleton, Tag } from 'ant-design-vue';

import { getCloudMoldAgentApprovalDetail } from '#/api/cloudmold/agent-control';
import {
  getCloudMoldManagedWorkflowDetail,
  getCloudMoldTemporalApprovalBlock,
} from '#/api/cloudmold/ai-operations';
import { router } from '#/router';
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
const temporalBlock =
  ref<CloudMoldAiOperationsApi.TemporalApprovalBlock>();
const workflowDefinition =
  ref<CloudMoldAiOperationsApi.ManagedWorkflowDetail>();
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
const workflowName = computed(
  () =>
    workflowDefinition.value?.workflow.displayName ||
    decisionPresentation.value?.title ||
    '关联托管工作流',
);

const scopeRows = computed(() => {
  if (presentation.value) {
    return [
      { label: '业务步骤', value: presentation.value.actionTitle },
      {
        label: '计划动作',
        value: `创建 ${presentation.value.skuRows.length} 个 SKU，并写入 ${presentation.value.lifecycleCount} 个生命周期状态`,
      },
      {
        label: '已冻结业务输入',
        value: `${presentation.value.productName} / ${presentation.value.spuCode} / ${presentation.value.barcodeCount} 个条码`,
      },
    ];
  }

  const entries = genericPresentation.value?.entries ?? [];
  return [
    {
      label: '业务步骤',
      value: workflowName.value || genericPresentation.value?.actionTitle || '受控业务操作',
    },
    {
      label: '计划动作',
      value: genericPresentation.value?.operationNames.join('、') || '按冻结范围执行受控运营动作',
    },
    {
      label: '已冻结业务输入',
      value:
        entries
          .slice(0, 2)
          .map((entry) => `${entry.label}：${entry.value}`)
          .join('；') || '已冻结本次业务输入与影响范围',
    },
  ];
});

const approvalTrail = computed(() => {
  const waiting = temporalBlock.value?.status === 'WAITING_APPROVAL';
  return [
    {
      detail: `${userName(approval.value?.requesterUserId)} · 已发起`,
      state: 'done',
      title: '发起人',
    },
    {
      detail: approval.value?.processInstanceId ? '审批流程已提交 · 已完成' : '等待流程实例确认',
      state: 'done',
      title: '运营主体首审',
    },
    {
      detail: `${userName(approval.value?.approverUserId)} · ${waiting ? '当前等待' : '待审批处理'}`,
      state: 'current',
      title: '领域责任人会签',
    },
    {
      detail: '审批通过后继续 Temporal · 未开始',
      state: 'pending',
      title: '结束',
    },
  ];
});

const skillPreviewSteps = computed(() => {
  const waiting = temporalBlock.value?.status === 'WAITING_APPROVAL';
  const steps = workflowDefinition.value?.steps ?? [];
  const approvalStepIndex = steps.findIndex((step) => step.approvalRequired);
  if (steps.length > 0) {
    return steps.map((step, index) => {
      const isApprovalStep = index === approvalStepIndex;
      const state =
        approvalStepIndex < 0
          ? index === 0
            ? waiting
              ? 'current'
              : 'done'
            : 'pending'
          : index < approvalStepIndex || (isApprovalStep && !waiting)
            ? 'done'
            : isApprovalStep && waiting
              ? 'current'
              : 'pending';
      return {
        label: step.displayName || step.stepCode,
        state,
        status:
          state === 'current'
            ? '当前阻塞'
            : state === 'done'
              ? '已完成 / 已通过'
              : temporalBlock.value?.skillTaskId
                ? '等待执行'
                : '等待审批放行',
      };
    });
  }
  return [
    { label: '前置范围与风险校验', state: 'done', status: '已完成前置校验' },
    {
      label: '高风险业务操作审批',
      state: waiting ? 'current' : 'done',
      status: waiting ? '当前阻塞' : '审批已处理',
    },
    {
      label: '创建 SkillTask 并执行已登记 Skill',
      state: 'pending',
      status: temporalBlock.value?.skillTaskId ? 'SkillTask 已创建' : '等待审批放行',
    },
    { label: '业务终态核验与证据归档', state: 'pending', status: '未开始' },
  ];
});

const visibleSkillPreviewSteps = computed(() => skillPreviewSteps.value.slice(0, 6));

function approvalIdFromBusinessKey(value?: string) {
  if (!value) return undefined;
  const parts = value.split(':');
  return parts.length >= 3 ? parts.slice(2).join(':') : value;
}

function userName(userId?: number) {
  if (!userId) return '-';
  return userNames.value[userId] || '加载用户名称中…';
}

function workflowWorkspaceLink(tab: 'managed-workflows' | 'runs') {
  if (tab === 'managed-workflows') {
    return router.resolve({
      name: 'CloudMoldAiWorkflowDetail',
      query: {
        skillId: approval.value?.skillId,
      },
    }).href;
  }
  return router.resolve({
    name: 'CloudMoldAiWorkflowRun',
    query: {
      approvalId: temporalBlock.value?.approvalId,
      detail:
        temporalBlock.value?.skillTaskId ? 'run' : 'temporal-block',
      skillId: approval.value?.skillId,
      taskId: temporalBlock.value?.skillTaskId,
      tab: 'runs',
      temporalRunId: temporalBlock.value?.temporalRunId,
      temporalWorkflowId: temporalBlock.value?.temporalWorkflowId,
    },
  }).href;
}

function taskProgressLink() {
  return workflowWorkspaceLink('runs');
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
    temporalBlock.value = undefined;
    workflowDefinition.value = undefined;
    loadFailed.value = false;
    return;
  }
  loading.value = true;
  try {
    approval.value = await getCloudMoldAgentApprovalDetail(approvalId);
    temporalBlock.value = approval.value
      ? await getCloudMoldTemporalApprovalBlock(approvalId).catch(() => undefined)
      : undefined;
    workflowDefinition.value = approval.value?.skillId
      ? await getCloudMoldManagedWorkflowDetail(approval.value.skillId).catch(
          () => undefined,
        )
      : undefined;
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
  <div class="space-y-5">

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
      <section
        v-if="approval.skillId"
        class="grid overflow-hidden rounded-xl border border-blue-300 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/50 lg:grid-cols-[minmax(0,1fr)_auto]"
      >
        <div class="px-5 py-4">
          <h2 class="mb-1 text-lg font-semibold text-blue-950 dark:text-blue-100">
            关联工作流 · {{ workflowName }}
          </h2>
          <p class="m-0 text-sm leading-6 text-blue-700 dark:text-blue-300">
            <template v-if="temporalBlock">
              阻塞节点：高风险业务操作审批 · Temporal 实例
              <span class="break-all font-medium">{{ temporalBlock.temporalWorkflowId }}</span>
              · 审批通过后进入 SkillTask 执行
            </template>
            <template v-else>已冻结本次业务输入与影响范围，审批通过后才会继续执行。</template>
          </p>
        </div>
        <div class="flex border-t border-blue-200 dark:border-blue-900 lg:border-l lg:border-t-0">
          <a
            :href="taskProgressLink()"
            class="flex min-h-[76px] items-center justify-center px-5 text-sm font-medium text-blue-700 transition-colors hover:bg-white/75 dark:text-blue-300 dark:hover:bg-blue-900/50"
          >
            查看阻塞节点
          </a>
          <a
            :href="workflowWorkspaceLink('managed-workflows')"
            class="flex min-h-[76px] items-center justify-center border-l border-blue-200 px-5 text-sm font-medium text-blue-700 transition-colors hover:bg-white/75 dark:border-blue-900 dark:text-blue-300 dark:hover:bg-blue-900/50"
          >
            查看 Skill 编排
          </a>
        </div>
      </section>

      <div class="grid gap-5 xl:grid-cols-[minmax(0,1.9fr)_minmax(320px,0.9fr)]">
        <section class="rounded-xl border border-border bg-card p-5">
          <h2 class="mb-4 text-lg font-semibold text-foreground">审批决策</h2>
          <div class="mb-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/80 dark:bg-amber-950/40">
            <span class="mt-0.5 text-xl font-semibold leading-5 text-amber-600 dark:text-amber-400">!</span>
            <div>
              <p class="m-0 font-semibold text-amber-900 dark:text-amber-200">审批前请确认：业务目标、预期产出与风险依据</p>
              <p class="mb-0 mt-1 text-sm leading-5 text-amber-800 dark:text-amber-300">
                仅放行已冻结的业务范围；未展示对象、金额或后续动作不在本次授权内。
              </p>
            </div>
          </div>
          <div class="overflow-hidden rounded-xl border border-border">
            <div class="grid border-b border-border md:grid-cols-[192px_minmax(0,1fr)]">
              <div class="bg-muted px-4 py-4 text-sm font-medium text-muted-foreground">本次要完成什么</div>
              <div class="px-5 py-4 text-sm leading-6 text-foreground">
                {{ decisionPresentation?.objective || '按已冻结的业务范围执行受控运营动作。' }}
              </div>
            </div>
            <div class="grid border-b border-border md:grid-cols-[192px_minmax(0,1fr)]">
              <div class="bg-muted px-4 py-4 text-sm font-medium text-muted-foreground">审批后将留下什么</div>
              <div class="flex flex-wrap gap-2 px-5 py-4">
                <span
                  v-for="output in decisionPresentation?.outputs || ['业务处理结果', '状态变更记录', '可追溯的审计证据']"
                  :key="output"
                  class="rounded-md bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 dark:bg-blue-950/70 dark:text-blue-300"
                >
                  {{ output }}
                </span>
              </div>
            </div>
            <div class="grid md:grid-cols-[192px_minmax(0,1fr)]">
              <div class="bg-muted px-4 py-4 text-sm font-medium text-muted-foreground">为什么需要高风险审批</div>
              <div class="px-5 py-4 text-sm leading-6 text-foreground">
                {{ decisionPresentation?.riskReason || '请确认业务对象、影响范围和执行边界后再放行。' }}
              </div>
            </div>
          </div>
        </section>

        <section class="rounded-xl border border-border bg-card p-5">
          <h2 class="mb-4 text-lg font-semibold text-foreground">审批轨迹</h2>
          <div class="relative space-y-5 before:absolute before:bottom-5 before:left-[5px] before:top-5 before:w-px before:bg-border">
            <div v-for="item in approvalTrail" :key="item.title" class="relative flex gap-3 pl-0">
              <span
                class="relative z-10 mt-1 block h-3 w-3 shrink-0 rounded-full ring-4 ring-card"
                :class="{
                  'bg-[#52c41a]': item.state === 'done',
                  'bg-[#1677ff]': item.state === 'current',
                  'bg-[#cbd5e1]': item.state === 'pending',
                }"
              />
              <div>
                <p class="mb-0 text-sm font-semibold text-foreground">{{ item.title }}</p>
                <p
                  class="mb-0 mt-1 text-xs leading-5"
                  :class="item.state === 'current' ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'"
                >
                  {{ item.detail }}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div class="mt-5 grid gap-5 xl:grid-cols-2">
        <section class="rounded-xl border border-border bg-card p-5">
          <h2 class="mb-1 text-lg font-semibold text-foreground">已冻结的业务范围</h2>
          <p class="mb-4 text-sm leading-5 text-muted-foreground">
            审批只覆盖以下对象和动作；未列出的金额、对象或后续动作不会被放行。
          </p>
          <div class="space-y-3">
            <div
              v-for="row in scopeRows"
              :key="row.label"
              class="grid items-center gap-2 rounded-lg bg-muted px-3 py-3 sm:grid-cols-[140px_minmax(0,1fr)]"
            >
              <span class="text-sm font-medium text-muted-foreground">{{ row.label }}</span>
              <span class="break-words text-sm leading-5 text-foreground">{{ row.value }}</span>
            </div>
          </div>
        </section>

        <section class="rounded-xl border border-border bg-card p-5">
          <div class="mb-1 flex items-center justify-between gap-3">
            <h2 class="text-lg font-semibold text-foreground">Skill 编排预览</h2>
            <a
              :href="workflowWorkspaceLink('managed-workflows')"
              class="shrink-0 text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              查看完整编排
            </a>
          </div>
          <p class="mb-1 text-sm font-medium text-foreground">
            {{ workflowDefinition?.workflow.displayName || workflowName }}
          </p>
          <p class="mb-4 text-sm leading-5 text-muted-foreground">
            DeerFlow 管理 Agent；以下为当前 SkillTask 定义锁定的真实步骤。
          </p>
          <div class="space-y-2">
            <div
              v-for="(step, index) in visibleSkillPreviewSteps"
              :key="step.label"
              class="grid min-h-10 grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-3 py-2"
              :class="step.state === 'current' ? 'bg-amber-50 dark:bg-amber-950/40' : ''"
            >
              <span
                class="flex h-6 w-6 items-center justify-center rounded-md text-xs font-semibold"
                :class="step.state === 'current' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300' : 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300'"
              >{{ index + 1 }}</span>
              <span class="min-w-0 truncate text-sm font-medium text-foreground">{{ step.label }}</span>
              <span
                class="text-xs whitespace-nowrap"
                :class="step.state === 'current' ? 'text-amber-700 dark:text-amber-300' : 'text-muted-foreground'"
              >{{ step.status }}</span>
            </div>
          </div>
          <p
            v-if="skillPreviewSteps.length > visibleSkillPreviewSteps.length"
            class="mb-0 mt-3 text-xs text-muted-foreground"
          >
            已展示前 {{ visibleSkillPreviewSteps.length }} 步，完整定义共 {{ skillPreviewSteps.length }} 步。
          </p>
        </section>
      </div>

      <p class="mb-0 text-xs leading-5 text-muted-foreground">
        审批 ID：{{ approval.approvalId }} · 工作单：{{ approval.workOrderId }} · 风险等级：
        <Tag color="orange" class="!m-0">{{ approval.riskLevel }}</Tag>
      </p>
    </template>
  </div>
</template>
