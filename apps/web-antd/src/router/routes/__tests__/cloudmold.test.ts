import type { RouteRecordRaw } from 'vue-router';

import { describe, expect, it } from 'vitest';

import routes from '../modules/cloudmold';
import operationsRoutes from '../modules/cloudmold-operations';
import legacyMallRoutes from '../modules/mall';

const root = routes[0]!;
const operationsRoot = operationsRoutes[0]!;

function childByName(
  parent: RouteRecordRaw,
  name: string,
): RouteRecordRaw | undefined {
  return parent.children?.find((child) => child.name === name);
}

describe('cloudmold administration navigation', () => {
  it('groups business pages into stable administration centers', () => {
    const groups = [
      ['CloudMoldProductCenter', '商品中心'],
      ['CloudMoldMerchantChannel', '商家与渠道'],
      ['CloudMoldInventoryWarehouse', '库存与仓储'],
      ['CloudMoldOrderFulfillment', '订单与履约'],
      ['CloudMoldDataOperations', '数据运营'],
    ] as const;

    expect(
      groups.map(([name]) => childByName(root, name)?.meta?.title),
    ).toEqual(groups.map(([, title]) => title));
    expect(
      groups.map(([name]) => childByName(root, name)?.children?.length),
    ).toEqual([2, 2, 2, 4, 1]);
  });

  it('uses operator-facing labels instead of canonical-model terminology', () => {
    const groupNames = new Set([
      'CloudMoldDataOperations',
      'CloudMoldInventoryWarehouse',
      'CloudMoldMerchantChannel',
      'CloudMoldOrderFulfillment',
      'CloudMoldProductCenter',
    ]);
    const pageTitles = root.children
      ?.filter((route) => groupNames.has(String(route.name)))
      .flatMap(
        (route) =>
          route.children?.map((child) => String(child.meta?.title)) ?? [],
      );

    expect(pageTitles).toEqual([
      '商品管理',
      '渠道商品',
      '商家管理',
      '经营主体与授权',
      '库存管理',
      '仓库与库位',
      '订单管理',
      '支付记录',
      '发货履约',
      '售后退款',
      '数据健康',
    ]);
    expect(pageTitles?.some((title) => title.startsWith('规范'))).toBe(false);
  });

  it('hides default-off Agent Control while preserving direct diagnostics', () => {
    expect(childByName(root, 'CloudMoldAgentControl')?.meta?.hideInMenu).toBe(
      true,
    );
    expect(
      childByName(root, 'CloudMoldAgentControlGrants')?.meta?.hideInMenu,
    ).toBe(true);
  });

  it('provides a hidden route for the Agent approval form template', () => {
    const route = childByName(root, 'CloudMoldAgentApprovalForm');

    expect(route?.path).toBe('agent-control/approval-form');
    expect(route?.meta?.hideInMenu).toBe(true);
    expect(route?.meta?.authority).toEqual(['cloudmold:agent-control:query']);
  });

  it('redirects old bookmarks to the grouped routes', () => {
    expect(childByName(root, 'CloudMoldLegacyCatalogRedirect')?.redirect).toBe(
      '/cloudmold/product-center/products',
    );
    expect(childByName(root, 'CloudMoldLegacyOrderRedirect')?.redirect).toBe(
      '/cloudmold/order-fulfillment/orders',
    );
    expect(
      childByName(root, 'CloudMoldLegacyDataReadinessRedirect')?.redirect,
    ).toBe('/cloudmold/data-operations/health');
  });

  it('keeps old business entry aliases hidden and without direct authority', () => {
    const legacyAliases = [
      'CloudMoldLegacyCatalogRedirect',
      'CloudMoldLegacyListingRedirect',
      'CloudMoldLegacyMerchantRedirect',
      'CloudMoldLegacyIdentityRedirect',
      'CloudMoldLegacyInventoryRedirect',
      'CloudMoldLegacyWarehouseRedirect',
      'CloudMoldLegacyOrderRedirect',
      'CloudMoldLegacyPaymentRedirect',
      'CloudMoldLegacyFulfillmentRedirect',
      'CloudMoldLegacyAfterSaleRedirect',
      'CloudMoldLegacyDataReadinessRedirect',
    ] as const;

    legacyAliases.forEach((name) => {
      const route = childByName(root, name);
      expect(route).toBeTruthy();
      expect(route?.meta?.hideInMenu).toBe(true);
      expect(route?.meta?.authority).toBeFalsy();
    });
  });

  it('keeps Product/Trade/ERP/WMS style legacy roots out of CloudMold menus', () => {
    const hiddenLegacyRoots = [
      'CloudMoldLegacyCatalogRedirect',
      'CloudMoldLegacyInventoryRedirect',
      'CloudMoldLegacyOrderRedirect',
      'CloudMoldLegacyPaymentRedirect',
      'CloudMoldLegacyFulfillmentRedirect',
      'CloudMoldLegacyAfterSaleRedirect',
      'CloudMoldLegacyDataReadinessRedirect',
    ] as const;

    hiddenLegacyRoots.forEach((name) => {
      const route = childByName(root, name);
      expect(route?.meta?.title).toBeDefined();
      expect(route?.redirect).toContain('/cloudmold/');
    });
  });

  it('keeps upstream Mall Product/Promotion/Trade routes disabled by default', () => {
    expect(legacyMallRoutes).toEqual([]);
  });

  it('accounts for every current CloudMold page without exposing diagnostics', () => {
    const groupedPageCount = root.children
      ?.filter((route) => route.children)
      .reduce((count, route) => count + (route.children?.length ?? 0), 0);
    const directOperationsPageCount = operationsRoot.children?.length;
    const hiddenDirectPageCount = root.children?.filter(
      (route) => route.component && route.meta?.hideInMenu,
    ).length;

    expect(groupedPageCount).toBe(11);
    expect(directOperationsPageCount).toBe(12);
    expect(operationsRoot.meta?.hideInMenu).toBe(true);
    expect(hiddenDirectPageCount).toBe(4);
    expect(
      groupedPageCount! + directOperationsPageCount! + hiddenDirectPageCount!,
    ).toBe(27);
  });
});
