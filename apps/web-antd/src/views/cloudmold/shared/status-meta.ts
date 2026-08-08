export interface CloudMoldStatusMeta {
  color: string;
  label: string;
}

const enumLabels: Record<string, string> = {
  ACCEPTED: '已接受',
  ACTIVE: '生效',
  ACTIVITY: '活动',
  ADS: '数据应用',
  ADVERTISING: '广告',
  ALLOCATABLE: '可分配',
  APPROVAL: '审批',
  APPROVED: '已通过',
  ARCHIVED: '已归档',
  BUSINESS: '业务',
  BUSINESS_APPROVED: '业务审核通过',
  BUYER: '买家',
  CANCEL: '订单取消',
  CANCELLATION_PENDING: '取消处理中',
  CARRIER: '承运商',
  CANCELLED: '已取消',
  CAPTURED: '已收款',
  CDC: '数据同步',
  CLOSED: '已关闭',
  CNY: '人民币（CNY）',
  COMPLETED: '已完成',
  COMPLETION_PASSED: '资料校验通过',
  CONNECTED: '已接入',
  CREATED: '待发货',
  CONVERTED: '已转化',
  DAMAGED: '残次',
  DECIDED: '已决策',
  DELIVERED: '已送达',
  DISABLED: '已停用',
  DISMISS: '忽略',
  DRAFT: '草稿',
  DISCOVERY: '需求发现',
  DQC: '质量检查',
  ERROR: '异常',
  ESCALATE: '升级处理',
  EXITING: '退出中',
  EXPIRED: '已过期',
  FAILED: '失败',
  FULFILLMENT: '履约仓',
  GENERAL: '一般',
  HANDOFF: '已交接',
  HEALTHY: '正常',
  INACTIVE: '停用',
  INTERNAL_TEST: '内部测试',
  INVENTORY_RESERVED: '库存已锁定',
  IllegalArgumentException: '参数校验失败',
  IN_PROGRESS: '处理中',
  IN_POOL: '公海待认领',
  IN_REVIEW: '审核中',
  IN_TRANSIT: '运输中',
  INSPECTION_ACCEPTED: '退货验收通过',
  MEMBER: '会员',
  MERCHANT: '商家',
  MERCHANT_OPERATOR: '商家操作员',
  MIGRATION_OPENING: '迁移开账',
  MONITOR: '持续观察',
  NONE: '无',
  NON_SELLABLE: '不可售',
  NOT_CONNECTED: '未接入',
  OPEN: '待处理',
  PARTIALLY_REFUNDED: '部分退款',
  PAUSED: '已暂停',
  PAYMENT_CONFIRMED: '支付已确认',
  PIECE: '件',
  PCS: '件',
  PENDING: '待处理',
  PENDING_ACTIVATION: '待激活',
  PENDING_QC: '待质检',
  PLACED: '已下单',
  PLATFORM_OPERATOR: '平台操作员',
  PLATFORM: '平台',
  PUBLISHED: '已发布',
  PURCHASE_RECEIPT: '采购入库',
  QUALIFIED: '合格',
  QUALIFICATION: '资格确认',
  QUALIFYING: '资格评估中',
  READY: '就绪',
  RECEIVE: '收货入库',
  REFUNDED: '已退款',
  REJECTED: '已驳回',
  RELEASE: '释放预占',
  REQUESTED: '待审核',
  RESERVE: '库存预占',
  RESOLUTION_PENDING: '售后处理中',
  RESOLVED: '已解决',
  RESTRICTED: '受限',
  RETURN: '退货入库',
  RETURN_ONLY: '仅退货',
  RETURN_REFUND: '退货退款',
  RETURN_AND_REFUND: '退货退款',
  RETURNED: '已退货',
  REVOKED: '已撤销',
  RISK_APPROVED: '风控审核通过',
  SALE_RETURN: '销售退货',
  SELLABLE: '可售',
  SHIP: '销售出库',
  SHIPMENT: '发货',
  SHIPPED: '已发货',
  SINGLE: '单边分录',
  SIZE_NOT_FIT: '尺码不合适',
  SMS: '短信',
  STALE: '数据过期',
  SUBMITTED: '已提交审核',
  SUCCEEDED: '成功',
  SUSPENDED: '已冻结',
  SYSTEM: '系统',
  SYSTEM_ADMIN_USER: '系统管理员',
  TRADE_ORDER: '交易订单',
  UNKNOWN: '未知',
  UNHEALTHY: '异常',
  UNPUBLISHED: '已下架',
  WARNING: '需关注',
  OWNED: '已分配',
  PROPOSAL: '方案报价',
  NEGOTIATION: '商务谈判',
  CLOSED_WON: '赢单',
  WAREHOUSE_OPERATOR: '仓库操作员',
  YSHOPPING_INTERNAL: '语兴好物（内部渠道）',
  LOT_RECALLED: '批次已召回',
};

const successStates = new Set([
  'ACCEPTED',
  'ACTIVE',
  'APPROVED',
  'BUSINESS_APPROVED',
  'CAPTURED',
  'COMPLETED',
  'COMPLETION_PASSED',
  'CONNECTED',
  'DELIVERED',
  'HEALTHY',
  'INSPECTION_ACCEPTED',
  'PUBLISHED',
  'QUALIFIED',
  'READY',
  'REFUNDED',
  'RESOLVED',
  'RISK_APPROVED',
  'SELLABLE',
]);

const errorStates = new Set(['ERROR', 'FAILED', 'REJECTED', 'UNHEALTHY']);

const warningStates = new Set([
  'ARCHIVED',
  'CANCELLED',
  'EXPIRED',
  'INACTIVE',
  'NON_SELLABLE',
  'NOT_CONNECTED',
  'PAUSED',
  'RESTRICTED',
  'RETURNED',
  'REVOKED',
  'STALE',
  'SUSPENDED',
  'UNPUBLISHED',
  'WARNING',
]);

export function cloudMoldEnumLabel(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  const text = String(value);
  const translated = enumLabels[text];
  if (translated) {
    return translated;
  }
  if (!/^[A-Z][A-Z0-9_]*$/.test(text)) {
    return text;
  }
  return `未知（${text}）`;
}

export function cloudMoldStatusMeta(value: unknown): CloudMoldStatusMeta {
  const code = String(value ?? 'UNKNOWN');
  let color = 'processing';
  if (successStates.has(code)) color = 'success';
  else if (errorStates.has(code)) color = 'error';
  else if (warningStates.has(code)) color = 'warning';
  else if (code === 'UNKNOWN') color = 'default';
  return { color, label: cloudMoldEnumLabel(code) };
}
