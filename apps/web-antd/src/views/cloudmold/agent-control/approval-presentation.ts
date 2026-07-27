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
