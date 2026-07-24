export type VisibleCloudMoldPageKey =
  | 'aftersale'
  | 'catalog'
  | 'dataReadiness'
  | 'fulfillment'
  | 'identity'
  | 'inventory'
  | 'listing'
  | 'merchant'
  | 'order'
  | 'payment'
  | 'warehouse';

export const visibleCloudMoldPageKeys: VisibleCloudMoldPageKey[] = [
  'catalog',
  'listing',
  'merchant',
  'identity',
  'inventory',
  'warehouse',
  'order',
  'payment',
  'fulfillment',
  'aftersale',
  'dataReadiness',
];

export const cloudMoldPageIntro: Record<
  VisibleCloudMoldPageKey,
  { description: string; title: string }
> = {
  aftersale: {
    title: '售后退款',
    description: '审核退货退款申请，跟踪逆向物流、退款和库存返还进度。',
  },
  catalog: {
    title: '商品管理',
    description: '查询款式、商品、SKU、颜色尺码、条码和生命周期信息。',
  },
  dataReadiness: {
    title: '数据健康',
    description: '分别显示事件、同步、质量和报表状态；未接入来源会明确标记。',
  },
  fulfillment: {
    title: '发货履约',
    description: '维护运输进度、承运商、运单和送达结果；当前仅支持单包裹。',
  },
  identity: {
    title: '经营主体与授权',
    description: '查询业务身份、外部账号绑定关系和授权操作记录。',
  },
  inventory: {
    title: '库存管理',
    description: '查看各仓库和库位的库存余额、预占情况及库存流水。',
  },
  listing: {
    title: '渠道商品',
    description: '审核商品资料并管理各销售渠道的发布、下架和暂停状态。',
  },
  merchant: {
    title: '商家管理',
    description: '维护商家和店铺资料，处理激活、暂停、恢复与退出状态。',
  },
  order: {
    title: '订单管理',
    description: '查询订单、商品金额、支付和发货进度，并处理订单状态。',
  },
  payment: {
    title: '支付记录',
    description: '核对订单应付、实收和退款余额；当前记录来自内部测试通道。',
  },
  warehouse: {
    title: '仓库与库位',
    description: '维护仓库、库区和库位资料，管理容量及启用状态。',
  },
};
