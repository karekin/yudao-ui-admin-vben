import type { RouteRecordRaw } from 'vue-router';

/**
 * CloudMold-owned routes are isolated from upstream yudao route modules.
 * Backend-menu mode resolves the same hierarchy from system_menu; these routes
 * keep frontend access mode and direct development navigation aligned with the
 * canonical backend menu hierarchy.
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
        path: 'warehouse-execution',
        name: 'CloudMoldWarehouseExecution',
        meta: {
          title: '仓储执行',
          icon: 'lucide:warehouse',
        },
        children: [
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
          {
            path: 'procurement-inbound',
            name: 'CloudMoldProcurementInbound',
            component: () =>
              import('#/views/cloudmold/procurement-inbound/index.vue'),
            meta: {
              title: '采购收货与上架',
              authority: ['cloudmold:warehouse:query'],
            },
          },
        ],
      },
      {
        path: 'planning',
        name: 'CloudMoldSupplyPlanningCenter',
        meta: {
          title: '供销计划',
          icon: 'lucide:chart-no-axes-combined',
        },
        children: [
          {
            path: 'demand-plans',
            name: 'CloudMoldDemandPlans',
            component: () => import('#/views/cloudmold/supply-chain/index.vue'),
            meta: {
              title: '销量与需求计划',
              authority: ['cloudmold:supply-planning:query'],
            },
          },
          {
            path: 'supply-plans',
            name: 'CloudMoldSupplyPlans',
            component: () => import('#/views/cloudmold/supply-chain/index.vue'),
            meta: {
              title: '供应计划与情景',
              authority: ['cloudmold:supply-planning:query'],
            },
          },
          {
            path: 'replenishments',
            name: 'CloudMoldReplenishments',
            component: () => import('#/views/cloudmold/supply-chain/index.vue'),
            meta: {
              title: '补货计划',
              authority: ['cloudmold:supply-planning:query'],
            },
          },
        ],
      },
      {
        path: 'inventory-control',
        name: 'CloudMoldInventoryControlCenter',
        meta: {
          title: '库存控制',
          icon: 'lucide:shield-check',
        },
        children: [
          {
            path: 'balances',
            name: 'CloudMoldInventoryBalances',
            component: () => import('#/views/cloudmold/inventory/index.vue'),
            meta: {
              title: '库存余额',
              authority: ['cloudmold:inventory:query'],
            },
          },
          {
            path: 'reservations',
            name: 'CloudMoldInventoryReservations',
            component: () => import('#/views/cloudmold/inventory/index.vue'),
            meta: {
              title: '预占与分配',
              authority: ['cloudmold:inventory:query'],
            },
          },
          {
            path: 'ledger',
            name: 'CloudMoldInventoryLedger',
            component: () => import('#/views/cloudmold/inventory/index.vue'),
            meta: {
              title: '库存流水',
              authority: ['cloudmold:inventory:query'],
            },
          },
          {
            path: 'inventory-health',
            name: 'CloudMoldInventoryHealth',
            component: () => import('#/views/cloudmold/supply-chain/index.vue'),
            meta: {
              title: '库存健康',
              authority: ['cloudmold:supply-planning:query'],
            },
          },
        ],
      },
      {
        path: 'procurement-execution',
        name: 'CloudMoldProcurementCenter',
        meta: {
          title: '采购执行',
          icon: 'lucide:handshake',
        },
        children: [
          {
            path: 'purchase-requisitions',
            name: 'CloudMoldPurchaseRequisitions',
            component: () => import('#/views/cloudmold/procurement/index.vue'),
            meta: {
              title: '采购申请',
              authority: ['cloudmold:procurement:requisition:query'],
            },
          },
          {
            path: 'sourcing',
            name: 'CloudMoldProcurementSourcing',
            component: () => import('#/views/cloudmold/procurement/index.vue'),
            meta: {
              title: '寻源与定标',
              authority: ['cloudmold:procurement:sourcing:query'],
            },
          },
          {
            path: 'purchase-orders',
            name: 'CloudMoldPurchaseOrders',
            component: () => import('#/views/cloudmold/procurement/index.vue'),
            meta: {
              title: '采购订单',
              authority: ['cloudmold:procurement:order:query'],
            },
          },
          {
            path: 'workbench',
            name: 'CloudMoldProcurement',
            component: () => import('#/views/cloudmold/procurement/index.vue'),
            meta: {
              title: '采购全景',
              authority: [
                'cloudmold:procurement:requisition:query',
                'cloudmold:procurement:sourcing:query',
                'cloudmold:procurement:quotation:query',
                'cloudmold:procurement:award:query',
                'cloudmold:procurement:order:query',
              ],
            },
          },
          {
            path: 'awards/:awardId',
            name: 'CloudMoldProcurementAwardDetail',
            component: () => import('#/views/cloudmold/procurement/index.vue'),
            meta: {
              title: '定标详情',
              hideInMenu: true,
              authority: ['cloudmold:procurement:award:query'],
            },
          },
          {
            path: 'incoming-quality',
            name: 'CloudMoldProcurementQuality',
            component: () =>
              import('#/views/cloudmold/procurement-quality/index.vue'),
            meta: {
              title: '来料质检处置',
              authority: [
                'cloudmold:quality:procurement-receipt-inspection:query',
              ],
            },
          },
        ],
      },
      {
        path: 'finance-center',
        name: 'CloudMoldFinanceCenter',
        meta: {
          title: '财务与风控',
          icon: 'lucide:landmark',
        },
        children: [
          {
            path: 'procure-to-pay',
            name: 'CloudMoldProcureToPay',
            component: () => import('#/views/cloudmold/finance/index.vue'),
            meta: {
              title: '应付与匹配',
              authority: ['cloudmold:finance:procure-to-pay:query'],
            },
          },
          {
            path: 'supplier-invoices/:supplierInvoiceId',
            name: 'CloudMoldSupplierInvoiceDetail',
            component: () => import('#/views/cloudmold/finance/index.vue'),
            meta: {
              title: '供应商发票匹配详情',
              hideInMenu: true,
              authority: ['cloudmold:finance:procure-to-pay:query'],
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
    ],
  },
];

export default routes;
