# CloudMold frontend integration boundary

## Ownership

The yudao/Vben frontend remains the platform shell for login, tenant context,
RBAC, backend menus, layouts, request infrastructure, forms, tables and shared
UI components. CloudMold owns apparel commerce and supply-chain screens.

CloudMold frontend code must live under these additive paths:

```text
apps/web-antd/src/api/cloudmold/**
apps/web-antd/src/views/cloudmold/**
apps/web-antd/src/router/routes/modules/cloudmold.ts
docs/cloudmold/**
```

Do not add CloudMold domain rules to upstream `packages/**`, shared request
infrastructure or existing `views/erp`, `views/wms` and `views/mall` pages.

## Authority boundary

- `cloudmold-*` APIs and tables are authoritative for new Catalog, Inventory,
  Listing, Order, Payment, Fulfillment and AfterSale operations.
- Existing yudao ERP/WMS/Mall pages remain explicitly legacy views until they
  are retired or converted to call CloudMold ports.
- A legacy page must never label `product_sku.stock`, `erp_stock` or
  `wms_inventory` as CloudMold canonical stock.
- New pages start read-only. Writes require an idempotent CloudMold command,
  optimistic version, permission, audit evidence and failure semantics.

## Upstream merge policy

Upstream updates are merged into a temporary integration branch first. Accept
upstream changes in shared platform paths, preserve the additive CloudMold
paths above, then run frontend typecheck/lint/build and backend REST contract
tests. If upstream introduces a first-class extension point that replaces a
local bridge, migrate to it and delete the duplicate bridge.

No CloudMold page may depend directly on an upstream internal TypeScript type;
the `api/cloudmold` contract is the frontend port. This keeps upstream page and
component refactors from changing CloudMold domain semantics.
