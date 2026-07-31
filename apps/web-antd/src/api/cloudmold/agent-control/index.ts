import { requestClient } from '#/api/request';

const OPTIONAL_FEATURE_HEADERS = {
  'X-CloudMold-Optional-Feature': 'agent-control',
};

export namespace CloudMoldAgentControlApi {
  export type CardType = 'APPROVAL' | 'HANDOFF' | 'RESULT';

  export interface BusinessCard {
    actionCode: string;
    activeAssigneeUserIds?: string;
    approverUserId?: number;
    cardId: string;
    cardType: CardType;
    fromRoleCode?: string;
    missionId?: string;
    occurredAt: string;
    outcomeCode?: string;
    processInstanceId?: string;
    requesterUserId?: number;
    riskLevel: string;
    roleCode: string;
    scopeHash?: string;
    status: string;
    summary?: string;
    title: string;
    workOrderId: string;
    workflowStatus?: string;
  }

  export interface BusinessCardParams {
    cardType?: CardType;
    limit?: number;
    roleCode?: string;
    status?: string;
  }

  export interface ApprovalBoardStats {
    approverAssignmentRequired: number;
    bpmInProgress: number;
    bpmTerminalPendingSafety: number;
    pendingTotal: number;
    releasedWaitingExecution: number;
    startUncertain: number;
  }

  export interface ApprovalDetail {
    actionCode: string;
    approvalId: string;
    approverUserId?: number;
    businessContextJson?: string;
    processInstanceId?: string;
    reasonCode?: string;
    requestedAt: string;
    requesterUserId?: number;
    riskLevel: string;
    roleCode: string;
    scopeHash?: string;
    skillId?: string;
    skillVersion?: string;
    status: string;
    title: string;
    workOrderId: string;
    workflowStatus?: string;
  }

  /** 岗位角色授予记录（对齐后端 ActorRoleGrantView） */
  export interface ActorRoleGrantView {
    actorUserId: number;
    grantId: string;
    grantedAt: string;
    grantedByUserId: number;
    roleCode: string;
    status: string;
    updatedAt: string;
    validFrom: string;
    validUntil: string;
    version: number;
  }

  export interface RoleGrantParams {
    actorUserId?: number;
    limit?: number;
    roleCode?: string;
    status?: string;
  }
}

export function getCloudMoldAgentBusinessCards(
  params: CloudMoldAgentControlApi.BusinessCardParams,
) {
  return requestClient.get<CloudMoldAgentControlApi.BusinessCard[]>(
    '/cloudmold/agent-control/business-cards',
    { headers: OPTIONAL_FEATURE_HEADERS, params },
  );
}

export function getCloudMoldAgentApprovalBoardStats() {
  return requestClient.get<CloudMoldAgentControlApi.ApprovalBoardStats>(
    '/cloudmold/agent-control/approval-board-stats',
    { headers: OPTIONAL_FEATURE_HEADERS },
  );
}

export function getCloudMoldAgentApprovalDetail(approvalId: string) {
  return requestClient.get<CloudMoldAgentControlApi.ApprovalDetail>(
    `/cloudmold/agent-control/approvals/${encodeURIComponent(approvalId)}/detail`,
    { headers: OPTIONAL_FEATURE_HEADERS },
  );
}

/** 查询岗位角色授予记录（管理员治理只读，权限 cloudmold:agent-control:govern） */
export function getCloudMoldAgentRoleGrants(
  params: CloudMoldAgentControlApi.RoleGrantParams,
) {
  return requestClient.get<CloudMoldAgentControlApi.ActorRoleGrantView[]>(
    '/cloudmold/agent-control/governance/authorities/grants',
    { headers: OPTIONAL_FEATURE_HEADERS, params },
  );
}

export function isAgentControlUnavailable(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const candidate = error as {
    code?: number;
    data?: { code?: number };
    response?: { data?: { code?: number }; status?: number };
  };
  return (
    candidate.code === 404 ||
    candidate.data?.code === 404 ||
    candidate.response?.data?.code === 404 ||
    candidate.response?.status === 404
  );
}

export function isAgentControlForbidden(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const candidate = error as {
    code?: number;
    data?: { code?: number };
    response?: { data?: { code?: number }; status?: number };
  };
  return (
    candidate.code === 403 ||
    candidate.data?.code === 403 ||
    candidate.response?.data?.code === 403 ||
    candidate.response?.status === 403
  );
}
