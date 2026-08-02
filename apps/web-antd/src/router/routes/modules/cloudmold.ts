import type { RouteRecordRaw } from 'vue-router';

/**
 * CloudMold-owned routes are isolated from upstream yudao route modules.
 * Backend-menu mode resolves the same hierarchy from system_menu; these routes
 * keep frontend access mode, direct development navigation, and old bookmarks
 * available without leaking unavailable capabilities into the sidebar.
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/cloudmold',
    name: 'CloudMoldOperations',
    meta: {
      title: 'CloudMold',
      icon: 'lucide:boxes',
      hideInMenu: true,
    },
    children: [
      {
        path: 'product-center',
        name: 'CloudMoldProductCenter',
        meta: {
          title: '商品中心',
          icon: 'lucide:shirt',
        },
        children: [
          {
            path: 'products',
            name: 'CloudMoldCatalog',
            component: () => import('#/views/cloudmold/catalog/index.vue'),
            meta: {
              title: '商品管理',
              authority: ['cloudmold:catalog:query'],
            },
          },
          {
            path: 'channel-products',
            name: 'CloudMoldCommerceListing',
            component: () =>
              import('#/views/cloudmold/commerce/listing/index.vue'),
            meta: {
              title: '渠道商品',
              authority: ['cloudmold:listing:query'],
            },
          },
        ],
      },
      {
        path: 'merchant-channel',
        name: 'CloudMoldMerchantChannel',
        meta: {
          title: '商家与渠道',
          icon: 'lucide:store',
        },
        children: [
          {
            path: 'merchants',
            name: 'CloudMoldMerchant',
            component: () => import('#/views/cloudmold/merchant/index.vue'),
            meta: {
              title: '商家管理',
              authority: ['cloudmold:merchant:query'],
            },
          },
          {
            path: 'identities',
            name: 'CloudMoldIdentity',
            component: () => import('#/views/cloudmold/identity/index.vue'),
            meta: {
              title: '经营主体与授权',
              authority: ['cloudmold:identity:query'],
            },
          },
        ],
      },
      {
        path: 'inventory-warehouse',
        name: 'CloudMoldInventoryWarehouse',
        meta: {
          title: '库存与仓储',
          icon: 'lucide:warehouse',
        },
        children: [
          {
            path: 'inventory',
            name: 'CloudMoldInventory',
            component: () => import('#/views/cloudmold/inventory/index.vue'),
            meta: {
              title: '库存管理',
              authority: ['cloudmold:inventory:query'],
            },
          },
          {
            path: 'warehouses',
            name: 'CloudMoldWarehouse',
            component: () => import('#/views/cloudmold/warehouse/index.vue'),
            meta: {
              title: '仓库与库位',
              authority: ['cloudmold:warehouse:query'],
            },
          },
          {
            path: 'stock-transfers',
            name: 'CloudMoldStockTransfer',
            component: () =>
              import('#/views/cloudmold/stock-transfer/index.vue'),
            meta: {
              title: '库存调拨',
              authority: ['cloudmold:warehouse:query'],
            },
          },
        ],
      },
      {
        path: 'order-fulfillment',
        name: 'CloudMoldOrderFulfillment',
        meta: {
          title: '订单与履约',
          icon: 'lucide:shopping-bag',
        },
        children: [
          {
            path: 'orders',
            name: 'CloudMoldCommerceOrder',
            component: () =>
              import('#/views/cloudmold/commerce/order/index.vue'),
            meta: {
              title: '订单管理',
              authority: ['cloudmold:order:query'],
            },
          },
          {
            path: 'payments',
            name: 'CloudMoldCommercePayment',
            component: () =>
              import('#/views/cloudmold/commerce/payment/index.vue'),
            meta: {
              title: '支付记录',
              authority: ['cloudmold:payment:query'],
            },
          },
          {
            path: 'fulfillments',
            name: 'CloudMoldCommerceFulfillment',
            component: () =>
              import('#/views/cloudmold/commerce/fulfillment/index.vue'),
            meta: {
              title: '发货履约',
              authority: ['cloudmold:fulfillment:query'],
            },
          },
          {
            path: 'aftersales',
            name: 'CloudMoldCommerceAfterSale',
            component: () =>
              import('#/views/cloudmold/commerce/aftersale/index.vue'),
            meta: {
              title: '售后退款',
              authority: ['cloudmold:aftersale:query'],
            },
          },
        ],
      },
      {
        path: 'data-operations',
        name: 'CloudMoldDataOperations',
        meta: {
          title: '数据运营',
          icon: 'lucide:database',
        },
        children: [
          {
            path: 'health',
            name: 'CloudMoldDataReadiness',
            component: () =>
              import('#/views/cloudmold/data-readiness/index.vue'),
            meta: {
              title: '数据健康',
              authority: ['cloudmold:data-readiness:query'],
            },
          },
        ],
      },
      {
        path: 'commerce',
        name: 'CloudMoldCommerce',
        component: () => import('#/views/cloudmold/commerce/index.vue'),
        meta: {
          title: '交易概览',
          hideInMenu: true,
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
        path: 'agent-control',
        name: 'CloudMoldAgentControl',
        component: () => import('#/views/cloudmold/agent-control/index.vue'),
        meta: {
          title: '岗位协同',
          hideInMenu: true,
          authority: ['cloudmold:agent-control:query'],
        },
      },
      {
        path: 'agent-control-grants',
        name: 'CloudMoldAgentControlGrants',
        component: () => import('#/views/cloudmold/agent-control/grants.vue'),
        meta: {
          title: '岗位角色授予',
          hideInMenu: true,
          authority: ['cloudmold:agent-control:govern'],
        },
      },
      {
        path: 'agent-control/approval-form',
        name: 'CloudMoldAgentApprovalForm',
        component: () =>
          import('#/views/cloudmold/agent-control/approval-form.vue'),
        props: (route) => ({
          id: route.query.id,
        }),
        meta: {
          title: 'Agent 审批表单',
          hideInMenu: true,
          authority: ['cloudmold:agent-control:query'],
        },
      },
      {
        path: 'catalog',
        name: 'CloudMoldLegacyCatalogRedirect',
        redirect: '/cloudmold/product-center/products',
        meta: { hideInMenu: true, title: '商品管理' },
      },
      {
        path: 'listing',
        name: 'CloudMoldLegacyListingRedirect',
        redirect: '/cloudmold/product-center/channel-products',
        meta: { hideInMenu: true, title: '渠道商品' },
      },
      {
        path: 'merchant',
        name: 'CloudMoldLegacyMerchantRedirect',
        redirect: '/cloudmold/merchant-channel/merchants',
        meta: { hideInMenu: true, title: '商家管理' },
      },
      {
        path: 'identity',
        name: 'CloudMoldLegacyIdentityRedirect',
        redirect: '/cloudmold/merchant-channel/identities',
        meta: { hideInMenu: true, title: '经营主体与授权' },
      },
      {
        path: 'inventory',
        name: 'CloudMoldLegacyInventoryRedirect',
        redirect: '/cloudmold/inventory-warehouse/inventory',
        meta: { hideInMenu: true, title: '库存管理' },
      },
      {
        path: 'warehouse',
        name: 'CloudMoldLegacyWarehouseRedirect',
        redirect: '/cloudmold/inventory-warehouse/warehouses',
        meta: { hideInMenu: true, title: '仓库与库位' },
      },
      {
        path: 'stock-transfer',
        name: 'CloudMoldLegacyStockTransferRedirect',
        redirect: '/cloudmold/inventory-warehouse/stock-transfers',
        meta: { hideInMenu: true, title: '库存调拨' },
      },
      {
        path: 'order',
        name: 'CloudMoldLegacyOrderRedirect',
        redirect: '/cloudmold/order-fulfillment/orders',
        meta: { hideInMenu: true, title: '订单管理' },
      },
      {
        path: 'payment',
        name: 'CloudMoldLegacyPaymentRedirect',
        redirect: '/cloudmold/order-fulfillment/payments',
        meta: { hideInMenu: true, title: '支付记录' },
      },
      {
        path: 'fulfillment',
        name: 'CloudMoldLegacyFulfillmentRedirect',
        redirect: '/cloudmold/order-fulfillment/fulfillments',
        meta: { hideInMenu: true, title: '发货履约' },
      },
      {
        path: 'aftersale',
        name: 'CloudMoldLegacyAfterSaleRedirect',
        redirect: '/cloudmold/order-fulfillment/aftersales',
        meta: { hideInMenu: true, title: '售后退款' },
      },
      {
        path: 'data-readiness',
        name: 'CloudMoldLegacyDataReadinessRedirect',
        redirect: '/cloudmold/data-operations/health',
        meta: { hideInMenu: true, title: '数据健康' },
      },
    ],
  },
];

export default routes;
