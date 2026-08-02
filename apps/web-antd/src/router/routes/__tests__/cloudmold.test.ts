import type { RouteRecordRaw } from 'vue-router';

import { createMemoryHistory, createRouter } from 'vue-router';

import { describe, expect, it } from 'vitest';

import { accessRoutes, routes as appRoutes, coreRouteNames } from '../index';
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
      ['CloudMoldWarehouseExecution', '仓储执行'],
      ['CloudMoldSupplyPlanningCenter', '供销计划'],
      ['CloudMoldInventoryControlCenter', '库存控制'],
      ['CloudMoldProcurementCenter', '采购执行'],
      ['CloudMoldFinanceCenter', '财务与风控'],
      ['CloudMoldOrderFulfillment', '订单与履约'],
      ['CloudMoldDataOperations', '数据运营'],
    ] as const;

    expect(
      groups.map(([name]) => childByName(root, name)?.meta?.title),
    ).toEqual(groups.map(([, title]) => title));
    expect(
      groups.map(([name]) => childByName(root, name)?.children?.length),
    ).toEqual([2, 2, 3, 3, 4, 6, 2, 4, 1]);
  });

  it('uses operator-facing labels instead of canonical-model terminology', () => {
    const groupNames = new Set([
      'CloudMoldDataOperations',
      'CloudMoldFinanceCenter',
      'CloudMoldInventoryControlCenter',
      'CloudMoldMerchantChannel',
      'CloudMoldOrderFulfillment',
      'CloudMoldProcurementCenter',
      'CloudMoldProductCenter',
      'CloudMoldSupplyPlanningCenter',
      'CloudMoldWarehouseExecution',
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
      '仓库与库位',
      '库存调拨',
      '采购收货与上架',
      '销量与需求计划',
      '供应计划与情景',
      '补货计划',
      '库存余额',
      '预占与分配',
      '库存流水',
      '库存健康',
      '采购申请',
      '寻源与定标',
      '采购订单',
      '采购全景',
      '定标详情',
      '来料质检处置',
      '应付与匹配',
      '供应商发票匹配详情',
      '订单管理',
      '支付记录',
      '发货履约',
      '售后退款',
      '数据健康',
    ]);
    expect(pageTitles?.some((title) => title.startsWith('规范'))).toBe(false);
  });

  it('registers CloudMold-only procurement and finance workbenches with hidden details', () => {
    const procurement = childByName(root, 'CloudMoldProcurementCenter')!;
    const finance = childByName(root, 'CloudMoldFinanceCenter')!;
    const procurementWorkbench = childByName(
      procurement,
      'CloudMoldProcurement',
    );
    const awardDetail = childByName(
      procurement,
      'CloudMoldProcurementAwardDetail',
    );
    const financeWorkbench = childByName(finance, 'CloudMoldProcureToPay');
    const invoiceDetail = childByName(
      finance,
      'CloudMoldSupplierInvoiceDetail',
    );

    expect(procurementWorkbench?.path).toBe('workbench');
    expect(procurementWorkbench?.meta?.authority).toEqual([
      'cloudmold:procurement:requisition:query',
      'cloudmold:procurement:sourcing:query',
      'cloudmold:procurement:quotation:query',
      'cloudmold:procurement:award:query',
      'cloudmold:procurement:order:query',
    ]);
    expect(awardDetail?.path).toBe('awards/:awardId');
    expect(awardDetail?.meta?.hideInMenu).toBe(true);
    expect(awardDetail?.meta?.authority).toEqual([
      'cloudmold:procurement:award:query',
    ]);

    expect(financeWorkbench?.path).toBe('procure-to-pay');
    expect(financeWorkbench?.meta?.authority).toEqual([
      'cloudmold:finance:procure-to-pay:query',
    ]);
    expect(invoiceDetail?.path).toBe('supplier-invoices/:supplierInvoiceId');
    expect(invoiceDetail?.meta?.hideInMenu).toBe(true);
    expect(invoiceDetail?.meta?.authority).toEqual([
      'cloudmold:finance:procure-to-pay:query',
    ]);

    const router = createRouter({
      history: createMemoryHistory(),
      routes,
    });
    expect(
      router.resolve('/cloudmold/procurement-execution/workbench').name,
    ).toBe('CloudMoldProcurement');
    expect(
      router.resolve('/cloudmold/procurement-execution/awards/award-1').name,
    ).toBe('CloudMoldProcurementAwardDetail');
    expect(
      router.resolve('/cloudmold/finance-center/procure-to-pay').name,
    ).toBe('CloudMoldProcureToPay');
    expect(
      router.resolve('/cloudmold/finance-center/supplier-invoices/invoice-1')
        .name,
    ).toBe('CloudMoldSupplierInvoiceDetail');
  });

  it('registers final Figma-backed inbound and incoming-quality workbenches', () => {
    const warehouse = childByName(root, 'CloudMoldWarehouseExecution')!;
    const procurement = childByName(root, 'CloudMoldProcurementCenter')!;
    const planning = childByName(root, 'CloudMoldSupplyPlanningCenter')!;
    const inventory = childByName(root, 'CloudMoldInventoryControlCenter')!;
    const inbound = childByName(warehouse, 'CloudMoldProcurementInbound');
    const quality = childByName(procurement, 'CloudMoldProcurementQuality');
    const demandPlans = childByName(planning, 'CloudMoldDemandPlans');
    const supplyPlans = childByName(planning, 'CloudMoldSupplyPlans');
    const replenishments = childByName(planning, 'CloudMoldReplenishments');
    const inventoryHealth = childByName(inventory, 'CloudMoldInventoryHealth');

    expect(inbound?.path).toBe('procurement-inbound');
    expect(inbound?.meta?.authority).toEqual(['cloudmold:warehouse:query']);
    expect(quality?.path).toBe('incoming-quality');
    expect(quality?.meta?.authority).toEqual([
      'cloudmold:quality:procurement-receipt-inspection:query',
    ]);
    expect(demandPlans?.meta?.authority).toEqual([
      'cloudmold:supply-planning:query',
    ]);
    expect(supplyPlans?.meta?.authority).toEqual([
      'cloudmold:supply-planning:query',
    ]);
    expect(replenishments?.meta?.authority).toEqual([
      'cloudmold:supply-planning:query',
    ]);
    expect(inventoryHealth?.meta?.authority).toEqual([
      'cloudmold:supply-planning:query',
    ]);

    const router = createRouter({
      history: createMemoryHistory(),
      routes,
    });
    expect(
      router.resolve('/cloudmold/warehouse-execution/procurement-inbound').name,
    ).toBe('CloudMoldProcurementInbound');
    expect(
      router.resolve('/cloudmold/procurement-execution/incoming-quality').name,
    ).toBe('CloudMoldProcurementQuality');
    expect(router.resolve('/cloudmold/planning/demand-plans').name).toBe(
      'CloudMoldDemandPlans',
    );
    expect(router.resolve('/cloudmold/planning/supply-plans').name).toBe(
      'CloudMoldSupplyPlans',
    );
    expect(router.resolve('/cloudmold/planning/replenishments').name).toBe(
      'CloudMoldReplenishments',
    );
    expect(
      router.resolve('/cloudmold/inventory-control/inventory-health').name,
    ).toBe('CloudMoldInventoryHealth');
  });

  it('separates query route authority from warehouse and quality commands', () => {
    const routeText = JSON.stringify(root, (_key, value) =>
      typeof value === 'function' ? '[component]' : value,
    );
    expect(routeText).not.toContain('cloudmold:warehouse:command');
    expect(routeText).not.toContain(
      'cloudmold:quality:procurement-receipt-inspection:command',
    );
  });

  it('does not create ERP aliases or fallback redirects for procurement and finance', () => {
    const routeText = JSON.stringify(root, (_key, value) =>
      typeof value === 'function' ? '[component]' : value,
    );

    expect(routeText).not.toContain('/erp');
    expect(routeText).not.toContain('ERP');
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

  it('physically retires CloudMold legacy route aliases', () => {
    const routeText = JSON.stringify(root, (_key, value) =>
      typeof value === 'function' ? '[component]' : value,
    );
    expect(routeText).not.toContain('CloudMoldLegacy');
    expect(root.children?.some((route) => route.redirect)).toBe(false);
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

    expect(groupedPageCount).toBe(27);
    expect(directOperationsPageCount).toBe(14);
    expect(operationsRoot.meta?.hideInMenu).toBe(true);
    expect(hiddenDirectPageCount).toBe(4);
    expect(
      groupedPageCount! + directOperationsPageCount! + hiddenDirectPageCount!,
    ).toBe(45);
  });

  it('registers L3 diagnostics as stable routes outside backend menus', () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: appRoutes,
    });

    expect(
      appRoutes
        .find((route) => route.name === 'CloudMoldOperationsQuery')
        ?.children?.some((route) => route.name === 'CloudMoldAiWorkflowRun'),
    ).toBe(true);
    expect(
      accessRoutes.some((route) => route.name === 'CloudMoldOperationsQuery'),
    ).toBe(false);
    expect(coreRouteNames).toContain('CloudMoldAiWorkflowRun');
    expect(coreRouteNames).toContain('CloudMoldAiWorkflowDetail');
    expect(router.resolve('/cloudmold/operations/ai-workflow-run').name).toBe(
      'CloudMoldAiWorkflowRun',
    );
    expect(
      router.resolve('/cloudmold/operations/ai-workflow-detail').name,
    ).toBe('CloudMoldAiWorkflowDetail');
  });
});
