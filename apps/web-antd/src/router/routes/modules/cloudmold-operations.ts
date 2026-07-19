import type { RouteRecordRaw } from 'vue-router';

/**
 * CloudMold 横向运营域只读路由（L3）。
 *
 * 独立于 cloudmold.ts：后者承载 R3 未提交的 agent-control 路由，
 * 本文件隔离 L3 新增领域，避免污染 R3 工作区；R3 提交后再统一。
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/cloudmold/operations',
    name: 'CloudMoldOperationsQuery',
    meta: {
      title: 'CloudMold 运营',
      icon: 'lucide:boxes',
      hideInMenu: true,
    },
    children: [
      {
        path: 'risk-review',
        name: 'CloudMoldRiskReview',
        component: () => import('#/views/cloudmold/risk/index.vue'),
        meta: {
          title: '风控审核',
          authority: ['cloudmold:risk:query'],
        },
      },
      {
        path: 'customer-service-ticket',
        name: 'CloudMoldCustomerServiceTicket',
        component: () => import('#/views/cloudmold/customer-service/index.vue'),
        meta: {
          title: '客服工单',
          authority: ['cloudmold:customer-service:query'],
        },
      },
    ],
  },
];

export default routes;
