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
      {
        path: 'promotion-campaign',
        name: 'CloudMoldPromotionCampaign',
        component: () => import('#/views/cloudmold/promotion/index.vue'),
        meta: {
          title: '营销活动',
          authority: ['cloudmold:promotion:query'],
        },
      },
      {
        path: 'engagement-campaign',
        name: 'CloudMoldEngagementCampaign',
        component: () => import('#/views/cloudmold/engagement/index.vue'),
        meta: {
          title: '通知活动',
          authority: ['cloudmold:engagement:notification:query'],
        },
      },
      {
        path: 'gamification-account',
        name: 'CloudMoldGamificationAccount',
        component: () => import('#/views/cloudmold/gamification/index.vue'),
        meta: {
          title: '游戏币账户',
          authority: ['cloudmold:gamification:query'],
        },
      },
      {
        path: 'token-platform-account',
        name: 'CloudMoldTokenPlatformAccount',
        component: () => import('#/views/cloudmold/token-platform/index.vue'),
        meta: {
          title: 'Token 配额账户',
          authority: ['cloudmold:token-platform:query'],
        },
      },
      {
        path: 'operations-alert',
        name: 'CloudMoldOperationsAlert',
        component: () =>
          import('#/views/cloudmold/operations-intelligence/index.vue'),
        meta: {
          title: '运营告警',
          authority: ['cloudmold:operations-intelligence:query'],
        },
      },
      {
        path: 'commerce-behavior-event',
        name: 'CloudMoldCommerceBehaviorEvent',
        component: () =>
          import('#/views/cloudmold/commerce-behavior/index.vue'),
        meta: {
          title: '交易行为',
          authority: ['cloudmold:commerce-behavior:query'],
        },
      },
    ],
  },
];

export default routes;
