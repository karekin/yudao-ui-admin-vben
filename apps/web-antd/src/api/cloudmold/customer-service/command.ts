import { requestClient } from '#/api/request';

import { buildCommandEnvelopeWithRunId } from '../command-helpers';

/**
 * CloudMold customer-service 写命令（工单状态转换）。
 * 后端 CQRS：POST /cloudmold/customer-service/command + operation 枚举 + 扁平 DTO。
 * envelope 强制 runId（buildCommandEnvelopeWithRunId 补全；后端校验 runId 为 UUID ≤128）。
 * expectedVersion 从列表 row.aggregateVersion 回传。
 * 状态机：OPEN → IN_PROGRESS → RESOLVED → CLOSED（CLOSED/RESOLVED 可重开回 OPEN）。
 */

/** 客服工单状态转换 operation（对齐后端 CustomerServiceOperation 子集） */
export const CustomerServiceOperation = {
  START_PROCESSING: 'START_PROCESSING',
  RESOLVE_TICKET: 'RESOLVE_TICKET',
  CLOSE_TICKET: 'CLOSE_TICKET',
  REOPEN_TICKET: 'REOPEN_TICKET',
} as const;

export namespace CloudMoldCustomerServiceCommandApi {
  export interface CommandResult {
    duplicate: boolean;
    operationId: number;
  }
}

function sendCustomerServiceCommand(payload: Record<string, unknown>) {
  const envelope = buildCommandEnvelopeWithRunId();
  return requestClient.post<CloudMoldCustomerServiceCommandApi.CommandResult>(
    '/cloudmold/customer-service/command',
    { ...envelope, ...payload },
  );
}

/** 开始处理：OPEN → IN_PROGRESS */
export function startProcessingTicket(
  ticketId: string,
  expectedVersion: number,
) {
  return sendCustomerServiceCommand({
    expectedVersion,
    operation: CustomerServiceOperation.START_PROCESSING,
    ticketId,
  });
}

/** 解决工单：OPEN/IN_PROGRESS → RESOLVED */
export function resolveTicket(ticketId: string, expectedVersion: number) {
  return sendCustomerServiceCommand({
    expectedVersion,
    operation: CustomerServiceOperation.RESOLVE_TICKET,
    ticketId,
  });
}

/** 关闭工单：RESOLVED → CLOSED */
export function closeTicket(ticketId: string, expectedVersion: number) {
  return sendCustomerServiceCommand({
    expectedVersion,
    operation: CustomerServiceOperation.CLOSE_TICKET,
    ticketId,
  });
}

/** 重开工单：RESOLVED/CLOSED → OPEN */
export function reopenTicket(ticketId: string, expectedVersion: number) {
  return sendCustomerServiceCommand({
    expectedVersion,
    operation: CustomerServiceOperation.REOPEN_TICKET,
    ticketId,
  });
}
