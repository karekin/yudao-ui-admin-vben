import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import {
  codeInput,
  enumColumn,
  statusSelect,
  timeColumn,
  withCloudMoldTableColumns,
} from '../shared/form-helpers';

/**
 * 仓库 / 库区 / 库位状态（三者共用同一枚举，对齐后端 CHECK 约束）。
 */
export const warehouseStatusMeta: Record<
  string,
  { color: string; label: string }
> = {
  ACTIVE: { color: 'success', label: '生效' },
  DRAFT: { color: 'default', label: '草稿' },
  INACTIVE: { color: 'warning', label: '停用' },
};

/** 仓库/库区/库位状态枚举（值用于行内按钮 ifShow 比较；DRAFT 为只读起态） */
export const WarehouseStatus = {
  ACTIVE: 'ACTIVE',
  DRAFT: 'DRAFT',
  INACTIVE: 'INACTIVE',
};

export function useWarehouseFormSchema(): VbenFormSchema[] {
  return [
    codeInput('warehouseCode', '仓库编码'),
    codeInput('warehouseType', '仓库类型'),
    statusSelect('status', Object.keys(warehouseStatusMeta)),
  ];
}

export function useZoneFormSchema(): VbenFormSchema[] {
  return [
    codeInput('warehouseId', '仓库 ID'),
    codeInput('zoneCode', '库区编码'),
    statusSelect('status', Object.keys(warehouseStatusMeta)),
  ];
}

export function useLocationFormSchema(): VbenFormSchema[] {
  return [
    codeInput('warehouseId', '仓库 ID'),
    codeInput('zoneId', '库区 ID'),
    codeInput('locationCode', '库位编码'),
    statusSelect('status', Object.keys(warehouseStatusMeta)),
  ];
}

export function useWarehouseColumns(): VxeTableGridOptions['columns'] {
  return withCloudMoldTableColumns([
    {
      field: 'warehouseCode',
      fixed: 'left',
      minWidth: 170,
      slots: { default: 'warehouse-code' },
      title: '仓库编码',
    },
    { field: 'name', minWidth: 180, title: '仓库名称' },
    enumColumn('warehouseType', '仓库类型', 130),
    { field: 'timezone', minWidth: 150, title: '时区' },
    {
      field: 'status',
      minWidth: 110,
      slots: { default: 'warehouse-status' },
      title: '状态',
    },
    { field: 'warehouseId', minWidth: 180, title: '规范仓库 ID' },
    { field: 'version', minWidth: 80, title: '版本' },
    timeColumn('updatedAt', '更新时间'),
    {
      field: 'action',
      fixed: 'right',
      minWidth: 100,
      slots: { default: 'warehouse-action' },
      title: '操作',
    },
  ]);
}

export function useZoneColumns(): VxeTableGridOptions['columns'] {
  return withCloudMoldTableColumns([
    {
      field: 'zoneCode',
      fixed: 'left',
      minWidth: 150,
      slots: { default: 'zone-code' },
      title: '库区编码',
    },
    { field: 'warehouseCode', minWidth: 150, title: '仓库编码' },
    { field: 'name', minWidth: 160, title: '库区名称' },
    enumColumn('zoneType', '库区类型', 120),
    {
      field: 'status',
      minWidth: 110,
      slots: { default: 'zone-status' },
      title: '状态',
    },
    { field: 'warehouseId', minWidth: 180, title: '规范仓库 ID' },
    { field: 'zoneId', minWidth: 180, title: '规范库区 ID' },
    { field: 'version', minWidth: 80, title: '版本' },
    timeColumn('updatedAt', '更新时间'),
    {
      field: 'action',
      fixed: 'right',
      minWidth: 100,
      slots: { default: 'zone-action' },
      title: '操作',
    },
  ]);
}

export function useLocationColumns(): VxeTableGridOptions['columns'] {
  return withCloudMoldTableColumns([
    {
      field: 'locationCode',
      fixed: 'left',
      minWidth: 150,
      slots: { default: 'location-code' },
      title: '库位编码',
    },
    { field: 'warehouseCode', minWidth: 140, title: '仓库编码' },
    { field: 'zoneCode', minWidth: 120, title: '库区编码' },
    { field: 'name', minWidth: 150, title: '库位名称' },
    enumColumn('locationType', '库位类型', 110),
    { field: 'aisleCode', minWidth: 100, title: '巷道' },
    { field: 'rackCode', minWidth: 100, title: '货架' },
    { field: 'bayCode', minWidth: 100, title: '贝位' },
    { field: 'levelCode', minWidth: 100, title: '层位' },
    {
      field: 'capacityQuantity',
      minWidth: 110,
      slots: { default: 'quantity' },
      title: '容量',
    },
    enumColumn('capacityUomCode', '容量单位', 100),
    {
      field: 'status',
      minWidth: 110,
      slots: { default: 'location-status' },
      title: '状态',
    },
    { field: 'locationId', minWidth: 180, title: '规范库位 ID' },
    { field: 'version', minWidth: 80, title: '版本' },
    timeColumn('updatedAt', '更新时间'),
    {
      field: 'action',
      fixed: 'right',
      minWidth: 100,
      slots: { default: 'location-action' },
      title: '操作',
    },
  ]);
}
