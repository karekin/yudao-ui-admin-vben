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
