import type { CloudMoldAgentControlApi } from '#/api/cloudmold/agent-control';

interface CatalogDefinition {
  barcode?: string;
  colorName?: string;
  planningCategoryRef?: string;
  planningYear?: number;
  productName?: string;
  seasonCode?: string;
  sizeName?: string;
  skuCode?: string;
  spuCode?: string;
}

interface ApprovalBusinessContext {
  definitions?: CatalogDefinition[];
  lifecycle?: unknown[];
}

type JsonObject = Record<string, unknown>;

export interface ApprovalSkuRow {
  barcode: string;
  color: string;
  key: string;
  size: string;
  skuCode: string;
}

export interface ApprovalPresentation {
  actionTitle: string;
  barcodeCount: number;
  category: string;
  colorNames: string[];
  lifecycleCount: number;
  planningYear?: number;
  productName: string;
  season: string;
  sizeNames: string[];
  skuRows: ApprovalSkuRow[];
  spuCode: string;
}

export interface GenericApprovalPresentation {
  actionTitle: string;
  entries: Array<{ label: string; value: string }>;
  operationCount: number;
  operationNames: string[];
  summary: string;
}

export interface ApprovalDecisionPresentation {
  /** 审批人首先要判断的业务目标。 */
  objective: string;
  /** 通过后会留下的业务结果，而非底层执行参数。 */
  outputs: string[];
  /** 风险来自哪些业务后果，供审批人核对。 */
  riskReason: string;
  title: string;
}

type ApprovalDecisionSource = Pick<
  CloudMoldAgentControlApi.ApprovalDetail,
  'actionCode' | 'riskLevel' | 'roleCode' | 'skillId' | 'title'
>;

const workflowProfiles = [
  {
    match: /bonded-customs|bonded-customs-operations/,
    objective: '核对保税仓关务事项，并按已冻结的单据范围推进申报或处置。',
    outputs: ['关务案件与处理结论', '申报或处置记录', '可追溯的合规审计证据'],
    riskReason:
      '涉及跨境申报、保税货物状态或监管留痕；错误处理可能造成合规风险，因此需要人工确认单据范围与处理边界。',
    title: '保税仓关务处置',
  },
  {
    match: /risk\.dispute|dispute-resolution|risk-dispute/,
    objective: '处理已进入流程的风险争议，形成责任、处置或赔付建议。',
    outputs: ['争议处理结论', '责任与处置建议', '风险事件审计记录'],
    riskReason:
      '可能影响客户权益、商家责任或资金处置；结论需要基于冻结证据由人工复核后才能放行。',
    title: '风险争议处置',
  },
  {
    match: /merchant-service-fee|finance\.|settlement/,
    objective: '核对商家服务费或结算事项，并生成待复核的结算处理结果。',
    outputs: ['结算计算结果', '待确认的费用或调整项', '资金处理审计记录'],
    riskReason:
      '涉及费用、应收应付或商家权益；即使系统计算完成，也必须由人工确认金额范围和适用依据。',
    title: '商家结算复核',
  },
  {
    match: /order-cancellation|cancel.*order/,
    objective: '按冻结条件取消订单，并协调后续库存、支付或履约处置。',
    outputs: ['订单取消结果', '库存或支付处置结果', '订单状态审计记录'],
    riskReason:
      '会改变订单履约承诺，并可能释放库存或触发退款；必须确认取消原因、对象范围和补偿边界。',
    title: '订单取消处置',
  },
  {
    match: /ticket-responsibility|customer-experience|customer-service/,
    objective: '核定客户问题的责任归属，并推进相应的客服或补偿处置。',
    outputs: ['责任认定结果', '客户处置或补偿建议', '服务质量审计记录'],
    riskReason:
      '可能影响客户补偿、商家责任和服务质量指标；需要人工确认事实依据与责任边界。',
    title: '客户体验责任认定',
  },
  {
    match: /category-daily|category-operations|merchandising/,
    objective: '执行类目运营的日常治理动作，并形成待核对的商品或运营状态变化。',
    outputs: ['类目运营处理结果', '商品或运营状态变更记录', '运营决策审计记录'],
    riskReason:
      '可能批量影响商品可售性、运营策略或后续交易链路；需要人工确认影响对象和执行范围。',
    title: '类目运营治理',
  },
] as const;

const unique = (values: Array<string | undefined>) => [
  ...new Set(
    values.filter(
      (value): value is string => value !== undefined && value.length > 0,
    ),
  ),
];

export function buildApprovalPresentation(
  detail?: CloudMoldAgentControlApi.ApprovalDetail,
): ApprovalPresentation | undefined {
  if (!detail?.businessContextJson) return undefined;

  let context: ApprovalBusinessContext;
  try {
    context = JSON.parse(detail.businessContextJson) as ApprovalBusinessContext;
  } catch {
    return undefined;
  }
  const definitions = Array.isArray(context.definitions)
    ? context.definitions
    : [];
  if (definitions.length === 0) return undefined;

  const first = definitions[0] ?? {};
  const productName = first.productName || first.spuCode || '待创建新品';
  const skuRows = definitions.map((item, index) => ({
    barcode: item.barcode || '-',
    color: item.colorName || '-',
    key: item.skuCode || `sku-${index}`,
    size: item.sizeName || '-',
    skuCode: item.skuCode || '-',
  }));
  return {
    actionTitle: `创建并启用新品“${productName}”`,
    barcodeCount: unique(definitions.map((item) => item.barcode)).length,
    category: first.planningCategoryRef?.split(':').at(-1) || '-',
    colorNames: unique(definitions.map((item) => item.colorName)),
    lifecycleCount: Array.isArray(context.lifecycle)
      ? context.lifecycle.length
      : 0,
    planningYear: first.planningYear,
    productName,
    season: first.seasonCode || '-',
    sizeNames: unique(definitions.map((item) => item.sizeName)),
    skuRows,
    spuCode: first.spuCode || '-',
  };
}

/**
 * Makes every valid, frozen workflow input reviewable. Catalog inputs keep their
 * richer presentation above; other domains expose only their business boundary
 * and planned operations, never raw execution credentials or idempotency data.
 */
export function buildGenericApprovalPresentation(
  detail?: CloudMoldAgentControlApi.ApprovalDetail,
): GenericApprovalPresentation | undefined {
  if (!detail?.businessContextJson) return undefined;

  let context: unknown;
  try {
    context = JSON.parse(detail.businessContextJson) as unknown;
  } catch {
    return undefined;
  }
  if (!isJsonObject(context)) return undefined;

  const commands = Array.isArray(context.commands) ? context.commands : [];
  const operationNames = unique(
    commands.map((command) =>
      isJsonObject(command) && typeof command.operation === 'string'
        ? command.operation
        : undefined,
    ),
  );
  const entries = Object.entries(context)
    .filter(
      ([key, value]) =>
        key !== 'commands' &&
        key !== 'definitions' &&
        key !== 'lifecycle' &&
        !isSensitiveKey(key) &&
        isDisplayable(value),
    )
    .slice(0, 6)
    .map(([key, value]) => ({ label: humanizeKey(key), value: String(value) }));
  const lifecycleCount = Array.isArray(context.lifecycle)
    ? context.lifecycle.length
    : 0;
  const operationCount = commands.length > 0 ? commands.length : lifecycleCount;
  const boundary =
    operationNames.length > 0
      ? `将依次执行：${operationNames.slice(0, 6).join('、')}${operationNames.length > 6 ? ' 等' : ''}`
      : '已冻结本次业务输入与影响范围';

  return {
    actionTitle: detail.title || '已冻结的高风险业务动作',
    entries,
    operationCount,
    operationNames,
    summary:
      operationCount > 0
        ? `本次将执行 ${operationCount} 个已冻结的业务步骤；${boundary}。`
        : boundary,
  };
}

/**
 * Turns a policy-controlled workflow into the three answers an approver needs:
 * what will happen, what evidence/output will remain, and why human approval is
 * required. The source is only the frozen policy identity; no raw command input
 * or credentials are exposed.
 */
export function buildApprovalDecisionPresentation(
  source?: ApprovalDecisionSource,
): ApprovalDecisionPresentation | undefined {
  if (!source) return undefined;

  const identity = [
    source.skillId,
    source.actionCode,
    source.roleCode,
    source.title,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  const profile = workflowProfiles.find((candidate) =>
    candidate.match.test(identity),
  );
  if (profile) return { ...profile, outputs: [...profile.outputs] };

  const riskReason =
    source.riskLevel === 'R3'
      ? '该动作会跨越业务边界写入正式记录，可能影响资金、合规、客户权益或关键业务状态；必须确认冻结范围后才能放行。'
      : '该动作会写入正式业务记录或推进关键状态；需要人工确认业务对象、影响范围和执行边界。';
  return {
    objective: '按已冻结的业务范围执行受控运营动作。',
    outputs: ['业务处理结果', '状态变更记录', '可追溯的审计证据'],
    riskReason,
    title: source.title || '高风险业务动作',
  };
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDisplayable(value: unknown): value is boolean | number | string {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

function isSensitiveKey(key: string): boolean {
  return /(credential|idempotency|lease.*token|password|secret|token|run.?id|operator|principal)/i.test(
    key,
  );
}

function humanizeKey(value: string): string {
  return value
    .replaceAll(/([A-Z])/g, ' $1')
    .replaceAll('_', ' ')
    .trim();
}
