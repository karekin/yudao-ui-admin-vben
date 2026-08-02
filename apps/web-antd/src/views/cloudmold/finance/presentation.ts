import type { CloudMoldFinanceApi, Int64String } from '#/api/cloudmold/finance';

export type FinanceWorkspace =
  | 'AP'
  | 'INVOICE'
  | 'JOURNAL'
  | 'MATCH_EXCEPTION'
  | 'PAYMENT';

export type FinanceRow =
  | CloudMoldFinanceApi.ApInstallmentPageItem
  | CloudMoldFinanceApi.JournalPageItem
  | CloudMoldFinanceApi.MatchExceptionPageItem
  | CloudMoldFinanceApi.SupplierInvoicePageItem
  | CloudMoldFinanceApi.SupplierPaymentPageItem;

export interface FinanceAction {
  kind:
    | 'DIRECT'
    | 'MATCH_OVERRIDE'
    | 'REVERSE_JOURNAL'
    | 'RUN_MATCH'
    | 'SETTLE_PAYMENT';
  label: string;
  operation: string;
}

const statusLabels: Record<string, string> = {
  APPROVED: '已批准',
  DRAFT: '草稿',
  EXCEPTION: '匹配异常',
  EXECUTED: '已执行',
  MATCHED: '匹配通过',
  OPEN: '待处理',
  PAID: '已付清',
  PARTIALLY_PAID: '部分付款',
  POSTED: '已过账',
  RELEASED: '已释放',
  REVERSED: '已反冲',
  SETTLED: '已结算',
  SUBMITTED: '待匹配',
};

export function financeStatusMeta(status: string) {
  let color = 'processing';
  if (['MATCHED', 'PAID', 'POSTED', 'SETTLED'].includes(status)) {
    color = 'success';
  }
  if (status === 'EXCEPTION') color = 'error';
  if (['PARTIALLY_PAID', 'REVERSED'].includes(status)) color = 'warning';
  return { color, label: statusLabels[status] ?? status };
}

export function financeActions(
  workspace: FinanceWorkspace,
  status: string,
): FinanceAction[] {
  if (workspace === 'INVOICE') {
    const invoiceActions: Partial<Record<string, FinanceAction[]>> = {
      APPROVED: [
        { kind: 'DIRECT', label: '过账', operation: 'POST_SUPPLIER_INVOICE' },
      ],
      DRAFT: [
        {
          kind: 'DIRECT',
          label: '提交',
          operation: 'SUBMIT_SUPPLIER_INVOICE',
        },
      ],
      MATCHED: [
        {
          kind: 'DIRECT',
          label: '批准',
          operation: 'APPROVE_SUPPLIER_INVOICE',
        },
      ],
      SUBMITTED: [
        {
          kind: 'RUN_MATCH',
          label: '三单匹配',
          operation: 'RUN_THREE_WAY_MATCH',
        },
      ],
    };
    return invoiceActions[status] ?? [];
  }
  if (workspace === 'MATCH_EXCEPTION' && status === 'OPEN') {
    return [
      {
        kind: 'MATCH_OVERRIDE',
        label: '审批例外',
        operation: 'APPROVE_MATCH_OVERRIDE',
      },
    ];
  }
  if (workspace === 'PAYMENT') {
    const paymentActions: Partial<Record<string, FinanceAction[]>> = {
      APPROVED: [
        {
          kind: 'DIRECT',
          label: '释放付款',
          operation: 'RELEASE_SUPPLIER_PAYMENT',
        },
      ],
      DRAFT: [
        {
          kind: 'DIRECT',
          label: '批准付款',
          operation: 'APPROVE_SUPPLIER_PAYMENT',
        },
      ],
      EXECUTED: [
        {
          kind: 'SETTLE_PAYMENT',
          label: '登记结算',
          operation: 'SETTLE_SUPPLIER_PAYMENT',
        },
      ],
    };
    return paymentActions[status] ?? [];
  }
  if (workspace === 'JOURNAL' && status === 'POSTED') {
    return [
      { kind: 'REVERSE_JOURNAL', label: '反冲', operation: 'REVERSE_JOURNAL' },
    ];
  }
  return [];
}

export function addInt64Strings(values: Int64String[]): Int64String {
  let total = 0n;
  for (const value of values) total += BigInt(value);
  return total.toString();
}

export function subtractInt64Strings(
  minuend: Int64String,
  subtrahend: Int64String,
): Int64String {
  return (BigInt(minuend) - BigInt(subtrahend)).toString();
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

export function financeRowId(workspace: FinanceWorkspace, row: FinanceRow) {
  if (workspace === 'INVOICE')
    return (row as CloudMoldFinanceApi.SupplierInvoicePageItem)
      .supplierInvoiceId;
  if (workspace === 'MATCH_EXCEPTION')
    return (row as CloudMoldFinanceApi.MatchExceptionPageItem).exceptionId;
  if (workspace === 'AP')
    return (row as CloudMoldFinanceApi.ApInstallmentPageItem).apOpenItemId;
  if (workspace === 'PAYMENT')
    return (row as CloudMoldFinanceApi.SupplierPaymentPageItem)
      .paymentInstructionId;
  return (row as CloudMoldFinanceApi.JournalPageItem).journalEntryId;
}

export function isBalancedJournal(row: CloudMoldFinanceApi.JournalPageItem) {
  return (
    BigInt(row.totalDebitAmountMinor) === BigInt(row.totalCreditAmountMinor)
  );
}
