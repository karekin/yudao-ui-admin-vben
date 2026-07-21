import { requestClient } from '#/api/request';

/**
 * CloudMold agent-control governance 写命令（岗位角色授予 / 撤销）。
 * 后端 CQRS：POST /cloudmold/agent-control/governance/authorities/commands + AgentAuthorityCommand。
 * envelope 仅 idempotencyKey + occurredAt（后端 validateEnvelope 不强制 correlationId/runId；
 * DTO 亦无 correlationId/runId 字段，故不套通用 envelope helper，避免多余字段）。
 * GRANT 后端额外校验：governance 用户不能给自己授/撤 + 角色须 ACTIVE + 有效期合法。
 */

/** 岗位角色授予治理 operation（对齐后端 AgentAuthorityOperation） */
export const AgentAuthorityOperation = {
  GRANT_ROLE: 'GRANT_ROLE',
  REVOKE_ROLE: 'REVOKE_ROLE',
} as const;

export namespace CloudMoldAgentControlCommandApi {
  export interface CommandResult {
    aggregateId: string;
    aggregateType: string;
    aggregateVersion: number;
    duplicate: boolean;
    operationId: number;
    status: string;
  }
}

function sendGovernanceCommand(payload: Record<string, unknown>) {
  return requestClient.post<CloudMoldAgentControlCommandApi.CommandResult>(
    '/cloudmold/agent-control/governance/authorities/commands',
    {
      idempotencyKey: crypto.randomUUID(),
      occurredAt: new Date().toISOString(),
      ...payload,
    },
  );
}

/** 授予岗位角色（GRANT_ROLE）：actorUserId 为 yudao 用户 ID，validFrom/validUntil 为 ISO Instant */
export function grantRole(
  actorUserId: number,
  roleCode: string,
  validFrom: string,
  validUntil: string,
) {
  return sendGovernanceCommand({
    operation: AgentAuthorityOperation.GRANT_ROLE,
    roleGrant: { actorUserId, roleCode, validFrom, validUntil },
  });
}

/** 撤销岗位角色（REVOKE_ROLE）：回传 grantId/actorUserId/roleCode/expectedVersion 做幂等 CAS */
export function revokeRole(
  grantId: string,
  actorUserId: number,
  roleCode: string,
  expectedVersion: number,
) {
  return sendGovernanceCommand({
    operation: AgentAuthorityOperation.REVOKE_ROLE,
    roleGrant: { actorUserId, expectedVersion, grantId, roleCode },
  });
}
