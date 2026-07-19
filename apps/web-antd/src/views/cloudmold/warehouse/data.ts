import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { codeInput, statusInput, timeColumn } from '../shared/form-helpers';

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

export function useWarehouseFormSchema(): VbenFormSchema[] {
  return [
    codeInput('warehouseCode', '仓库编码'),
    codeInput('warehouseType', '仓库类型'),
    statusInput(),
  ];
}

export function useZoneFormSchema(): VbenFormSchema[] {
  return [
    codeInput('warehouseId', '仓库 ID'),
    codeInput('zoneCode', '库区编码'),
    statusInput(),
  ];
}

export function useLocationFormSchema(): VbenFormSchema[] {
  return [
    codeInput('warehouseId', '仓库 ID'),
    codeInput('zoneId', '库区 ID'),
    codeInput('locationCode', '库位编码'),
    statusInput(),
  ];
}

export function useWarehouseColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'warehouseCode',
      fixed: 'left',
      minWidth: 170,
      slots: { default: 'warehouse-code' },
      title: '仓库编码',
    },
    { field: 'name', minWidth: 180, title: '仓库名称' },
    { field: 'warehouseType', minWidth: 130, title: '类型' },
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
  ];
}

export function useZoneColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'zoneCode',
      fixed: 'left',
      minWidth: 150,
      slots: { default: 'zone-code' },
      title: '库区编码',
    },
    { field: 'warehouseCode', minWidth: 150, title: '仓库编码' },
    { field: 'name', minWidth: 160, title: '库区名称' },
    { field: 'zoneType', minWidth: 120, title: '类型' },
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
  ];
}

export function useLocationColumns(): VxeTableGridOptions['columns'] {
  return [
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
    { field: 'locationType', minWidth: 110, title: '类型' },
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
    { field: 'capacityUomCode', minWidth: 90, title: '容量 UOM' },
    {
      field: 'status',
      minWidth: 110,
      slots: { default: 'location-status' },
      title: '状态',
    },
    { field: 'locationId', minWidth: 180, title: '规范库位 ID' },
    { field: 'version', minWidth: 80, title: '版本' },
    timeColumn('updatedAt', '更新时间'),
  ];
}
