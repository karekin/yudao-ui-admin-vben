/**
 * CloudMold 写命令通用 envelope 工具。
 *
 * 后端各写模块（promotion/engagement/...）的 validateEnvelope / validateCommon
 * 均强制要求 idempotencyKey / correlationId / occurredAt，抽到 shared 供所有写命令
 * 领域复用，避免每个领域重复 crypto.randomUUID / new Date。
 */

/** 生成通用命令 envelope：幂等键（UUID v4）+ 追踪 ID + 发生时间（ISO Instant） */
export function buildCommandEnvelope(): {
  correlationId: string;
  idempotencyKey: string;
  occurredAt: string;
} {
  return {
    correlationId: crypto.randomUUID(),
    idempotencyKey: crypto.randomUUID(),
    occurredAt: new Date().toISOString(),
  };
}

/**
 * commerce 三领域（fulfillment/order/aftersale）envelope：额外强制 runId（≤64）。
 * 后端 validateCommon 强制 operation/idempotencyKey/runId/occurredAt/correlationId。
 */
export function buildCommandEnvelopeWithRunId(): {
  correlationId: string;
  idempotencyKey: string;
  occurredAt: string;
  runId: string;
} {
  return {
    ...buildCommandEnvelope(),
    runId: crypto.randomUUID(),
  };
}
