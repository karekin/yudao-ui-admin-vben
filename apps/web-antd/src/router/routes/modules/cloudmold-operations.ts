import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';

/**
 * CloudMold 横向运营域只读诊断路由（L3）。
 *
 * 这些页面暂不进入日常业务菜单；它们保留稳定的直接访问地址，等待各域
 * 达到业务入口准入门槛后再迁入 cloudmold.ts 的运营中心。
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/cloudmold/operations',
    name: 'CloudMoldOperationsQuery',
    component: BasicLayout,
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
      {
        path: 'metadata-definition',
        name: 'CloudMoldMetadataDefinition',
        component: () => import('#/views/cloudmold/metadata/index.vue'),
        meta: {
          title: '元数据定义',
          authority: ['cloudmold:metadata:query'],
        },
      },
      {
        path: 'event-outbox',
        name: 'CloudMoldEventOutbox',
        component: () => import('#/views/cloudmold/data-contract/index.vue'),
        meta: {
          title: '事件外发',
          authority: ['cloudmold:data-readiness:query'],
        },
      },
      {
        path: 'ai-workflow-run',
        name: 'CloudMoldAiWorkflowRun',
        component: () => import('#/views/cloudmold/ai-operations/index.vue'),
        meta: {
          title: 'AI 工作流运行',
          authority: ['cloudmold:ai-operations:query'],
        },
      },
      {
        path: 'supplier-performance',
        name: 'CloudMoldSupplierPerformance',
        component: () =>
          import('#/views/cloudmold/supplier-performance/index.vue'),
        meta: {
          title: '供应商绩效',
          authority: ['cloudmold:supplier-performance:query'],
        },
      },
      {
        path: 'dreamplant-exploration',
        name: 'CloudMoldDreamPlantExploration',
        component: () => import('#/views/cloudmold/dreamplant/index.vue'),
        meta: {
          title: 'DreamPlant 探索',
          authority: ['cloudmold:dreamplant:query'],
        },
      },
    ],
  },
];

export default routes;
