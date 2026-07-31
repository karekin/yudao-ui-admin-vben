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
  const operationCount =
    commands.length > 0
      ? commands.length
      : Array.isArray(context.lifecycle)
        ? context.lifecycle.length
        : 0;
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
  return /(credential|idempotency|lease.*token|password|secret|token)/i.test(
    key,
  );
}

function humanizeKey(value: string): string {
  return value
    .replaceAll(/([A-Z])/g, ' $1')
    .replaceAll('_', ' ')
    .trim();
}
