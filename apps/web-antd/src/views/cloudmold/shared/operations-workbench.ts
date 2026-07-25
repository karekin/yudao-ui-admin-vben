export interface WorkbenchItem {
  businessDate?: string;
  code?: string;
  dueDate?: string;
  itemType: string;
  relatedRef?: string;
  status: string;
  updatedAt?: string;
}

export interface WorkbenchMeta {
  color: string;
  label: string;
}

export const statusMeta: Record<string, WorkbenchMeta> = {
  ACKNOWLEDGED: { color: 'blue', label: '已认领' },
  ACTIVE: { color: 'green', label: '有效' },
  APPROVED: { color: 'green', label: '已批准' },
  ASSIGNED: { color: 'blue', label: '已分派' },
  CANCELLED: { color: 'default', label: '已取消' },
  COMPLETED: { color: 'green', label: '已完成' },
  CONFLICTED: { color: 'red', label: '判定冲突' },
  CONVERTED: { color: 'cyan', label: '已转单' },
  CREATED: { color: 'default', label: '待分派' },
  DECIDED: { color: 'purple', label: '待复核' },
  DRAFT: { color: 'default', label: '草稿' },
  EVALUATED: { color: 'purple', label: '已测算' },
  IN_PROGRESS: { color: 'processing', label: '处理中' },
  OPEN: { color: 'red', label: '待处理' },
  PROPOSED: { color: 'orange', label: '待决策' },
  PUBLISHED: { color: 'green', label: '已发布' },
  RECHECK_REQUIRED: { color: 'orange', label: '待复检' },
  REJECTED: { color: 'red', label: '已拒绝' },
  RELEASED: { color: 'cyan', label: '已下达' },
  RESOLVED: { color: 'green', label: '已解决' },
  REVOKED: { color: 'red', label: '已撤销' },
  SELECTED: { color: 'blue', label: '已选定' },
  VERIFIED: { color: 'green', label: '已验证' },
};

export const supplyItemMeta: Record<string, WorkbenchMeta> = {
  FORECAST: { color: 'blue', label: '需求预测' },
  FORECAST_EVALUATION: { color: 'purple', label: '预测回测' },
  INVENTORY_ISSUE: { color: 'red', label: '库存异常' },
  INVENTORY_SCAN: { color: 'cyan', label: '健康扫描' },
  PLAN_SCENARIO: { color: 'purple', label: '计划情景' },
  REPLENISHMENT: { color: 'orange', label: '补货建议' },
  SUPPLY_PLAN: { color: 'green', label: 'S&OP 计划' },
};

export const qualityItemMeta: Record<string, WorkbenchMeta> = {
  CAPA: { color: 'orange', label: '整改措施' },
  CERTIFICATION: { color: 'cyan', label: '鉴别师资质' },
  INSPECTION_TASK: { color: 'blue', label: '质检任务' },
  RECALL_ACTION: { color: 'red', label: '召回行动' },
  STANDARD: { color: 'purple', label: '鉴别标准' },
};

export function getWorkbenchMeta(
  metadata: Record<string, WorkbenchMeta>,
  value: string,
): WorkbenchMeta {
  return (
    metadata[value] ?? {
      color: 'default',
      label: value.replaceAll('_', ' '),
    }
  );
}

export function matchesWorkbenchItem(
  item: WorkbenchItem,
  keyword: string,
): boolean {
  const normalizedKeyword = keyword.trim().toLocaleLowerCase();
  if (!normalizedKeyword) return true;
  return [
    item.businessDate,
    item.code,
    item.dueDate,
    item.itemType,
    item.relatedRef,
    item.status,
  ].some((value) => value?.toLocaleLowerCase().includes(normalizedKeyword));
}

export function shortReference(value?: string, visibleLength = 10): string {
  if (!value) return '—';
  if (value.length <= visibleLength * 2 + 1) return value;
  return `${value.slice(0, visibleLength)}…${value.slice(-6)}`;
}
