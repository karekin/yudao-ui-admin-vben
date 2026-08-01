<script lang="ts" setup>
import type { CloudMoldAiOperationsApi } from '#/api/cloudmold/ai-operations';

import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Alert, Button, Skeleton, Tag } from 'ant-design-vue';

import { getCloudMoldManagedWorkflowDetail } from '#/api/cloudmold/ai-operations';
import { router } from '#/router';

import { managedWorkflowOwnerRoleLabel } from './data';

defineOptions({ name: 'CloudMoldAiWorkflowDetail' });

const route = useRoute();
const loading = ref(false);
const loadFailed = ref(false);
const workflowDetail = ref<CloudMoldAiOperationsApi.ManagedWorkflowDetail>();

const workflow = computed(() => workflowDetail.value?.workflow);
const steps = computed(() => workflowDetail.value?.steps ?? []);
const skillId = computed(() =>
  typeof route.query.skillId === 'string' ? route.query.skillId.trim() : '',
);

function decodeJson(value?: string) {
  if (!value) return undefined;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

const skillDefinitionPreview = computed(() => {
  if (!workflow.value) return '';
  return JSON.stringify(
    {
      schema_version: 'cloudmold.skill-task-definition/v1',
      skill_id: workflow.value.skillId,
      skill_version: workflow.value.skillVersion,
      risk_level: workflow.value.riskLevel,
      workflow_level: workflow.value.workflowLevel,
      owner_role: workflow.value.ownerRole,
      max_attempts: workflow.value.maxAttempts,
      steps: steps.value.map((step) => ({
        step_order: step.stepOrder,
        step_code: step.stepCode,
        display_name: step.displayName,
        step_kind: step.stepKind,
        operation_type: step.operationType,
        approval_required: step.approvalRequired,
        capability_id: step.capabilityId,
        child_skill_id: step.childSkillId,
        child_skill_version: step.childSkillVersion,
        poll_interval_seconds: step.pollIntervalSeconds,
        idempotency_binding: step.idempotencyBinding,
        wait_success: decodeJson(step.waitSuccessJson),
        wait_failure: decodeJson(step.waitFailureJson),
        arguments: decodeJson(step.argumentsJson),
      })),
    },
    (_key, value) => (value === undefined ? undefined : value),
    2,
  );
});

function stepExecutionLabel(
  step: CloudMoldAiOperationsApi.ManagedWorkflowStep,
) {
  return [step.stepKind || 'CAPABILITY', step.operationType || '编排']
    .filter(Boolean)
    .join(' · ');
}

function backToWorkflowList() {
  void router.push({
    name: 'CloudMoldAiWorkflowRun',
    query: { tab: 'managed-workflows' },
  });
}

async function loadWorkflow() {
  if (!skillId.value) {
    workflowDetail.value = undefined;
    loadFailed.value = false;
    return;
  }
  loading.value = true;
  loadFailed.value = false;
  try {
    workflowDetail.value = await getCloudMoldManagedWorkflowDetail(
      skillId.value,
    );
  } catch {
    workflowDetail.value = undefined;
    loadFailed.value = true;
  } finally {
    loading.value = false;
  }
}

watch(skillId, loadWorkflow, { immediate: true });
</script>

<template>
  <Page auto-content-height content-class="flex min-h-0 flex-col gap-5">
    <section class="rounded-2xl border border-border bg-card px-6 py-5 sm:px-8">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="mb-2 text-sm font-semibold text-primary">
            AI 运营 / 托管工作流
          </p>
          <h1 class="m-0 text-2xl font-semibold text-foreground">
            Skill 编排与托管工作流
          </h1>
          <p class="mb-0 mt-2 text-sm leading-6 text-muted-foreground">
            以当前登记版本为准，完整预览 Agent 将执行的确定性 Skill
            编排与治理边界。
          </p>
        </div>
        <Button @click="backToWorkflowList">返回托管工作流</Button>
      </div>
    </section>

    <Alert
      v-if="!skillId"
      type="info"
      show-icon
      message="未指定 Skill"
      description="请从托管工作流列表或审批详情进入具体的 Skill 编排页面。"
    />

    <Skeleton v-else-if="loading" active :paragraph="{ rows: 10 }" />

    <Alert
      v-else-if="loadFailed"
      type="error"
      show-icon
      message="Skill 编排定义暂时无法读取"
      description="请检查工作流是否仍在托管，以及当前账号是否具备 AI 运营查询权限。"
    />

    <template v-else-if="workflow">
      <section
        class="overflow-hidden rounded-2xl border border-blue-300 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40"
      >
        <div
          class="grid gap-4 px-6 py-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
        >
          <div>
            <h2
              class="m-0 text-xl font-semibold text-blue-950 dark:text-blue-100"
            >
              {{ workflow.displayName }}
            </h2>
            <p
              class="mb-0 mt-2 max-w-4xl text-sm leading-6 text-blue-800 dark:text-blue-200"
            >
              {{ workflow.description }}
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <Tag color="orange">{{ workflow.riskLevel }}</Tag>
            <Tag :color="workflow.approvalRequired ? 'warning' : 'success'">
              {{ workflow.approvalRequired ? '需要 BPM 审批' : '无需审批' }}
            </Tag>
            <Tag color="blue">{{ workflow.stepCount }} 个编排步骤</Tag>
          </div>
        </div>
        <div
          class="border-t border-blue-200 px-6 py-3 text-xs leading-5 text-blue-800 dark:border-blue-900 dark:text-blue-200"
        >
          Skill ID：<span class="break-all font-medium">{{
            workflow.skillId
          }}</span>
          · 版本 {{ workflow.skillVersion }} · 定义闭包哈希
          <span class="break-all font-medium">{{
            workflow.definitionClosureSha256
          }}</span>
        </div>
      </section>

      <div
        class="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.85fr)]"
      >
        <section class="rounded-2xl border border-border bg-card p-6">
          <h2 class="m-0 text-lg font-semibold text-foreground">托管信息</h2>
          <div class="mt-5 grid gap-3 sm:grid-cols-2">
            <div class="rounded-xl bg-muted px-4 py-3">
              <p class="mb-1 text-xs text-muted-foreground">负责岗位</p>
              <p class="mb-0 text-sm font-medium text-foreground">
                {{ managedWorkflowOwnerRoleLabel(workflow.ownerRole) }}
              </p>
            </div>
            <div class="rounded-xl bg-muted px-4 py-3">
              <p class="mb-1 text-xs text-muted-foreground">写操作规模</p>
              <p class="mb-0 text-sm font-medium text-foreground">
                {{ workflow.writeStepCount }} 个写操作 / 最多尝试
                {{ workflow.maxAttempts }} 次
              </p>
            </div>
            <div class="rounded-xl bg-muted px-4 py-3">
              <p class="mb-1 text-xs text-muted-foreground">运行架构</p>
              <p class="mb-0 text-sm font-medium text-foreground">
                DeerFlow 管理 Agent · SkillTask 锁定编排与证据
              </p>
            </div>
            <div class="rounded-xl bg-muted px-4 py-3">
              <p class="mb-1 text-xs text-muted-foreground">定义哈希</p>
              <p class="mb-0 break-all text-sm font-medium text-foreground">
                {{ workflow.definitionSha256 }}
              </p>
            </div>
          </div>
        </section>

        <section class="rounded-2xl border border-border bg-card p-6">
          <h2 class="m-0 text-lg font-semibold text-foreground">预览说明</h2>
          <div class="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
            <p class="m-0">
              展示的是当前托管版本的完整定义，不是运行时推测结果。
            </p>
            <p class="m-0">
              步骤中的能力、参数绑定、子 Skill、等待条件与审批门都可展开核查。
            </p>
            <p class="m-0">
              实际执行仍必须通过 SkillTask
              的定义哈希校验，运行证据请在“运行实例”查看。
            </p>
          </div>
        </section>
      </div>

      <section class="rounded-2xl border border-border bg-card p-6">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p class="mb-1 text-sm font-semibold text-primary">
              可审计 Skill 编排
            </p>
            <h2 class="m-0 text-xl font-semibold text-foreground">
              完整步骤定义
            </h2>
          </div>
          <span class="text-sm text-muted-foreground">共 {{ steps.length }} 步</span>
        </div>

        <div class="mt-5 space-y-3">
          <article
            v-for="step in steps"
            :key="step.stepCode"
            class="rounded-xl border border-border bg-card p-4"
          >
            <div class="flex flex-wrap items-start gap-3">
              <span
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-sm font-semibold text-blue-700 dark:bg-blue-950/70 dark:text-blue-300"
              >
                {{ step.stepOrder }}
              </span>
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="m-0 text-base font-semibold text-foreground">
                    {{ step.displayName || step.stepCode }}
                  </h3>
                  <Tag v-if="step.approvalRequired" color="orange">
                    需要审批
                  </Tag>
                  <Tag v-if="step.operationType" color="blue">
                    {{ step.operationType }}
                  </Tag>
                </div>
                <p class="mb-0 mt-1 break-all text-xs text-muted-foreground">
                  编排代码：{{ step.stepCode }} · {{ stepExecutionLabel(step) }}
                </p>
              </div>
            </div>

            <dl
              class="mt-4 grid gap-x-6 gap-y-3 rounded-lg bg-muted p-4 text-sm lg:grid-cols-2"
            >
              <div v-if="step.capabilityId">
                <dt class="text-xs text-muted-foreground">受治理能力</dt>
                <dd class="mb-0 mt-1 break-all font-medium text-foreground">
                  {{ step.capabilityId }}
                </dd>
              </div>
              <div v-if="step.childSkillId">
                <dt class="text-xs text-muted-foreground">子 Skill</dt>
                <dd class="mb-0 mt-1 break-all font-medium text-foreground">
                  {{ step.childSkillId
                  }}{{
                    step.childSkillVersion ? ` @ ${step.childSkillVersion}` : ''
                  }}
                </dd>
              </div>
              <div v-if="step.pollIntervalSeconds">
                <dt class="text-xs text-muted-foreground">轮询间隔</dt>
                <dd class="mb-0 mt-1 font-medium text-foreground">
                  {{ step.pollIntervalSeconds }} 秒
                </dd>
              </div>
              <div v-if="step.idempotencyBinding">
                <dt class="text-xs text-muted-foreground">幂等绑定</dt>
                <dd class="mb-0 mt-1 font-medium text-foreground">
                  参数 {{ step.idempotencyBinding.argumentIndex }} ·
                  {{ step.idempotencyBinding.jsonPointer }}
                </dd>
              </div>
            </dl>

            <div
              v-if="
                step.waitSuccessJson ||
                step.waitFailureJson ||
                step.argumentsJson
              "
              class="mt-3 grid gap-3 xl:grid-cols-3"
            >
              <div
                v-if="step.waitSuccessJson"
                class="rounded-lg border border-border p-3"
              >
                <p class="mb-2 text-xs font-medium text-muted-foreground">
                  等待成功条件
                </p>
                <pre
                  class="m-0 overflow-x-auto whitespace-pre-wrap break-words text-xs leading-5 text-foreground"
                  >{{ step.waitSuccessJson }}</pre>
              </div>
              <div
                v-if="step.waitFailureJson"
                class="rounded-lg border border-border p-3"
              >
                <p class="mb-2 text-xs font-medium text-muted-foreground">
                  等待失败条件
                </p>
                <pre
                  class="m-0 overflow-x-auto whitespace-pre-wrap break-words text-xs leading-5 text-foreground"
                  >{{ step.waitFailureJson }}</pre>
              </div>
              <div
                v-if="step.argumentsJson"
                class="rounded-lg border border-border p-3"
              >
                <p class="mb-2 text-xs font-medium text-muted-foreground">
                  参数绑定
                </p>
                <pre
                  class="m-0 overflow-x-auto whitespace-pre-wrap break-words text-xs leading-5 text-foreground"
                  >{{ step.argumentsJson }}</pre>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section class="overflow-hidden rounded-2xl border border-border bg-card">
        <div class="border-b border-border px-6 py-5">
          <p class="mb-1 text-sm font-semibold text-primary">机器可读预览</p>
          <h2 class="m-0 text-xl font-semibold text-foreground">
            完整 Skill 定义
          </h2>
          <p class="mb-0 mt-2 text-sm text-muted-foreground">
            此 JSON
            由当前托管版本的定义元数据生成，可用于核对编排，不包含运行时业务输入。
          </p>
        </div>
        <pre
          class="m-0 max-h-[720px] overflow-auto bg-muted px-6 py-5 text-xs leading-6 text-foreground"
          >{{ skillDefinitionPreview }}</pre>
      </section>
    </template>
  </Page>
</template>
