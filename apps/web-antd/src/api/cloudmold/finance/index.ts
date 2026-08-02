import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

import { buildCommandEnvelopeWithRunId } from '../command-helpers';

/** JSON representation of a signed 64-bit integer; never deserialize as number. */
export type Int64String = string;

export namespace CloudMoldFinanceApi {
  export interface PageParams extends PageParam {
    keyword?: string;
    status?: string;
  }

  export interface Money {
    amountMinor: Int64String;
    currencyCode: string;
  }

  export interface InvoiceLineage {
    deliveryScheduleId?: string;
    invoiceLineId: string;
    inventoryMovementId?: string;
    purchaseOrderId: string;
    purchaseOrderItemId: string;
    qualityDispositionId?: string;
    receiptLineId?: string;
  }

  export interface SupplierInvoicePageItem {
    aggregateVersion: number;
    accountingDate: string;
    currencyCode: string;
    dueDate: string;
    exceptionCount: number;
    grossAmountMinor: Int64String;
    invoiceCode: string;
    matchStatus: string;
    postedAt?: string;
    status: string;
    supplierId: string;
    supplierInvoiceId: string;
    supplierInvoiceNumber: string;
    updatedAt: string;
  }

  export interface SupplierInvoiceMatchLine {
    acceptedReceiptQuantity: string;
    canonicalSkuId: string;
    differenceAmountMinor: Int64String;
    differenceType?: 'NONE' | 'PRICE' | 'QUANTITY' | 'TAX';
    invoiceLineId: string;
    invoiceQuantity: string;
    invoiceUnitNetPriceMinor: string;
    lineGrossAmountMinor: Int64String;
    lineNumber: number;
    lineage: InvoiceLineage;
    purchaseOrderUnitNetPriceMinor: string;
    uomCode: string;
  }

  export interface SupplierInvoiceDetail extends SupplierInvoicePageItem {
    accountingPeriodId: string;
    apInstallments: ApInstallmentPageItem[];
    invoiceLines: SupplierInvoiceMatchLine[];
    issueDate: string;
    journalEntryIds: string[];
    legalEntityId: string;
    matchPolicyId?: string;
    matchPolicyVersion?: number;
    matchRunId?: string;
    netAmountMinor: Int64String;
    paymentConditionCode: string;
    paymentInstructions: SupplierPaymentPageItem[];
    taxAmountMinor: Int64String;
  }

  export interface MatchExceptionPageItem {
    aggregateVersion: number;
    actualAmountMinor?: Int64String;
    actualQuantity?: string;
    currencyCode: string;
    exceptionCode: string;
    exceptionId: string;
    expectedAmountMinor?: Int64String;
    expectedQuantity?: string;
    exceptionType: 'MISSING_EVIDENCE' | 'PRICE' | 'QUANTITY' | 'TAX';
    invoiceCode: string;
    invoiceLineId: string;
    matchRunId: string;
    status: string;
    supplierInvoiceId: string;
    updatedAt: string;
  }

  export interface ApInstallmentPageItem {
    apOpenItemId: string;
    currencyCode: string;
    dueDate: string;
    installmentNumber: number;
    invoiceCode: string;
    openAmountMinor: Int64String;
    originalAmountMinor: Int64String;
    paidAmountMinor: Int64String;
    status: string;
    supplierId: string;
    supplierInvoiceId: string;
    updatedAt: string;
  }

  export interface SupplierPaymentPageItem {
    aggregateVersion: number;
    allocatedAmountMinor: Int64String;
    currencyCode: string;
    executedAt?: string;
    paymentCode: string;
    paymentInstructionId: string;
    requestedExecutionDate: string;
    settledAmountMinor: Int64String;
    status: string;
    supplierId: string;
    totalAmountMinor: Int64String;
    updatedAt: string;
  }

  export interface JournalLine {
    accountCode: string;
    accountName: string;
    creditAmountMinor: Int64String;
    debitAmountMinor: Int64String;
    dimensions: Array<{
      dimensionType: string;
      dimensionValue: string;
    }>;
    journalLineId: string;
    lineNumber: number;
  }

  export interface JournalPageItem {
    accountingDate: string;
    aggregateVersion: number;
    currencyCode: string;
    journalCode: string;
    journalEntryId: string;
    journalType: string;
    postedAt?: string;
    reversedByJournalEntryId?: string;
    sourceAggregateId: string;
    sourceAggregateType: string;
    status: string;
    totalCreditAmountMinor: Int64String;
    totalDebitAmountMinor: Int64String;
    updatedAt: string;
  }

  export interface JournalDetail extends JournalPageItem {
    lines: JournalLine[];
    originalJournalEntryId?: string;
    postingEvidenceSha256: string;
  }

  export interface CommandResult {
    aggregateId: string;
    aggregateType: string;
    aggregateVersion: number;
    apOpenItemId?: string;
    duplicate: boolean;
    exceptionId?: string;
    journalEntryId?: string;
    matchRunId?: string;
    operationId: Int64String;
    paymentInstructionId?: string;
    status: string;
    supplierInvoiceId?: string;
  }

  export type SupplierInvoiceOperation =
    | 'APPROVE_SUPPLIER_INVOICE'
    | 'POST_SUPPLIER_INVOICE'
    | 'RUN_THREE_WAY_MATCH'
    | 'SUBMIT_SUPPLIER_INVOICE';

  export interface InvoiceTransitionCommand {
    expectedVersion: number;
    operation: Exclude<SupplierInvoiceOperation, 'RUN_THREE_WAY_MATCH'>;
    reasonCode?: string;
    supplierInvoiceId: string;
  }

  export interface RunMatchCommand {
    expectedVersion: number;
    matchPolicyId: string;
    matchPolicyVersion: number;
    operation: 'RUN_THREE_WAY_MATCH';
    supplierInvoiceId: string;
  }

  export interface ApproveMatchOverrideCommand {
    exceptionId: string;
    expectedVersion: number;
    operation: 'APPROVE_MATCH_OVERRIDE';
    reasonCode: string;
    resolutionEvidenceSha256: string;
  }

  export type PaymentOperation =
    | 'APPROVE_SUPPLIER_PAYMENT'
    | 'RELEASE_SUPPLIER_PAYMENT';

  export interface PaymentTransitionCommand {
    expectedVersion: number;
    operation: PaymentOperation;
    paymentInstructionId: string;
    reasonCode?: string;
  }

  export interface SettlePaymentCommand {
    bankReference: string;
    currencyCode: string;
    expectedVersion: number;
    operation: 'SETTLE_SUPPLIER_PAYMENT';
    paymentInstructionId: string;
    settledAmountMinor: Int64String;
    settlementDate: string;
    settlementEvidenceSha256: string;
    settlementId: string;
  }

  export interface ReverseJournalCommand {
    accountingDate: string;
    accountingPeriodId: string;
    expectedVersion: number;
    operation: 'REVERSE_JOURNAL';
    originalJournalEntryId: string;
    reasonCode: string;
    reversalEvidenceSha256: string;
    reversalJournalCode: string;
    reversalJournalEntryId: string;
  }
}

const ROOT = '/cloudmold/finance/procure-to-pay';

export function getSupplierInvoicePage(params: CloudMoldFinanceApi.PageParams) {
  return requestClient.get<
    PageResult<CloudMoldFinanceApi.SupplierInvoicePageItem>
  >(`${ROOT}/supplier-invoices/page`, { params });
}

export function getSupplierInvoice(supplierInvoiceId: string) {
  return requestClient.get<CloudMoldFinanceApi.SupplierInvoiceDetail>(
    `${ROOT}/supplier-invoices/${encodeURIComponent(supplierInvoiceId)}`,
  );
}

export function getMatchExceptionPage(params: CloudMoldFinanceApi.PageParams) {
  return requestClient.get<
    PageResult<CloudMoldFinanceApi.MatchExceptionPageItem>
  >(`${ROOT}/match-exceptions/page`, { params });
}

export function getApInstallmentPage(params: CloudMoldFinanceApi.PageParams) {
  return requestClient.get<
    PageResult<CloudMoldFinanceApi.ApInstallmentPageItem>
  >(`${ROOT}/ap-installments/page`, { params });
}

export function getSupplierPaymentPage(params: CloudMoldFinanceApi.PageParams) {
  return requestClient.get<
    PageResult<CloudMoldFinanceApi.SupplierPaymentPageItem>
  >(`${ROOT}/supplier-payments/page`, { params });
}

export function getJournalPage(params: CloudMoldFinanceApi.PageParams) {
  return requestClient.get<PageResult<CloudMoldFinanceApi.JournalPageItem>>(
    `${ROOT}/journals/page`,
    { params },
  );
}

export function getJournal(journalEntryId: string) {
  return requestClient.get<CloudMoldFinanceApi.JournalDetail>(
    `${ROOT}/journals/${encodeURIComponent(journalEntryId)}`,
  );
}

export function executeSupplierInvoiceCommand(
  command:
    | CloudMoldFinanceApi.InvoiceTransitionCommand
    | CloudMoldFinanceApi.RunMatchCommand,
) {
  return requestClient.post<CloudMoldFinanceApi.CommandResult>(
    `${ROOT}/supplier-invoices/command`,
    { envelope: buildCommandEnvelopeWithRunId(), ...command },
  );
}

export function approveMatchOverride(
  command: CloudMoldFinanceApi.ApproveMatchOverrideCommand,
) {
  return requestClient.post<CloudMoldFinanceApi.CommandResult>(
    `${ROOT}/match-exceptions/command`,
    { envelope: buildCommandEnvelopeWithRunId(), ...command },
  );
}

export function executeSupplierPaymentCommand(
  command:
    | CloudMoldFinanceApi.PaymentTransitionCommand
    | CloudMoldFinanceApi.SettlePaymentCommand,
) {
  return requestClient.post<CloudMoldFinanceApi.CommandResult>(
    `${ROOT}/supplier-payments/command`,
    { envelope: buildCommandEnvelopeWithRunId(), ...command },
  );
}

export function reverseJournal(
  command: CloudMoldFinanceApi.ReverseJournalCommand,
) {
  return requestClient.post<CloudMoldFinanceApi.CommandResult>(
    `${ROOT}/journals/command`,
    { envelope: buildCommandEnvelopeWithRunId(), ...command },
  );
}
