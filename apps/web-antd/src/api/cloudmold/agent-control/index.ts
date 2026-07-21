import { requestClient } from '#/api/request';

export namespace CloudMoldAgentControlApi {
  export type CardType = 'APPROVAL' | 'HANDOFF' | 'RESULT';

  export interface BusinessCard {
    actionCode: string;
    cardId: string;
    cardType: CardType;
    fromRoleCode?: string;
    missionId?: string;
    occurredAt: string;
    outcomeCode?: string;
    riskLevel: string;
    roleCode: string;
    status: string;
    summary?: string;
    title: string;
    workOrderId: string;
  }

  export interface BusinessCardParams {
    cardType?: CardType;
    limit?: number;
    roleCode?: string;
    status?: string;
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
    { params },
  );
}

/** 查询岗位角色授予记录（管理员治理只读，权限 cloudmold:agent-control:govern） */
export function getCloudMoldAgentRoleGrants(
  params: CloudMoldAgentControlApi.RoleGrantParams,
) {
  return requestClient.get<CloudMoldAgentControlApi.ActorRoleGrantView[]>(
    '/cloudmold/agent-control/governance/authorities/grants',
    { params },
  );
}
