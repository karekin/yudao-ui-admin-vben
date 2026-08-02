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

  export interface FinancialImpactPageParams extends PageParam {
    keyword?: string;
    sourceType?: string;
    status?: string;
  }

  export interface FinancialImpactPageItem {
    accountingDate?: string;
    accountingPeriodId?: string;
    aggregateVersion: number;
    apImpactAmountMinor?: Int64String;
    balanceStatus?: string;
    currencyCode?: string;
    impactType: string;
    inventoryControlPostingId: string;
    journalCode?: string;
    journalEntryId?: string;
    journalStatus?: string;
    postingStatus: string;
    quantity?: string;
    sourceDocumentId: string;
    sourceLineId?: string;
    sourceReferenceId?: string;
    sourceType: string;
    totalAmountMinor?: Int64String;
    unitOfMeasure?: string;
    updatedAt: string;
    valuationImpactAmountMinor?: Int64String;
  }

  export interface FinancialImpactAllocationItem {
    allocatedCostAmountMinor?: Int64String;
    allocatedQuantity?: string;
    sequenceNo: number;
    valuationLayerId?: string;
    valuationLayerSourceType?: string;
  }

  export interface FinancialImpactSourceLine {
    apImpactAmountMinor?: Int64String;
    currencyCode?: string;
    invoiceLineId?: string;
    purchaseOrderId?: string;
    purchaseOrderItemId?: string;
    purchaseOrderScheduleId?: string;
    purchasePriceVarianceAmountMinor?: Int64String;
    qualityDispositionId?: string;
    quantity?: string;
    receiptLineId?: string;
    sourceLineId?: string;
    sourceReferenceId?: string;
    unitOfMeasure?: string;
    valuationImpactAmountMinor?: Int64String;
    valuationLayerId?: string;
  }

  export interface FinancialImpactApLineage {
    apOpenItemId?: string;
    grossReversalAmountMinor?: Int64String;
    invoiceLineId?: string;
    netReversalAmountMinor?: Int64String;
    reversalQuantity?: string;
    supplierInvoiceId?: string;
    taxReversalAmountMinor?: Int64String;
    unitOfMeasure?: string;
  }

  export interface FinancialImpactDetail extends FinancialImpactPageItem {
    allocations: FinancialImpactAllocationItem[];
    apLineage: FinancialImpactApLineage[];
    createdAt?: string;
    createdByPrincipalId?: string;
    gainBasisId?: string;
    gainBasisStatus?: string;
    journal?: JournalDetail;
    ledgerId?: string;
    legalEntityId?: string;
    postingEvidenceSha256?: string;
    postingRuleId?: string;
    postingRuleVersion?: number;
    reversalJournalEntryId?: string;
    reversedByPrincipalId?: string;
    sourceLines: FinancialImpactSourceLine[];
    unitCostAmountMinor?: Int64String;
    valuationPolicyHash?: string;
    valuationPolicyId?: string;
    valuationPolicyVersion?: string;
  }

  export interface ReconciliationRunPageParams extends PageParam {
    currencyCode?: string;
    keyword?: string;
    legalEntityId?: string;
    status?: string;
  }

  export interface ReconciliationRunPageItem {
    completedAt?: string;
    currencyCode: string;
    differentCount: number;
    legalEntityId: string;
    lineCount: number;
    matchedCount: number;
    missingCount: number;
    runCode: string;
    runId: string;
    startedAt: string;
    status: string;
    uncomparableCount: number;
  }

  export interface ReconciliationWatermark {
    domainCode: string;
    maxAggregateVersion: number;
    maxObservedAt: string;
    recordCount: number;
    sourceTable: string;
  }

  export interface ReconciliationRunDetail extends ReconciliationRunPageItem {
    reconciliationPolicyVersion?: string;
    requestedByPrincipalId?: string;
    watermarks: ReconciliationWatermark[];
  }

  export interface ReconciliationLinePageParams extends PageParam {
    keyword?: string;
    lineType?: string;
    matchStatus?: string;
    runId: string;
  }

  export interface ReconciliationLinePageItem {
    currencyCode: string;
    differenceCount: number;
    amountDifferenceMinor?: Int64String;
    financeAmountMinor?: string;
    financeQuantity?: string;
    financeVersion?: number;
    inventoryAmountMinor?: string;
    inventoryMovementId?: string;
    inventoryQuantity?: string;
    inventoryVersion?: number;
    legalEntityId: string;
    lineId: string;
    lineKey: string;
    lineType: string;
    matchStatus: string;
    primaryDifferenceCode?: string;
    procurementAmountMinor?: string;
    procurementQuantity?: string;
    procurementVersion?: number;
    purchaseOrderId?: string;
    purchaseOrderItemId?: string;
    quantityDifference?: string;
    receiptLineId?: string;
    responsibilityDomain?: string;
    supplierInvoiceLineId?: string;
    supplierReturnLineId?: string;
  }

  export interface ReconciliationDifferenceItem {
    actualValue?: string;
    blocking: boolean;
    differenceCode: string;
    differenceId: string;
    expectedValue?: string;
    sourceDomain: string;
  }

  export interface ReconciliationLineDetail extends ReconciliationLinePageItem {
    apOpenItemId?: string;
    deliveryScheduleId?: string;
    differences: ReconciliationDifferenceItem[];
    journalEntryId?: string;
    supplierInvoiceId?: string;
    supplierReturnId?: string;
  }

  export interface ReconciliationRunCommand {
    causationId?: string;
    correlationId: string;
    currencyCode: string;
    idempotencyKey: string;
    legalEntityId: string;
    occurredAt: string;
    runId: string;
  }

  export interface ReconciliationRunCommandResult {
    aggregateId: string;
    aggregateType: string;
    differentCount: number;
    duplicate: boolean;
    lineCount: number;
    matchedCount: number;
    missingCount: number;
    operationId: Int64String;
    runCode: string;
    status: string;
    uncomparableCount: number;
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

export function getFinancialImpactPage(
  params: CloudMoldFinanceApi.FinancialImpactPageParams,
) {
  return requestClient.get<
    PageResult<CloudMoldFinanceApi.FinancialImpactPageItem>
  >('/cloudmold/finance/financial-impacts/page', { params });
}

export function getFinancialImpact(postingId: string) {
  return requestClient.get<CloudMoldFinanceApi.FinancialImpactDetail>(
    `/cloudmold/finance/financial-impacts/${encodeURIComponent(postingId)}`,
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

export function getReconciliationRunPage(
  params: CloudMoldFinanceApi.ReconciliationRunPageParams,
) {
  return requestClient.get<
    PageResult<CloudMoldFinanceApi.ReconciliationRunPageItem>
  >(`${ROOT}/reconciliations/runs/page`, { params });
}

export function getReconciliationRun(runId: string) {
  return requestClient.get<CloudMoldFinanceApi.ReconciliationRunDetail>(
    `${ROOT}/reconciliations/runs/${encodeURIComponent(runId)}`,
  );
}

export function getReconciliationLinePage(
  params: CloudMoldFinanceApi.ReconciliationLinePageParams,
) {
  return requestClient.get<
    PageResult<CloudMoldFinanceApi.ReconciliationLinePageItem>
  >(`${ROOT}/reconciliations/lines/page`, { params });
}

export function getReconciliationLine(runId: string, lineId: string) {
  return requestClient.get<CloudMoldFinanceApi.ReconciliationLineDetail>(
    `${ROOT}/reconciliations/lines/${encodeURIComponent(lineId)}`,
    { params: { runId } },
  );
}

export function createReconciliationRun(
  command: CloudMoldFinanceApi.ReconciliationRunCommand,
) {
  return requestClient.post<CloudMoldFinanceApi.ReconciliationRunCommandResult>(
    `${ROOT}/reconciliations/runs`,
    command,
  );
}
