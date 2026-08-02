import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import {
  codeInput,
  statusSelect,
  timeColumn,
  withCloudMoldTableColumns,
} from '../shared/form-helpers';

/**
 * 商家账户状态（对齐后端 cloudmold_merchant_account.status 约束）。
 */
export const merchantStatusMeta: Record<
  string,
  { color: string; label: string }
> = {
  ACTIVE: { color: 'success', label: '生效' },
  CLOSED: { color: 'default', label: '已关闭' },
  EXITING: { color: 'warning', label: '退出中' },
  PENDING_ACTIVATION: { color: 'processing', label: '待激活' },
  RESTRICTED: { color: 'warning', label: '受限' },
  SUSPENDED: { color: 'warning', label: '冻结' },
};

/**
 * 店铺状态（对齐后端 cloudmold_merchant_shop.status 约束）。
 */
export const shopStatusMeta: Record<string, { color: string; label: string }> =
  {
    ACTIVE: { color: 'success', label: '生效' },
    CLOSED: { color: 'default', label: '已关闭' },
    DRAFT: { color: 'default', label: '草稿' },
    PAUSED: { color: 'warning', label: '暂停' },
  };

/** Merchant 商家状态机枚举（值用于行内按钮 ifShow 比较） */
export const MerchantStatus = {
  ACTIVE: 'ACTIVE',
  CLOSED: 'CLOSED',
  EXITING: 'EXITING',
  PENDING_ACTIVATION: 'PENDING_ACTIVATION',
  RESTRICTED: 'RESTRICTED',
  SUSPENDED: 'SUSPENDED',
};

/** Shop 店铺状态机枚举（值用于行内按钮 ifShow 比较） */
export const ShopStatus = {
  ACTIVE: 'ACTIVE',
  CLOSED: 'CLOSED',
  DRAFT: 'DRAFT',
  PAUSED: 'PAUSED',
};

export function useMerchantFormSchema(): VbenFormSchema[] {
  return [
    codeInput('merchantCode', '商家编码'),
    codeInput('legalName', '法人名称'),
    statusSelect('status', Object.keys(merchantStatusMeta)),
  ];
}

export function useShopFormSchema(): VbenFormSchema[] {
  return [
    codeInput('merchantId', '商家 ID'),
    codeInput('channelCode', '渠道编码'),
    statusSelect('status', Object.keys(shopStatusMeta)),
  ];
}

export function useMerchantColumns(): VxeTableGridOptions['columns'] {
  return withCloudMoldTableColumns([
    {
      field: 'merchantCode',
      fixed: 'left',
      minWidth: 170,
      slots: { default: 'merchant-code' },
      title: '商家编码',
    },
    { field: 'legalName', minWidth: 220, title: '法人名称' },
    {
      field: 'status',
      minWidth: 130,
      slots: { default: 'merchant-status' },
      title: '状态',
    },
    { field: 'legalEntityId', minWidth: 180, title: '法人实体 ID' },
    { field: 'merchantId', minWidth: 180, title: '规范商家 ID' },
    { field: 'version', minWidth: 80, title: '版本' },
    timeColumn('updatedAt', '更新时间'),
    {
      field: 'action',
      fixed: 'right',
      minWidth: 190,
      slots: { default: 'merchant-action' },
      title: '操作',
    },
  ]);
}

export function useShopColumns(): VxeTableGridOptions['columns'] {
  return withCloudMoldTableColumns([
    {
      field: 'shopId',
      fixed: 'left',
      minWidth: 180,
      slots: { default: 'shop-id' },
      title: '规范店铺 ID',
    },
    { field: 'merchantCode', minWidth: 170, title: '商家编码' },
    { field: 'channelCode', minWidth: 130, title: '渠道' },
    { field: 'externalShopId', minWidth: 170, title: '外部店铺 ID' },
    {
      field: 'status',
      minWidth: 120,
      slots: { default: 'shop-status' },
      title: '状态',
    },
    { field: 'merchantId', minWidth: 180, title: '规范商家 ID' },
    { field: 'version', minWidth: 80, title: '版本' },
    timeColumn('updatedAt', '更新时间'),
    {
      field: 'action',
      fixed: 'right',
      minWidth: 120,
      slots: { default: 'shop-action' },
      title: '操作',
    },
  ]);
}
