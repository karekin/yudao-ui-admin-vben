import { requestClient } from '#/api/request';

export interface CloudMoldReceivablesSummaryView {
  allocationAmountMinor?: number;
  allocationCount?: number;
  currencyCode?: string;
  customerId?: string;
  receiptAllocatedMinor?: number;
  receiptAmountMinor?: number;
  receiptCount?: number;
  receiptUnallocatedMinor?: number;
  receivablePlanAllocatedMinor?: number;
  receivablePlanAmountMinor?: number;
  receivablePlanCount?: number;
  receivablePlanOutstandingMinor?: number;
  salesContractId?: string;
}

export function getCloudMoldCustomerReceivablesSummary(customerId: string) {
  return requestClient.get<CloudMoldReceivablesSummaryView[]>(
    `/cloudmold/finance/receivables/customers/${encodeURIComponent(customerId)}/summary`,
  );
}

export function getCloudMoldSalesContractReceivablesSummary(
  salesContractId: string,
) {
  return requestClient.get<CloudMoldReceivablesSummaryView[]>(
    `/cloudmold/finance/receivables/sales-contracts/${encodeURIComponent(salesContractId)}/summary`,
  );
}
