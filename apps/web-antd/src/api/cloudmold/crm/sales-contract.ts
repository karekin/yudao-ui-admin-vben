import { requestClient } from '#/api/request';

import { buildCommandEnvelopeWithRunId } from '../command-helpers';

export const SALES_CONTRACT_OPERATIONS = {
  CREATE_DRAFT: 'CREATE_DRAFT',
  SUBMIT_APPROVAL: 'SUBMIT_APPROVAL',
  UPDATE_DRAFT: 'UPDATE_DRAFT',
} as const;

export type SalesContractOperation =
  (typeof SALES_CONTRACT_OPERATIONS)[keyof typeof SALES_CONTRACT_OPERATIONS];

export interface CloudMoldSalesContractItem {
  canonicalSkuId: string;
  itemName: string;
  lineAmountMinor: number;
  lineNo?: number;
  quantity: string;
  salesContractItemId?: string;
  unitPriceMinor: number;
  uomCode: string;
}

export interface CloudMoldSalesContractCommand {
  contractCode?: string;
  contractName?: string;
  currencyCode?: string;
  customerId?: string;
  effectiveDate?: string;
  expectedVersion?: number;
  expiresOn?: string;
  items?: CloudMoldSalesContractItem[];
  operation: SalesContractOperation;
  reasonCode?: string;
  salesContractId?: string;
  sellerMerchantId?: string;
  sellerShopId?: string;
}

export interface CloudMoldSalesContractView {
  approvalProcessInstanceId?: string;
  contractCode?: string;
  contractName?: string;
  createdAt?: string;
  currencyCode?: string;
  customerId?: string;
  effectiveDate?: string;
  expiresOn?: string;
  items: CloudMoldSalesContractItem[];
  salesContractId: string;
  sellerLegalEntityId?: string;
  sellerMerchantId?: string;
  sellerShopId?: string;
  status: string;
  totalAmountMinor?: number;
  updatedAt?: string;
  version?: number;
}

export interface CloudMoldSalesContractCommandResult {
  approvalProcessInstanceId?: string;
  currencyCode?: string;
  duplicate: boolean;
  operationId: number;
  salesContractId: string;
  status: string;
  totalAmountMinor?: number;
  version?: number;
}

export function executeSalesContractCommand(
  command: CloudMoldSalesContractCommand,
) {
  const envelope = buildCommandEnvelopeWithRunId();
  return requestClient.post<CloudMoldSalesContractCommandResult>(
    '/cloudmold/crm/sales-contracts/command',
    {
      ...command,
      ...envelope,
      causationId: crypto.randomUUID(),
    },
  );
}

export function getCloudMoldSalesContract(salesContractId: string) {
  return requestClient.get<CloudMoldSalesContractView>(
    `/cloudmold/crm/sales-contracts/${encodeURIComponent(salesContractId)}`,
  );
}

export function listCloudMoldSalesContracts() {
  return requestClient.get<CloudMoldSalesContractView[]>(
    '/cloudmold/crm/sales-contracts/page',
  );
}
