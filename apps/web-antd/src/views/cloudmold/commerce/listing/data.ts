import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import {
  codeInput,
  enumColumn,
  moneyColumn,
  statusSelect,
  timeColumn,
  withCloudMoldTableColumns,
} from '../../shared/form-helpers';

/** Listing 状态机枚举（值用于行内按钮 ifShow 比较） */
export const ListingStatus = {
  ARCHIVED: 'ARCHIVED',
  BUSINESS_APPROVED: 'BUSINESS_APPROVED',
  COMPLETION_PASSED: 'COMPLETION_PASSED',
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  REJECTED: 'REJECTED',
  RISK_APPROVED: 'RISK_APPROVED',
  SUBMITTED: 'SUBMITTED',
  SUSPENDED: 'SUSPENDED',
  UNPUBLISHED: 'UNPUBLISHED',
};

export function useListingFormSchema(): VbenFormSchema[] {
  return [
    codeInput('listingNo', '刊登单号'),
    codeInput('title', '标题'),
    codeInput('channelCode', '渠道编码'),
    codeInput('shopId', '店铺 ID'),
    statusSelect('status', Object.values(ListingStatus)),
  ];
}

export function useListingColumns(): VxeTableGridOptions['columns'] {
  return withCloudMoldTableColumns([
    {
      field: 'listingNo',
      fixed: 'left',
      minWidth: 170,
      slots: { default: 'listing-no' },
      title: '刊登单号',
    },
    { field: 'title', minWidth: 220, title: '标题' },
    enumColumn('channelCode', '渠道', 110),
    { field: 'shopId', minWidth: 150, title: '店铺 ID' },
    { field: 'canonicalSpuId', minWidth: 180, title: '规范 SPU ID' },
    { field: 'revision', minWidth: 80, title: '修订' },
    {
      field: 'status',
      minWidth: 130,
      slots: { default: 'status' },
      title: '状态',
    },
    { field: 'offerCount', minWidth: 90, title: '报价数' },
    { field: 'enabledOfferCount', minWidth: 110, title: '启用报价' },
    moneyColumn('minPriceMinor', '最低价（元）'),
    moneyColumn('maxPriceMinor', '最高价（元）'),
    { field: 'completionPassed', minWidth: 100, title: '完整性' },
    { field: 'businessApproved', minWidth: 100, title: '业务审批' },
    { field: 'riskApproved', minWidth: 100, title: '风控审批' },
    timeColumn('publishStartAt', '发布开始'),
    timeColumn('publishEndAt', '发布结束'),
    { field: 'version', minWidth: 80, title: '版本' },
    timeColumn('updatedAt', '更新时间'),
    {
      field: 'action',
      fixed: 'right',
      minWidth: 220,
      slots: { default: 'action' },
      title: '操作',
    },
  ]);
}
