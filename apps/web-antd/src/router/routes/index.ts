import type { RouteRecordRaw } from 'vue-router';

import { mergeRouteModules, traverseTreeValues } from '@vben/utils';

import { BasicLayout } from '#/layouts';

import { coreRoutes, fallbackNotFoundRoute } from './core';
import cloudmoldOperationsRoutes from './modules/cloudmold-operations';

const dynamicRouteFiles = import.meta.glob('./modules/**/*.ts', {
  eager: true,
});

// 有需要可以自行打开注释，并创建文件夹
// const externalRouteFiles = import.meta.glob('./external/**/*.ts', { eager: true });
// const staticRouteFiles = import.meta.glob('./static/**/*.ts', { eager: true });

/** 动态路由 */
const dynamicRoutes: RouteRecordRaw[] = mergeRouteModules(dynamicRouteFiles);

/** 外部路由列表，访问这些页面可以不需要Layout，可能用于内嵌在别的系统(不会显示在菜单中) */
// const externalRoutes: RouteRecordRaw[] = mergeRouteModules(externalRouteFiles);
// const staticRoutes: RouteRecordRaw[] = mergeRouteModules(staticRouteFiles);
//
// L3 只读诊断页没有 system_menu 项。若仅作为动态路由，已登录用户首次直接
// 打开书签会先命中 404；将它们作为独立的主布局根路由注册，数据仍由服务端
// 查询权限控制，且不会被后端菜单重建流程覆盖或泄露到侧栏。
const staticRoutes: RouteRecordRaw[] = cloudmoldOperationsRoutes.map(
  (route) => ({
    ...route,
    component: BasicLayout,
  }),
);
const externalRoutes: RouteRecordRaw[] = [];

/** 路由列表，由基本路由、外部路由和404兜底路由组成
 *  无需走权限验证（会一直显示在菜单中） */
const routes: RouteRecordRaw[] = [
  ...coreRoutes,
  ...staticRoutes,
  ...externalRoutes,
  fallbackNotFoundRoute,
];

/**
 * 基本路由列表。L3 诊断页仅提供页面壳，实际数据仍由后端查询权限控制；
 * 将其纳入这里可避免后端菜单模式在首次直接访问时把有效书签降级为 404。
 */
const coreRouteNames = traverseTreeValues(
  [...coreRoutes, ...staticRoutes],
  (route) => route.name,
);

/** 有权限校验的路由列表。L3 路由由独立静态根路由稳定承载。 */
const staticRouteNames = new Set(
  staticRoutes.map((route) => String(route.name)),
);
const accessRoutes = dynamicRoutes.filter(
  (route) => !staticRouteNames.has(String(route.name)),
);

// add by 芋艿：from https://github.com/vbenjs/vue-vben-admin/blob/main/playground/src/router/routes/index.ts#L38-L45
const componentKeys: string[] = Object.keys(
  import.meta.glob('../../views/**/*.vue'),
)
  .filter((item) => !item.includes('/modules/'))
  .map((v) => {
    const path = v.replace('../../views/', '/');
    return path.endsWith('.vue') ? path.slice(0, -4) : path;
  });
export { accessRoutes, componentKeys, coreRouteNames, routes };
