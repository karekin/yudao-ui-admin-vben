import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { codeInput, timeColumn } from '../shared/form-helpers';

export const behaviorTypeMeta: Record<
  string,
  { color: string; label: string }
> = {
  CART_ADDED: { color: 'success', label: '加购' },
  CART_REMOVED: { color: 'default', label: '移出购物车' },
  CHECKOUT_ABANDONED: { color: 'warning', label: '放弃结账' },
  CHECKOUT_STARTED: { color: 'processing', label: '开始结账' },
  PDP_VIEWED: { color: 'default', label: '浏览商品' },
  SEARCH_REQUESTED: { color: 'default', label: '发起搜索' },
  SEARCH_RESULT_CLICKED: { color: 'processing', label: '点击搜索结果' },
  SEARCH_RESULT_EXPOSED: { color: 'default', label: '搜索结果曝光' },
};

export function useCommerceBehaviorEventFormSchema(): VbenFormSchema[] {
  return [
    codeInput('behaviorId', '行为 ID'),
    codeInput('sessionId', '会话 ID'),
    codeInput('principalId', '买家主体'),
    codeInput('behaviorType', '行为类型'),
    codeInput('canonicalSpuId', '规范 SPU'),
    codeInput('shopId', '店铺 ID'),
    codeInput('merchantId', '商家 ID'),
    codeInput('channelCode', '渠道编码'),
  ];
}

export function useCommerceBehaviorEventColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'behaviorId',
      fixed: 'left',
      minWidth: 220,
      slots: { default: 'behavior-id' },
      title: '行为 ID',
    },
    {
      field: 'behaviorType',
      minWidth: 150,
      slots: { default: 'behavior-type' },
      title: '行为类型',
    },
    { field: 'sessionId', minWidth: 220, title: '会话 ID' },
    { field: 'principalId', minWidth: 180, title: '买家主体' },
    { field: 'canonicalSpuId', minWidth: 180, title: '规范 SPU' },
    { field: 'shopId', minWidth: 180, title: '店铺' },
    { field: 'merchantId', minWidth: 180, title: '商家' },
    { field: 'channelCode', minWidth: 100, title: '渠道' },
    { field: 'quantity', minWidth: 80, title: '数量' },
    timeColumn('occurredAt', '发生时间'),
    timeColumn('createdAt', '落库时间'),
  ];
}
