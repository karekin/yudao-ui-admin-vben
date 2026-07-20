import type { RouteRecordRaw } from 'vue-router';

/**
 * CloudMold-owned routes are isolated from upstream yudao route modules.
 * Backend-menu mode resolves the same component from system_menu; this route
 * keeps frontend access mode and direct development navigation available.
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/cloudmold',
    name: 'CloudMoldOperations',
    meta: {
      title: 'CloudMold 运营',
      icon: 'lucide:boxes',
      hideInMenu: true,
    },
    children: [
      {
        path: 'agent-control',
        name: 'CloudMoldAgentControl',
        component: () => import('#/views/cloudmold/agent-control/index.vue'),
        meta: {
          title: '岗位协同中心',
          authority: ['cloudmold:agent-control:query'],
        },
      },
      {
        path: 'catalog',
        name: 'CloudMoldCatalog',
        component: () => import('#/views/cloudmold/catalog/index.vue'),
        meta: {
          title: '规范商品目录',
          authority: ['cloudmold:catalog:query'],
        },
      },
      {
        path: 'inventory',
        name: 'CloudMoldInventory',
        component: () => import('#/views/cloudmold/inventory/index.vue'),
        meta: {
          title: '规范库存',
          authority: ['cloudmold:inventory:query'],
        },
      },
      {
        path: 'merchant',
        name: 'CloudMoldMerchant',
        component: () => import('#/views/cloudmold/merchant/index.vue'),
        meta: {
          title: '规范商家',
          authority: ['cloudmold:merchant:query'],
        },
      },
      {
        path: 'warehouse',
        name: 'CloudMoldWarehouse',
        component: () => import('#/views/cloudmold/warehouse/index.vue'),
        meta: {
          title: '规范仓网',
          authority: ['cloudmold:warehouse:query'],
        },
      },
      {
        path: 'identity',
        name: 'CloudMoldIdentity',
        component: () => import('#/views/cloudmold/identity/index.vue'),
        meta: {
          title: '规范身份',
          authority: ['cloudmold:identity:query'],
        },
      },
      {
        path: 'commerce',
        name: 'CloudMoldCommerce',
        component: () => import('#/views/cloudmold/commerce/index.vue'),
        meta: {
          title: '规范交易与履约',
          authority: [
            'cloudmold:listing:query',
            'cloudmold:order:query',
            'cloudmold:payment:query',
            'cloudmold:fulfillment:query',
            'cloudmold:aftersale:query',
          ],
        },
      },
      {
        path: 'listing',
        name: 'CloudMoldCommerceListing',
        component: () => import('#/views/cloudmold/commerce/listing/index.vue'),
        meta: {
          title: '渠道刊登',
          authority: ['cloudmold:listing:query'],
        },
      },
      {
        path: 'order',
        name: 'CloudMoldCommerceOrder',
        component: () => import('#/views/cloudmold/commerce/order/index.vue'),
        meta: {
          title: '订单',
          authority: ['cloudmold:order:query'],
        },
      },
      {
        path: 'payment',
        name: 'CloudMoldCommercePayment',
        component: () => import('#/views/cloudmold/commerce/payment/index.vue'),
        meta: {
          title: '支付',
          authority: ['cloudmold:payment:query'],
        },
      },
      {
        path: 'fulfillment',
        name: 'CloudMoldCommerceFulfillment',
        component: () =>
          import('#/views/cloudmold/commerce/fulfillment/index.vue'),
        meta: {
          title: '履约',
          authority: ['cloudmold:fulfillment:query'],
        },
      },
      {
        path: 'aftersale',
        name: 'CloudMoldCommerceAfterSale',
        component: () =>
          import('#/views/cloudmold/commerce/aftersale/index.vue'),
        meta: {
          title: '售后',
          authority: ['cloudmold:aftersale:query'],
        },
      },
      {
        path: 'data-readiness',
        name: 'CloudMoldDataReadiness',
        component: () => import('#/views/cloudmold/data-readiness/index.vue'),
        meta: {
          title: '数据就绪度',
          authority: ['cloudmold:data-readiness:query'],
        },
      },
    ],
  },
];

export default routes;
