import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace CloudMoldAiOperationsApi {
  export type RunSource = 'managed' | 'telemetry';

  export interface ManagedWorkflow {
    approvalRequired: boolean;
    description: string;
    definitionClosureSha256: string;
    definitionSha256: string;
    displayName: string;
    durableAuthority: 'SKILL_TASK';
    managementSurface: 'DEER_FLOW';
    maxAttempts: number;
    ownerRole?: string;
    orchestrationSurface: 'ADMIN_CONSOLE';
    riskLevel: string;
    skillId: string;
    skillVersion: string;
    stepCount: number;
    triggerSource: 'ADMIN_CONSOLE';
    workflowLevel?: string;
    writeStepCount: number;
  }

  export interface ManagedWorkflowListEnvelope {
    data?: ManagedWorkflow[];
    items?: ManagedWorkflow[];
    list?: ManagedWorkflow[];
    records?: ManagedWorkflow[];
  }

  export interface TemporalSchedule {
    cronExpression?: string;
    definitionClosureSha256?: string;
    description: string;
    displayName: string;
    inputStrategy?:
      | 'DOMAIN_BACKLOG'
      | 'EVENT_BACKLOG'
      | 'ROTATING_BUSINESS_SCENARIO'
      | 'STATIC'
      | 'TENANT_AGGREGATE';
    intervalSeconds: number;
    lastActionAt?: string;
    lastReconciledAt?: string;
    nextActionAt?: string;
    overlapPolicy: 'SKIP';
    paused: boolean;
    reconcileError?: string;
    scheduleId: string;
    skillId: string;
    skillVersion: string;
    status: string;
    temporalNamespace: string;
    temporalTaskQueue: string;
    timeZone: string;
  }

  export interface TemporalAutomationWorkflow {
    businessAutonomyState: string;
    candidateCount: number;
    discoverySource: string;
    dispatchedCount: number;
    displayName: string;
    failedCount: number;
    gapCodes: string[];
    lastDispatchOutcome?: null | string;
    proofRef?: null | string;
    scheduleState: string;
    skillId: string;
    skillVersion: string;
  }

  export interface TemporalAutomationOverview {
    autonomyProofCoverageRate: number;
    autonomyProvenCount: number;
    candidateSourceConnectedCount: number;
    candidateSourceCoverageRate: number;
    healthyScheduleCount: number;
    registeredCount: number;
    scheduleCoverageRate: number;
    scheduledCount: number;
    workflows: TemporalAutomationWorkflow[];
  }

  export interface ManagedRun {
    attemptCount: number;
    approvalGate?: ApprovalGateState;
    businessOutcome?: ManagedBusinessOutcome;
    completedAt?: string;
    createdAt: string;
    currentStepCode?: string;
    definitionClosureSha256: string;
    definitionSha256: string;
    inputSha256: string;
    maxAttempts: number;
    parentStepCode?: string;
    parentTaskId?: string;
    riskLevel: string;
    runId: string;
    skillId: string;
    skillVersion: string;
    startedAt?: string;
    status: string;
    statusHistory?: StatusHistory[];
    taskId: string;
    terminalResultSha256?: string;
    updatedAt: string;
    version: number;
  }

  export interface ManagedRunStep {
    attemptCount: number;
    capabilityId?: string;
    childSkillId?: string;
    childSkillVersion?: string;
    childTask?: ManagedRun;
    childTaskId?: string;
    completedAt?: string;
    createdAt: string;
    displayName?: string;
    idempotencyKey?: string;
    lastErrorCode?: string;
    operationType?: string;
    pollIntervalSeconds?: number;
    requestSha256?: string;
    resultSummary?: string;
    resultSha256?: string;
    startedAt?: string;
    status: string;
    stepCode: string;
    stepKind: string;
    stepOrder: number;
    taskId: string;
    updatedAt: string;
  }

  export interface ManagedBusinessAction {
    actionOrder: number;
    actionType: string;
    attemptCount: number;
    businessObjects: ManagedBusinessObject[];
    completedAt?: string;
    displayName: string;
    errorCode?: string;
    evidenceSha256?: string;
    operationType?: string;
    resultSummary: string;
    startedAt?: string;
    status: string;
    stepCode: string;
    taskId: string;
  }

  export interface ManagedBusinessPhase {
    actions: ManagedBusinessAction[];
    approvalRequired: boolean;
    approvalStatus: string;
    businessOutcome?: ManagedBusinessOutcome;
    completedAt?: string;
    depth: number;
    description: string;
    displayName: string;
    parentTaskId?: string;
    phaseCode: string;
    phaseOrder: number;
    riskLevel: string;
    runId?: string;
    skillId?: string;
    skillVersion?: string;
    startedAt?: string;
    status: string;
    taskId?: string;
  }

  export interface ManagedBusinessOutcome {
    businessObjects: ManagedBusinessObject[];
    evidenceSha256?: string;
    headline: string;
    metrics: ManagedOutcomeMetric[];
    outcomeType: string;
    summary: string;
  }

  export interface ManagedBusinessObject {
    businessCode?: string;
    businessId?: string;
    label: string;
    objectType: string;
    status?: string;
  }

  export interface ManagedOutcomeMetric {
    label: string;
    value: string;
  }

  export interface InvocationAttempt {
    attemptId?: string;
    attemptNo?: number;
    cachedInputTokens?: number;
    costAmountMinor?: number;
    currencyCode?: string;
    errorCode?: string;
    latencyMillis?: number;
    modelCode?: string;
    occurredAt?: string;
    outcome?: string;
    outputTokens?: number;
    pricingVersionRef?: string;
    providerCode?: string;
    runId?: string;
    stepRef?: string;
    totalTokens?: number;
  }

  export interface OutcomeFeedback {
    createdAt?: string;
    evaluatorType?: string;
    evidenceRef?: string;
    feedbackId?: string;
    feedbackType?: string;
    occurredAt?: string;
    outcomeCode?: string;
    runId?: string;
  }

  export interface RunArtifact {
    applicationId?: string;
    applicationCode: string;
    createdAt: string;
    evaluatorType: string;
    evidenceRef: string;
    feedbackId: string;
    feedbackType: string;
    occurredAt: string;
    outcomeCode: string;
    runId: string;
    runKey: string;
    workflowCode: string;
    workflowId: string;
    workflowVersion: number;
  }

  export interface RunObservation {
    applicationId: string;
    attemptId: string;
    attemptNo: number;
    cachedInputTokens: number;
    costAmountMinor: number;
    createdAt: string;
    currencyCode: string;
    errorCode?: string;
    inputTokens: number;
    latencyMillis: number;
    modelCode: string;
    occurredAt: string;
    outcome: string;
    outputTokens: number;
    pricingVersionRef: string;
    providerCode: string;
    runId: string;
    runKey: string;
    stepRef: string;
    totalTokens: number;
    workflowId: string;
    workflowVersion: number;
  }

  export interface StatusHistory {
    aggregateVersion?: number;
    currentStatus?: string;
    errorCode?: string;
    historyId?: string;
    occurredAt?: string;
    operationType?: string;
    previousStatus?: string;
  }

  export interface ApprovalGateState {
    approvalRequired?: boolean;
    authority?: string;
    authorityRef?: string;
    currentStep?: string;
    decidedAt?: string;
    decisionSummary?: string;
    expiresAt?: string;
    gateStatus?: string;
    pendingRoleCode?: string;
    riskLevel?: string;
  }

  export interface ManagedRunDetail {
    approvalGate?: ApprovalGateState;
    businessPhases?: ManagedBusinessPhase[];
    statusHistory?: StatusHistory[];
    steps: ManagedRunStep[];
    task: ManagedRun;
  }

  export interface WorkflowDefinition {
    applicationCode: string;
    applicationId: string;
    applicationName: string;
    applicationStatus: string;
    cancelledRunCount: number;
    definitionRef: string;
    definitionSha256: string;
    failedRunCount: number;
    lastRunFinishedAt?: string;
    lastRunId?: string;
    lastRunStartedAt?: string;
    lastRunStatus?: string;
    publishedAt: string;
    runCount: number;
    runningRunCount: number;
    succeededRunCount: number;
    workflowCode: string;
    workflowId: string;
    workflowVersion: number;
    workflowVersionId: string;
  }

  export interface WorkflowDefinitionPageParams extends PageParam {
    applicationId?: string;
    applicationCode?: string;
    applicationStatus?: string;
    workflowCode?: string;
    workflowId?: string;
  }

  export interface WorkflowRun {
    aggregateVersion: number;
    applicationId: string;
    createdAt: string;
    errorCode?: string;
    expectedInvocationCount?: number;
    finishedAt?: string;
    runId: string;
    runKey: string;
    startedAt?: string;
    status: string;
    triggerType: string;
    updatedAt: string;
    workflowId: string;
    workflowVersion: string;
  }

  export interface WorkflowRunPageParams extends PageParam {
    applicationId?: string;
    createdAtFrom?: string;
    createdAtTo?: string;
    runId?: string;
    runKey?: string;
    status?: string;
    triggerType?: string;
    workflowId?: string;
  }

  export interface WorkflowRunDetail {
    application: {
      applicationCode: string;
      applicationId: string;
      applicationName: string;
      applicationStatus: string;
    };
    feedbackArtifacts: OutcomeFeedback[];
    invocationAttempts: RunObservation[];
    run: WorkflowRun & {
      businessRef?: string;
      expectedInvocationCount: number;
      workflowVersionId: string;
    };
    statusHistory: StatusHistory[];
    workflow: {
      currentWorkflowVersion: number;
      definitionRef: string;
      definitionSha256: string;
      publishedAt: string;
      workflowCode: string;
      workflowId: string;
      workflowVersion: number;
      workflowVersionId: string;
    };
  }

  export interface ArtifactPageParams extends PageParam {
    applicationId?: string;
    evaluatorType?: string;
    feedbackType?: string;
    outcomeCode?: string;
    runId?: string;
    workflowId?: string;
  }

  export interface ObservationPageParams extends PageParam {
    applicationId?: string;
    modelCode?: string;
    outcome?: string;
    providerCode?: string;
    runId?: string;
    stepRef?: string;
    workflowId?: string;
  }
}

export function getCloudMoldTemporalScheduleList() {
  return requestClient.get<CloudMoldAiOperationsApi.TemporalSchedule[]>(
    '/cloudmold/ai-operations/temporal-schedules',
  );
}

export function getCloudMoldTemporalAutomationOverview() {
  return requestClient.get<CloudMoldAiOperationsApi.TemporalAutomationOverview>(
    '/cloudmold/ai-operations/temporal-automation/overview',
  );
}

export function triggerCloudMoldTemporalSchedule(scheduleId: string) {
  return requestClient.post(
    `/cloudmold/ai-operations/temporal-schedules/${encodeURIComponent(scheduleId)}/trigger`,
  );
}

export function pauseCloudMoldTemporalSchedule(scheduleId: string) {
  return requestClient.post(
    `/cloudmold/ai-operations/temporal-schedules/${encodeURIComponent(scheduleId)}/pause`,
  );
}

export function resumeCloudMoldTemporalSchedule(scheduleId: string) {
  return requestClient.post(
    `/cloudmold/ai-operations/temporal-schedules/${encodeURIComponent(scheduleId)}/resume`,
  );
}

export function getCloudMoldManagedWorkflowList() {
  return requestClient.get<
    | CloudMoldAiOperationsApi.ManagedWorkflow[]
    | CloudMoldAiOperationsApi.ManagedWorkflowListEnvelope
  >('/cloudmold/ai-operations/managed-workflows');
}

export function getCloudMoldManagedRunPage(params: PageParam) {
  return requestClient.get<PageResult<CloudMoldAiOperationsApi.ManagedRun>>(
    '/cloudmold/ai-operations/managed-runs/page',
    { params },
  );
}

export function getCloudMoldManagedRunDetail(taskId: string) {
  return requestClient.get<CloudMoldAiOperationsApi.ManagedRunDetail>(
    `/cloudmold/ai-operations/managed-runs/${encodeURIComponent(taskId)}`,
  );
}

export function getCloudMoldAiWorkflowPage(
  params: CloudMoldAiOperationsApi.WorkflowDefinitionPageParams,
) {
  return requestClient.get<
    PageResult<CloudMoldAiOperationsApi.WorkflowDefinition>
  >('/cloudmold/ai-operations/workflows/page', { params });
}

export function getCloudMoldAiWorkflowRunPage(
  params: CloudMoldAiOperationsApi.WorkflowRunPageParams,
) {
  return requestClient.get<PageResult<CloudMoldAiOperationsApi.WorkflowRun>>(
    '/cloudmold/ai-operations/runs/page',
    { params },
  );
}

export function getCloudMoldAiWorkflowRunDetail(runId: string) {
  return requestClient.get<CloudMoldAiOperationsApi.WorkflowRunDetail>(
    `/cloudmold/ai-operations/runs/${encodeURIComponent(runId)}`,
  );
}

export function getCloudMoldAiWorkflowArtifactPage(
  params: CloudMoldAiOperationsApi.ArtifactPageParams,
) {
  return requestClient.get<PageResult<CloudMoldAiOperationsApi.RunArtifact>>(
    '/cloudmold/ai-operations/artifacts/page',
    { params },
  );
}

export function getCloudMoldAiWorkflowObservationPage(
  params: CloudMoldAiOperationsApi.ObservationPageParams,
) {
  return requestClient.get<PageResult<CloudMoldAiOperationsApi.RunObservation>>(
    '/cloudmold/ai-operations/observations/page',
    { params },
  );
}
