import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

/**
 * CloudMold 规范仓网主数据只读查询 API。
 * 仅读取 cloudmold_warehouse / cloudmold_warehouse_zone / cloudmold_warehouse_location 权威表。
 */
export namespace CloudMoldWarehouseApi {
  export interface Warehouse {
    name: string;
    status: string;
    timezone?: string;
    updatedAt: string;
    version: number;
    warehouseCode: string;
    warehouseId: string;
    warehouseType: string;
  }

  export interface Zone {
    name: string;
    status: string;
    updatedAt: string;
    version: number;
    warehouseCode?: string;
    warehouseId: string;
    zoneCode: string;
    zoneId: string;
    zoneType: string;
  }

  export interface Location {
    aisleCode?: string;
    allowItemMixing?: boolean;
    allowLotMixing?: boolean;
    bayCode?: string;
    capacityQuantity?: number;
    capacityUomCode?: string;
    levelCode?: string;
    locationCode: string;
    locationId: string;
    locationType?: string;
    name?: string;
    rackCode?: string;
    status: string;
    updatedAt: string;
    version: number;
    warehouseCode?: string;
    warehouseId: string;
    zoneCode?: string;
    zoneId: string;
  }

  export interface WarehousePageParams extends PageParam {
    status?: string;
    warehouseCode?: string;
    warehouseType?: string;
  }

  export interface ZonePageParams extends PageParam {
    status?: string;
    warehouseId?: string;
    zoneCode?: string;
  }

  export interface LocationPageParams extends PageParam {
    locationCode?: string;
    status?: string;
    warehouseId?: string;
    zoneId?: string;
  }

  export interface StockTransferPageParams extends PageParam {
    keyword?: string;
    orderStatus?: string;
    sourceWarehouseId?: string;
    targetWarehouseId?: string;
  }

  export interface StockTransferPageItem {
    approvedAt: string;
    currentStageCode: string;
    currentStageLabel: string;
    lineCount: number;
    orderCode: string;
    orderId: string;
    orderStatus: string;
    orderVersion: number;
    ownerId: string;
    ownerType: string;
    preparedAt: string;
    requestCode: string;
    requestId: string;
    requestStatus: string;
    requestVersion: number;
    sourceBusinessRef: string;
    sourceBusinessType: string;
    sourceWarehouseCode: string;
    sourceWarehouseId: string;
    sourceWarehouseName: string;
    targetWarehouseCode: string;
    targetWarehouseId: string;
    targetWarehouseName: string;
    terminal: boolean;
    totalRequestedQuantity: number;
    uomCode: string;
    updatedAt: string;
  }

  export interface StockTransferLine {
    canonicalSkuId: string;
    lineId: string;
    lineNumber: number;
    remark?: string;
    requestedQuantity: number;
    uomCode: string;
  }

  export interface StockTransferHistory {
    businessObjectId: string;
    businessObjectType: string;
    changedAt: string;
    historyId: string;
    stageCode: string;
    stageLabel: string;
    status: string;
    statusVersion: number;
  }

  export interface StockTransferDetail {
    currentStageCode: string;
    currentStageLabel: string;
    lines: StockTransferLine[];
    orderCode: string;
    orderId: string;
    orderStatus: string;
    orderVersion: number;
    ownerId: string;
    ownerType: string;
    reasonCode: string;
    remark?: string;
    requestCode: string;
    requestId: string;
    requestStatus: string;
    requestVersion: number;
    sourceBusinessRef: string;
    sourceBusinessType: string;
    sourceWarehouseCode: string;
    sourceWarehouseId: string;
    sourceWarehouseName: string;
    statusHistory: StockTransferHistory[];
    targetWarehouseCode: string;
    targetWarehouseId: string;
    targetWarehouseName: string;
    terminal: boolean;
  }
}

export function getCloudMoldWarehousePage(
  params: CloudMoldWarehouseApi.WarehousePageParams,
) {
  return requestClient.get<PageResult<CloudMoldWarehouseApi.Warehouse>>(
    '/cloudmold/warehouse/warehouses/page',
    { params },
  );
}

export function getCloudMoldWarehouseZonePage(
  params: CloudMoldWarehouseApi.ZonePageParams,
) {
  return requestClient.get<PageResult<CloudMoldWarehouseApi.Zone>>(
    '/cloudmold/warehouse/zones/page',
    { params },
  );
}

export function getCloudMoldWarehouseLocationPage(
  params: CloudMoldWarehouseApi.LocationPageParams,
) {
  return requestClient.get<PageResult<CloudMoldWarehouseApi.Location>>(
    '/cloudmold/warehouse/locations/page',
    { params },
  );
}

export function getCloudMoldStockTransferPage(
  params: CloudMoldWarehouseApi.StockTransferPageParams,
) {
  return requestClient.get<
    PageResult<CloudMoldWarehouseApi.StockTransferPageItem>
  >('/cloudmold/warehouse/stock-transfers/page', { params });
}

export function getCloudMoldStockTransfer(requestId: string) {
  return requestClient.get<CloudMoldWarehouseApi.StockTransferDetail>(
    '/cloudmold/warehouse/stock-transfers/get',
    { params: { requestId } },
  );
}
