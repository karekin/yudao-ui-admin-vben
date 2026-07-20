import { requestClient } from '#/api/request';

import { buildCommandEnvelope } from '../command-helpers';

/**
 * CloudMold warehouse 写命令（仓库 / 库区 / 库位状态转换）。
 * 后端 CQRS：POST /cloudmold/warehouse/command + 嵌套 DTO（warehouse/zone/location 对象）。
 * envelope 仅基础三字段（buildCommandEnvelope，后端 validate 不要求 runId）。
 * target status 仅允许 ACTIVE / INACTIVE（后端 requireLifecycle 约束，不能回 DRAFT）。
 * expectedVersion 从列表 row.version 回传。
 */

/** 仓网状态转换 operation（对齐后端 WarehouseNetworkOperation 子集） */
export const WarehouseOperation = {
  CHANGE_LOCATION_STATUS: 'CHANGE_LOCATION_STATUS',
  CHANGE_WAREHOUSE_STATUS: 'CHANGE_WAREHOUSE_STATUS',
  CHANGE_ZONE_STATUS: 'CHANGE_ZONE_STATUS',
} as const;

/** 仓网生命周期 target（后端 requireLifecycle 仅允许这两个值） */
export const WarehouseLifecycle = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;

export namespace CloudMoldWarehouseCommandApi {
  export interface CommandResult {
    aggregateVersion?: number;
    duplicate: boolean;
    status?: string;
  }
}

function sendWarehouseCommand(payload: Record<string, unknown>) {
  const envelope = buildCommandEnvelope();
  return requestClient.post<CloudMoldWarehouseCommandApi.CommandResult>(
    '/cloudmold/warehouse/command',
    { ...envelope, ...payload },
  );
}

/** 仓库状态转换：非 ACTIVE → ACTIVE，或 ACTIVE → INACTIVE */
export function changeWarehouseStatus(
  warehouseId: string,
  expectedVersion: number,
  status: string,
) {
  return sendWarehouseCommand({
    operation: WarehouseOperation.CHANGE_WAREHOUSE_STATUS,
    warehouse: { expectedVersion, status, warehouseId },
  });
}

/** 库区状态转换（激活时后端额外要求父仓库 ACTIVE） */
export function changeZoneStatus(
  zoneId: string,
  expectedVersion: number,
  status: string,
) {
  return sendWarehouseCommand({
    operation: WarehouseOperation.CHANGE_ZONE_STATUS,
    zone: { expectedVersion, status, zoneId },
  });
}

/** 库位状态转换（激活时后端额外要求父仓库 + 父库区均 ACTIVE） */
export function changeLocationStatus(
  locationId: string,
  expectedVersion: number,
  status: string,
) {
  return sendWarehouseCommand({
    location: { expectedVersion, locationId, status },
    operation: WarehouseOperation.CHANGE_LOCATION_STATUS,
  });
}
