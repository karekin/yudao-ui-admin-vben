import type {
  CloudMoldProcurementApi,
  Int64String,
} from '#/api/cloudmold/procurement';

export type ProcurementRow =
  | CloudMoldProcurementApi.AwardPageItem
  | CloudMoldProcurementApi.PurchaseOrderPageItem
  | CloudMoldProcurementApi.QuotationPageItem
  | CloudMoldProcurementApi.RequisitionPageItem
  | CloudMoldProcurementApi.RfqPageItem;

export interface ProcurementAction {
  danger?: boolean;
  label: string;
  permission: string;
  reasonRequired?: boolean;
  operation:
    | CloudMoldProcurementApi.PurchaseOrderOperation
    | CloudMoldProcurementApi.SourcingOperation;
}

const statusLabels: Record<string, string> = {
  APPROVED: '已批准',
  AWARDED: '已定标',
  AWARD_SUBMITTED: '定标待审批',
  CANCELLED: '已取消',
  CLOSED: '已关闭',
  COMPLETED: '已完成',
  DISPATCHED: '已发送供应商',
  DRAFT: '草稿',
  EVALUATING: '评审中',
  EXCEPTION: '评审异常',
  PARTIALLY_RECEIVED: '部分收货',
  PUBLISHED: '已发布',
  QUOTING: '报价中',
  REJECTED: '已驳回',
  RELEASED: '已生效',
  SUBMITTED: '待审批',
  SUPPLIER_CONFIRMED: '供应商已确认',
  WITHDRAWN: '已撤回',
};

export function procurementStatusMeta(status: string) {
  let color = 'processing';
  if (
    [
      'APPROVED',
      'AWARDED',
      'CLOSED',
      'COMPLETED',
      'SUPPLIER_CONFIRMED',
    ].includes(status)
  ) {
    color = 'success';
  }
  if (['EXCEPTION', 'REJECTED'].includes(status)) color = 'error';
  if (['CANCELLED', 'PARTIALLY_RECEIVED'].includes(status)) color = 'warning';
  return { color, label: statusLabels[status] ?? status };
}

const actionMatrix: Record<
  CloudMoldProcurementApi.ProcurementWorkspace,
  Record<string, ProcurementAction[]>
> = {
  AWARD: {
    DRAFT: [
      {
        label: '提交定标',
        operation: 'SUBMIT_AWARD',
        permission: 'cloudmold:procurement:award:submit',
      },
    ],
    SUBMITTED: [
      {
        label: '批准定标',
        operation: 'APPROVE_AWARD',
        permission: 'cloudmold:procurement:award:approve',
      },
      {
        danger: true,
        label: '驳回定标',
        operation: 'REJECT_AWARD',
        permission: 'cloudmold:procurement:award:approve',
        reasonRequired: true,
      },
    ],
  },
  PURCHASE_ORDER: {
    APPROVED: [
      {
        label: '生效订单',
        operation: 'RELEASE_PURCHASE_ORDER',
        permission: 'cloudmold:procurement:order:release',
      },
      {
        danger: true,
        label: '取消订单',
        operation: 'CANCEL_PURCHASE_ORDER',
        permission: 'cloudmold:procurement:order:write',
        reasonRequired: true,
      },
    ],
    DISPATCHED: [
      {
        label: '供应商确认',
        operation: 'SUPPLIER_CONFIRM_PURCHASE_ORDER',
        permission: 'cloudmold:procurement:order:write',
      },
      {
        danger: true,
        label: '取消订单',
        operation: 'CANCEL_PURCHASE_ORDER',
        permission: 'cloudmold:procurement:order:write',
        reasonRequired: true,
      },
    ],
    DRAFT: [
      {
        label: '提交审批',
        operation: 'SUBMIT_PURCHASE_ORDER',
        permission: 'cloudmold:procurement:order:write',
      },
      {
        danger: true,
        label: '取消订单',
        operation: 'CANCEL_PURCHASE_ORDER',
        permission: 'cloudmold:procurement:order:write',
        reasonRequired: true,
      },
    ],
    RELEASED: [
      {
        label: '发送供应商',
        operation: 'DISPATCH_PURCHASE_ORDER',
        permission: 'cloudmold:procurement:order:write',
      },
      {
        danger: true,
        label: '取消订单',
        operation: 'CANCEL_PURCHASE_ORDER',
        permission: 'cloudmold:procurement:order:write',
        reasonRequired: true,
      },
    ],
    SUBMITTED: [
      {
        label: '批准订单',
        operation: 'APPROVE_PURCHASE_ORDER',
        permission: 'cloudmold:procurement:order:write',
      },
      {
        danger: true,
        label: '取消订单',
        operation: 'CANCEL_PURCHASE_ORDER',
        permission: 'cloudmold:procurement:order:write',
        reasonRequired: true,
      },
    ],
    SUPPLIER_CONFIRMED: [
      {
        label: '关闭订单',
        operation: 'CLOSE_PURCHASE_ORDER',
        permission: 'cloudmold:procurement:order:write',
      },
      {
        danger: true,
        label: '取消订单',
        operation: 'CANCEL_PURCHASE_ORDER',
        permission: 'cloudmold:procurement:order:write',
        reasonRequired: true,
      },
    ],
  },
  QUOTATION: {},
  REQUISITION: {},
  RFQ: {
    AWARDED: [
      {
        label: '关闭寻源',
        operation: 'CLOSE_SOURCING_EVENT',
        permission: 'cloudmold:procurement:sourcing:write',
      },
    ],
    DRAFT: [
      {
        label: '发布询价',
        operation: 'PUBLISH_SOURCING_EVENT',
        permission: 'cloudmold:procurement:sourcing:write',
      },
      {
        danger: true,
        label: '取消寻源',
        operation: 'CANCEL_SOURCING_EVENT',
        permission: 'cloudmold:procurement:sourcing:write',
        reasonRequired: true,
      },
    ],
    EVALUATING: [
      {
        danger: true,
        label: '取消寻源',
        operation: 'CANCEL_SOURCING_EVENT',
        permission: 'cloudmold:procurement:sourcing:write',
        reasonRequired: true,
      },
    ],
    PUBLISHED: [
      {
        label: '开放报价',
        operation: 'OPEN_QUOTING',
        permission: 'cloudmold:procurement:sourcing:write',
      },
      {
        danger: true,
        label: '取消寻源',
        operation: 'CANCEL_SOURCING_EVENT',
        permission: 'cloudmold:procurement:sourcing:write',
        reasonRequired: true,
      },
    ],
    QUOTING: [
      {
        label: '关闭报价',
        operation: 'CLOSE_QUOTING',
        permission: 'cloudmold:procurement:sourcing:write',
      },
      {
        danger: true,
        label: '取消寻源',
        operation: 'CANCEL_SOURCING_EVENT',
        permission: 'cloudmold:procurement:sourcing:write',
        reasonRequired: true,
      },
    ],
  },
};

export function procurementActions(
  workspace: CloudMoldProcurementApi.ProcurementWorkspace,
  status: string,
): ProcurementAction[] {
  return actionMatrix[workspace][status] ?? [];
}

export function formatMinorMoney(
  amountMinor: Int64String,
  currencyCode: string,
) {
  if (!/^-?\d+$/.test(amountMinor)) return `${currencyCode} ${amountMinor}`;
  const negative = amountMinor.startsWith('-');
  const digits = (negative ? amountMinor.slice(1) : amountMinor).padStart(
    3,
    '0',
  );
  const units = digits.slice(0, -2).replaceAll(/\B(?=(\d{3})+(?!\d))/g, ',');
  const cents = digits.slice(-2);
  const symbol = { CNY: '¥', EUR: '€', JPY: '¥', USD: 'US$' }[currencyCode];
  const prefix = symbol ?? `${currencyCode} `;
  return `${negative ? '-' : ''}${prefix}${units}.${cents}`;
}

export function procurementRowId(
  workspace: CloudMoldProcurementApi.ProcurementWorkspace,
  row: ProcurementRow,
) {
  if (workspace === 'REQUISITION') {
    return (row as CloudMoldProcurementApi.RequisitionPageItem).requisitionId;
  }
  if (workspace === 'RFQ') {
    return (row as CloudMoldProcurementApi.RfqPageItem).eventId;
  }
  if (workspace === 'QUOTATION') {
    return (row as CloudMoldProcurementApi.QuotationPageItem).quotationId;
  }
  if (workspace === 'AWARD') {
    return (row as CloudMoldProcurementApi.AwardPageItem).awardId;
  }
  return (row as CloudMoldProcurementApi.PurchaseOrderPageItem).orderId;
}
