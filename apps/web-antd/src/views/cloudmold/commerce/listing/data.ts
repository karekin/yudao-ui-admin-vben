import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import {
  codeInput,
  moneyColumn,
  statusInput,
  timeColumn,
} from '../../shared/form-helpers';

export function useListingFormSchema(): VbenFormSchema[] {
  return [
    codeInput('listingNo', '刊登单号'),
    codeInput('title', '标题'),
    codeInput('channelCode', '渠道编码'),
    codeInput('shopId', '店铺 ID'),
    statusInput(),
  ];
}

export function useListingColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'listingNo',
      fixed: 'left',
      minWidth: 170,
      slots: { default: 'listing-no' },
      title: '刊登单号',
    },
    { field: 'title', minWidth: 220, title: '标题' },
    { field: 'channelCode', minWidth: 110, title: '渠道' },
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
    { field: 'aggregateVersion', minWidth: 80, title: '版本' },
    timeColumn('updatedAt', '更新时间'),
  ];
}
