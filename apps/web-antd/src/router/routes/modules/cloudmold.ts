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
        path: 'catalog',
        name: 'CloudMoldCatalog',
        component: () => import('#/views/cloudmold/catalog/index.vue'),
        meta: {
          title: '规范商品目录',
          authority: ['cloudmold:catalog:query'],
        },
      },
    ],
  },
];

export default routes;
