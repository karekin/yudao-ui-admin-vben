import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace CloudMoldInventoryApi {
  export interface Balance {
    aggregateVersion: number;
    allocatableQuantity: string;
    allocationEligibility: string;
    availableQuantity: string;
    balanceId: string;
    baseUomCode: string;
    canonicalSkuId: string;
    inTransitQuantity: string;
    locationCode: string;
    locationId: string;
    locationName: string;
    lotCode?: string;
    lotId?: string;
    onHandQuantity: string;
    ownerId: string;
    ownerType: string;
    qualityStatus: string;
    reservedQuantity: string;
    skuCode: string;
    spuCode: string;
    stockStatus: string;
    updatedAt: string;
    warehouseCode: string;
    warehouseId: string;
    warehouseName: string;
  }

  export interface BalancePageParams extends PageParam {
    locationCode?: string;
    lotCode?: string;
    onlyNonZero?: boolean;
    ownerId?: string;
    ownerType?: string;
    qualityStatus?: string;
    skuCode?: string;
    stockStatus?: string;
    warehouseCode?: string;
  }

  export interface Reservation {
    allocationId: string;
    allocationQuantity: string;
    allocationStatus: number;
    allocationVersion: number;
    baseUomCode: string;
    businessId: string;
    businessItemId: string;
    businessType: string;
    canonicalSkuId: string;
    closedOperationId?: number;
    createdAt: string;
    createdOperationId: number;
    locationCode: string;
    locationId: string;
    lotCode?: string;
    lotId?: string;
    ownerId: string;
    ownerType: string;
    qualityStatus: string;
    quantity: string;
    reservationId: string;
    skuCode: string;
    status: number;
    stockStatus: string;
    updatedAt: string;
    version: number;
    warehouseCode: string;
    warehouseId: string;
  }

  export interface ReservationPageParams extends PageParam {
    businessId?: string;
    businessItemId?: string;
    businessType?: string;
    locationCode?: string;
    lotCode?: string;
    reservationId?: string;
    skuCode?: string;
    status?: number;
    warehouseCode?: string;
  }

  export interface LedgerEntry {
    afterInTransitQuantity: string;
    afterOnHandQuantity: string;
    afterReservedQuantity: string;
    aggregateVersion: number;
    balanceId: string;
    baseUomCode: string;
    beforeInTransitQuantity: string;
    beforeOnHandQuantity: string;
    beforeReservedQuantity: string;
    businessId: string;
    businessItemId: string;
    businessNo: string;
    businessType: string;
    canonicalSkuId: string;
    commandType: string;
    counterpartyBalanceId?: string;
    createdAt: string;
    deltaInTransitQuantity: string;
    deltaOnHandQuantity: string;
    deltaReservedQuantity: string;
    entryRole: string;
    ledgerEntryId: number;
    ledgerTransactionId: number;
    locationCode: string;
    locationId: string;
    lotCode?: string;
    lotId?: string;
    movementGroupId: string;
    occurredAt: string;
    ownerId: string;
    ownerType: string;
    qualityStatus: string;
    skuCode: string;
    stockStatus: string;
    warehouseCode: string;
    warehouseId: string;
  }

  export interface LedgerPageParams extends PageParam {
    businessId?: string;
    businessItemId?: string;
    businessNo?: string;
    businessType?: string;
    commandType?: string;
    entryRole?: string;
    locationCode?: string;
    lotCode?: string;
    movementGroupId?: string;
    occurredTimeFrom?: string;
    occurredTimeTo?: string;
    skuCode?: string;
    warehouseCode?: string;
  }
}

export function getCloudMoldInventoryBalancePage(
  params: CloudMoldInventoryApi.BalancePageParams,
) {
  return requestClient.get<PageResult<CloudMoldInventoryApi.Balance>>(
    '/cloudmold/inventory/v3/balances/page',
    { params },
  );
}

export function getCloudMoldInventoryReservationPage(
  params: CloudMoldInventoryApi.ReservationPageParams,
) {
  return requestClient.get<PageResult<CloudMoldInventoryApi.Reservation>>(
    '/cloudmold/inventory/v3/reservations/page',
    { params },
  );
}

export function getCloudMoldInventoryLedgerPage(
  params: CloudMoldInventoryApi.LedgerPageParams,
) {
  return requestClient.get<PageResult<CloudMoldInventoryApi.LedgerEntry>>(
    '/cloudmold/inventory/v3/ledger/page',
    { params },
  );
}
