<script lang="ts" setup>
import type { CloudMoldWarehouseApi } from '#/api/cloudmold/warehouse';

import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Timeline,
} from 'ant-design-vue';

import { buildCommandEnvelope } from '#/api/cloudmold/command-helpers';
import {
  executeCloudMoldInventoryScrapCommand,
  executeCloudMoldStockCountCommand,
  executeCloudMoldSupplierReturnCommand,
  getCloudMoldInventoryScrap,
  getCloudMoldInventoryScrapPage,
  getCloudMoldStockCount,
  getCloudMoldStockCountPage,
  getCloudMoldSupplierReturn,
  getCloudMoldSupplierReturnPage,
} from '#/api/cloudmold/warehouse';

import StatusTag from '../shared/status-tag.vue';

defineOptions({ name: 'CloudMoldWarehouseDocumentWorkspace' });

type WorkspaceKey = 'inventory-scrap' | 'stock-count' | 'supplier-return';

type TableRow =
  | CloudMoldWarehouseApi.InventoryScrapPageItem
  | CloudMoldWarehouseApi.StockCountPageItem
  | CloudMoldWarehouseApi.SupplierReturnPageItem;

type DetailRow =
  | CloudMoldWarehouseApi.InventoryScrapDetail
  | CloudMoldWarehouseApi.StockCountDetail
  | CloudMoldWarehouseApi.SupplierReturnDetail;

type CommandModalMode =
  | 'cancel'
  | 'count-batch'
  | 'dispatch-batch'
  | 'disposition-batch'
  | 'none';

interface ActionDefinition {
  label: string;
  operation: string;
  permission: string;
  mode?: CommandModalMode;
  danger?: boolean;
}

interface WorkspaceProfile {
  actionPermission: string;
  codeLabel: string;
  detailTag: string;
  description: string;
  emptyText: string;
  extraFilterLabel: string;
  extraFilterPlaceholder: string;
  extraFilterProp: string;
  queryPermission: string;
  stageLabel: string;
  statusOptions: Array<{ label: string; value: string }>;
  title: string;
}

const route = useRoute();

const workspaceKey = computed<WorkspaceKey>(() => {
  if (route.path.includes('/supplier-returns')) {
    return 'supplier-return';
  }
  if (route.path.includes('/inventory-scraps')) {
    return 'inventory-scrap';
  }
  return 'stock-count';
});

const profile = computed<WorkspaceProfile>(() => {
  switch (workspaceKey.value) {
    case 'inventory-scrap': {
      return {
        actionPermission: 'cloudmold:warehouse:inventory-scrap:command',
        codeLabel: '报废单号',
        detailTag: 'Inventory Scrap',
        description:
          '仓储域持有报废单、处置批次与证明，库存扣减只通过正式处置命令发生。',
        emptyText: '暂无规范库存报废单',
        extraFilterLabel: '仓库',
        extraFilterPlaceholder: '按规范仓库 ID 过滤',
        extraFilterProp: 'warehouseId',
        queryPermission: 'cloudmold:warehouse:inventory-scrap:query',
        stageLabel: '报废状态',
        statusOptions: [
          { label: '草稿', value: 'DRAFT' },
          { label: '待批准', value: 'SUBMITTED' },
          { label: '已批准', value: 'APPROVED' },
          { label: '部分处置', value: 'PARTIALLY_DISPOSED' },
          { label: '已处置', value: 'DISPOSED' },
          { label: '已完成', value: 'COMPLETED' },
          { label: '已取消', value: 'CANCELLED' },
        ],
        title: '库存报废',
      };
    }
    case 'supplier-return': {
      return {
        actionPermission: 'cloudmold:warehouse:supplier-return:command',
        codeLabel: '退供单号',
        detailTag: 'Supplier Return',
        description:
          '按正式退供单、退供发运批次和状态历史收口供应商退供执行，不读取旧 ERP/WMS 页面。',
        emptyText: '暂无规范供应商退供单',
        extraFilterLabel: '采购单',
        extraFilterPlaceholder: '按采购单 ID 过滤',
        extraFilterProp: 'purchaseOrderId',
        queryPermission: 'cloudmold:warehouse:supplier-return:query',
        stageLabel: '当前阶段',
        statusOptions: [
          { label: '草稿', value: 'DRAFT' },
          { label: '待批准', value: 'SUBMITTED' },
          { label: '已批准', value: 'APPROVED' },
          { label: '部分发运', value: 'PARTIALLY_DISPATCHED' },
          { label: '已发运', value: 'DISPATCHED' },
          { label: '已完成', value: 'COMPLETED' },
          { label: '已取消', value: 'CANCELLED' },
        ],
        title: '供应商退供',
      };
    }
    default: {
      return {
        actionPermission: 'cloudmold:warehouse:command',
        codeLabel: '盘点单号',
        detailTag: 'Stock Count',
        description:
          '以正式盘点单、冻结账本快照、执行批次与差异批准为中心推进库存控制执行。',
        emptyText: '暂无规范库存盘点单',
        extraFilterLabel: '盘点模式',
        extraFilterPlaceholder: 'OPEN_COUNT 或 BLIND_COUNT',
        extraFilterProp: 'countMode',
        queryPermission: 'cloudmold:warehouse:query',
        stageLabel: '盘点状态',
        statusOptions: [
          { label: '草稿', value: 'DRAFT' },
          { label: '已提交', value: 'SUBMITTED' },
          { label: '盘点中', value: 'COUNTING' },
          { label: '已盘点', value: 'COUNTED' },
          { label: '差异已批准', value: 'DIFFERENCE_APPROVED' },
          { label: '差异已入账', value: 'ADJUSTED' },
          { label: '已完成', value: 'COMPLETED' },
          { label: '已取消', value: 'CANCELLED' },
        ],
        title: '库存盘点',
      };
    }
  }
});

const query = reactive({
  extraFilter: '',
  keyword: '',
  status: undefined as string | undefined,
});

const loading = ref(false);
const loadError = ref('');
const rows = ref<TableRow[]>([]);
const total = ref(0);
const pageNo = ref(1);
const pageSize = ref(20);

const detailOpen = ref(false);
const detailLoading = ref(false);
const detail = ref<DetailRow>();

const commandOpen = ref(false);
const commandLoading = ref(false);
const commandMode = ref<CommandModalMode>('none');
const pendingOperation = ref('');
const pendingActionTitle = ref('');
const commandForm = reactive({
  dispositionType: 'DESTROYED',
  note: '',
  proofRef: '',
  proofType: 'QUALITY',
  reasonCode: 'MANUAL_CANCEL',
});
const commandLines = ref<
  Array<{
    id: string;
    lineNumber: number;
    quantity: number;
    quantityLabel: string;
    remark: string;
  }>
>([]);

const tableColumns = computed(() => [
  { key: 'document', title: profile.value.codeLabel, width: 220 },
  { key: 'summary', title: '业务摘要', width: 340 },
  { key: 'quantity', title: '业务数量', width: 210 },
  { key: 'status', title: profile.value.stageLabel, width: 220 },
  { key: 'updatedAt', title: '更新时间', width: 180 },
  { key: 'action', title: '操作', width: 220, fixed: 'right' as const },
]);

const currentPagePending = computed(
  () => rows.value.filter((row) => getRowStatus(row) === 'DRAFT').length,
);
const currentPageInProgress = computed(
  () =>
    rows.value.filter((row) =>
      [
        'APPROVED',
        'COUNTING',
        'PARTIALLY_DISPATCHED',
        'PARTIALLY_DISPOSED',
      ].includes(getRowStatus(row)),
    ).length,
);
const currentPageTerminal = computed(
  () =>
    rows.value.filter((row) =>
      ['CANCELLED', 'COMPLETED'].includes(getRowStatus(row)),
    ).length,
);
const currentPageExceptions = computed(
  () =>
    rows.value.filter((row) =>
      ['COUNTED', 'DIFFERENCE_APPROVED', 'DISPATCHED', 'DISPOSED'].includes(
        getRowStatus(row),
      ),
    ).length,
);

function getRowStatus(row: TableRow) {
  if ('scrapStatus' in row) return row.scrapStatus;
  if ('stockCountCode' in row) return row.status;
  return row.status;
}

function asTableRow(record: Record<string, any>) {
  return record as TableRow;
}

function getRowId(row: TableRow) {
  if ('scrapId' in row) return row.scrapId;
  if ('stockCountId' in row) return row.stockCountId;
  return row.returnId;
}

function getRowCode(row: TableRow) {
  if ('scrapCode' in row) return row.scrapCode;
  if ('stockCountCode' in row) return row.stockCountCode;
  return row.returnCode;
}

function getRowVersion(row: DetailRow | TableRow) {
  if ('aggregateVersion' in row && typeof row.aggregateVersion === 'number') {
    return row.aggregateVersion;
  }
  if ('version' in row && typeof row.version === 'number') {
    return row.version;
  }
  return undefined;
}

function getUpdatedAt(row: TableRow) {
  return 'updatedAt' in row ? row.updatedAt : '';
}

function formatDecimal(value: number | string | undefined) {
  if (value === undefined || value === null || value === '') return '-';
  return String(value).replace(/(\.\d*?[1-9])0+$|\.0+$/, '$1');
}

function statusMeta(status: string) {
  let color = 'processing';
  if (['APPROVED', 'COMPLETED', 'DISPATCHED', 'DISPOSED'].includes(status)) {
    color = 'success';
  }
  if (
    [
      'COUNTED',
      'DIFFERENCE_APPROVED',
      'PARTIALLY_DISPATCHED',
      'PARTIALLY_DISPOSED',
    ].includes(status)
  ) {
    color = 'warning';
  }
  if (status === 'CANCELLED') color = 'default';
  return {
    color,
    label:
      profile.value.statusOptions.find((item) => item.value === status)
        ?.label ?? status,
  };
}

function rowSummary(row: TableRow) {
  if ('purchaseOrderId' in row) {
    return `采购单 ${row.purchaseOrderId} · 收货单 ${row.receiptId} · 供应商 ${row.supplierId}`;
  }
  if ('scrapCode' in row) {
    return `货主 ${row.ownerType}/${row.ownerId} · 仓库 ${row.warehouseId} · 原因 ${row.reasonCode}`;
  }
  return `范围 ${row.scopeType} · ${row.scopeLabel} · 来源 ${row.sourceBusinessType ?? '-'}`;
}

function rowQuantity(row: TableRow) {
  if ('totalReturnQuantity' in row) {
    return `申请 ${formatDecimal(row.totalReturnQuantity)} / 已发运 ${formatDecimal(row.totalDispatchedQuantity)}`;
  }
  if ('totalRequestedQuantity' in row) {
    return `申请 ${formatDecimal(row.totalRequestedQuantity)} / 已处置 ${formatDecimal(row.totalDisposedQuantity)}`;
  }
  return `行数 ${row.lineCount} / 已盘 ${row.countedLineCount} / 差异 ${row.differenceLineCount}`;
}

async function loadPage() {
  loading.value = true;
  loadError.value = '';
  try {
    const params: Record<string, unknown> = {
      keyword: query.keyword.trim() || undefined,
      pageNo: pageNo.value,
      pageSize: pageSize.value,
      status: query.status,
    };
    if (query.extraFilter.trim()) {
      params[profile.value.extraFilterProp] = query.extraFilter.trim();
    }
    const result =
      workspaceKey.value === 'supplier-return'
        ? await getCloudMoldSupplierReturnPage(
            params as unknown as CloudMoldWarehouseApi.SupplierReturnPageParams,
          )
        : workspaceKey.value === 'inventory-scrap'
          ? await getCloudMoldInventoryScrapPage(
              params as unknown as CloudMoldWarehouseApi.InventoryScrapPageParams,
            )
          : await getCloudMoldStockCountPage(
              params as unknown as CloudMoldWarehouseApi.StockCountPageParams,
            );
    rows.value = result.list as TableRow[];
    total.value = result.total;
  } catch (error) {
    loadError.value =
      error instanceof Error ? error.message : `${profile.value.title}加载失败`;
  } finally {
    loading.value = false;
  }
}

function search() {
  pageNo.value = 1;
  void loadPage();
}

function reset() {
  query.extraFilter = '';
  query.keyword = '';
  query.status = undefined;
  pageNo.value = 1;
  void loadPage();
}

function changePage(page: number, size: number) {
  pageNo.value = page;
  pageSize.value = size;
  void loadPage();
}

async function openDetail(row: TableRow) {
  detailOpen.value = true;
  detailLoading.value = true;
  detail.value = undefined;
  try {
    detail.value =
      workspaceKey.value === 'supplier-return'
        ? await getCloudMoldSupplierReturn(getRowId(row))
        : workspaceKey.value === 'inventory-scrap'
          ? await getCloudMoldInventoryScrap(getRowId(row))
          : await getCloudMoldStockCount(getRowId(row));
  } catch (error) {
    message.error(error instanceof Error ? error.message : '详情加载失败');
  } finally {
    detailLoading.value = false;
  }
}

function rowActions(row: TableRow): ActionDefinition[] {
  const status = getRowStatus(row);
  if (workspaceKey.value === 'supplier-return') {
    if (status === 'DRAFT') {
      return [
        {
          label: '提交',
          operation: 'SUBMIT',
          permission: profile.value.actionPermission,
        },
      ];
    }
    if (status === 'SUBMITTED') {
      return [
        {
          label: '批准',
          operation: 'APPROVE',
          permission: profile.value.actionPermission,
        },
        {
          label: '取消',
          operation: 'CANCEL',
          permission: profile.value.actionPermission,
          mode: 'cancel',
          danger: true,
        },
      ];
    }
    if (['APPROVED', 'DISPATCHED', 'PARTIALLY_DISPATCHED'].includes(status)) {
      return [
        {
          label: '详情',
          operation: 'DETAIL',
          permission: profile.value.queryPermission,
        },
      ];
    }
  }
  if (workspaceKey.value === 'inventory-scrap') {
    if (status === 'DRAFT') {
      return [
        {
          label: '提交',
          operation: 'SUBMIT',
          permission: profile.value.actionPermission,
        },
      ];
    }
    if (status === 'SUBMITTED') {
      return [
        {
          label: '批准',
          operation: 'APPROVE',
          permission: profile.value.actionPermission,
        },
        {
          label: '取消',
          operation: 'CANCEL',
          permission: profile.value.actionPermission,
          danger: true,
        },
      ];
    }
    if (['APPROVED', 'DISPOSED', 'PARTIALLY_DISPOSED'].includes(status)) {
      return [
        {
          label: '详情',
          operation: 'DETAIL',
          permission: profile.value.queryPermission,
        },
      ];
    }
  }
  if (status === 'DRAFT') {
    return [
      {
        label: '提交',
        operation: 'SUBMIT',
        permission: profile.value.actionPermission,
      },
    ];
  }
  if (status === 'SUBMITTED') {
    return [
      {
        label: '开始盘点',
        operation: 'START_COUNTING',
        permission: profile.value.actionPermission,
      },
      {
        label: '取消',
        operation: 'CANCEL',
        permission: profile.value.actionPermission,
        danger: true,
      },
    ];
  }
  if (status === 'COUNTED') {
    return [
      {
        label: '批准差异',
        operation: 'APPROVE_DIFFERENCE',
        permission: profile.value.actionPermission,
      },
    ];
  }
  if (status === 'DIFFERENCE_APPROVED') {
    return [
      {
        label: '执行入账',
        operation: 'ADJUST',
        permission: profile.value.actionPermission,
      },
    ];
  }
  if (status === 'ADJUSTED') {
    return [
      {
        label: '完成',
        operation: 'COMPLETE',
        permission: profile.value.actionPermission,
      },
    ];
  }
  return [
    {
      label: '详情',
      operation: 'DETAIL',
      permission: profile.value.queryPermission,
    },
  ];
}

function detailActions(row: DetailRow): ActionDefinition[] {
  const status = getRowStatus(row as TableRow);
  if (workspaceKey.value === 'supplier-return') {
    if (['APPROVED', 'PARTIALLY_DISPATCHED'].includes(status)) {
      return [
        {
          label: '登记退供发运',
          operation: 'DISPATCH',
          permission: profile.value.actionPermission,
          mode: 'dispatch-batch',
        },
      ];
    }
    return status === 'DISPATCHED'
      ? [
          {
            label: '完成退供',
            operation: 'COMPLETE',
            permission: profile.value.actionPermission,
          },
        ]
      : [];
  }
  if (workspaceKey.value === 'inventory-scrap') {
    if (['APPROVED', 'PARTIALLY_DISPOSED'].includes(status)) {
      return [
        {
          label: '登记处置批次',
          operation: 'RECORD_DISPOSITION_BATCH',
          permission: profile.value.actionPermission,
          mode: 'disposition-batch',
        },
      ];
    }
    return status === 'DISPOSED'
      ? [
          {
            label: '完成报废',
            operation: 'COMPLETE',
            permission: profile.value.actionPermission,
          },
        ]
      : [];
  }
  return status === 'COUNTING'
    ? [
        {
          label: '记录盘点批次',
          operation: 'RECORD_COUNT_BATCH',
          permission: profile.value.actionPermission,
          mode: 'count-batch',
        },
      ]
    : [];
}

function buildBatchLines() {
  if (!detail.value) return [];
  if (workspaceKey.value === 'supplier-return') {
    return (detail.value as CloudMoldWarehouseApi.SupplierReturnDetail).lines
      .filter((line) => Number(line.outstandingQuantity) > 0)
      .map((line) => ({
        id: line.returnLineId,
        lineNumber: line.lineNumber,
        quantity: Number(line.outstandingQuantity),
        quantityLabel: line.uomCode,
        remark: '',
      }));
  }
  if (workspaceKey.value === 'inventory-scrap') {
    return (detail.value as CloudMoldWarehouseApi.InventoryScrapDetail).lines
      .filter(
        (line) =>
          Number(line.requestedQuantity) > Number(line.disposedQuantity),
      )
      .map((line) => ({
        id: line.lineId,
        lineNumber: line.lineNumber,
        quantity:
          Number(line.requestedQuantity) - Number(line.disposedQuantity),
        quantityLabel: line.baseUomCode,
        remark: '',
      }));
  }
  return (detail.value as CloudMoldWarehouseApi.StockCountDetail).lines.map(
    (line) => ({
      id: line.lineId,
      lineNumber: line.lineNumber,
      quantity: Number(line.bookOnHandQuantity),
      quantityLabel: line.baseUomCode,
      remark: '',
    }),
  );
}

function openCommandModal(
  mode: CommandModalMode,
  operation: string,
  title: string,
) {
  commandMode.value = mode;
  pendingOperation.value = operation;
  pendingActionTitle.value = title;
  commandForm.note = '';
  commandForm.reasonCode = 'MANUAL_CANCEL';
  commandForm.proofRef = '';
  commandForm.proofType = 'QUALITY';
  commandForm.dispositionType = 'DESTROYED';
  commandLines.value =
    mode === 'dispatch-batch' ||
    mode === 'count-batch' ||
    mode === 'disposition-batch'
      ? buildBatchLines()
      : [];
  commandOpen.value = true;
}

async function runSimpleCommand(operation: string) {
  if (!detail.value) return;
  const envelope = buildCommandEnvelope();
  const hide = message.loading({
    content: `正在执行${pendingActionTitle.value || operation}…`,
    duration: 0,
  });
  try {
    if (workspaceKey.value === 'supplier-return') {
      await executeCloudMoldSupplierReturnCommand({
        ...envelope,
        expectedVersion: getRowVersion(detail.value),
        operation: operation as CloudMoldWarehouseApi.SupplierReturnOperation,
        returnId: (detail.value as CloudMoldWarehouseApi.SupplierReturnDetail)
          .returnId,
      });
    } else if (workspaceKey.value === 'inventory-scrap') {
      await executeCloudMoldInventoryScrapCommand({
        ...envelope,
        operation: operation as CloudMoldWarehouseApi.InventoryScrapOperation,
        scrapId: (detail.value as CloudMoldWarehouseApi.InventoryScrapDetail)
          .scrapId,
      });
    } else {
      await executeCloudMoldStockCountCommand({
        ...envelope,
        operation: operation as CloudMoldWarehouseApi.StockCountOperation,
        stockCountId: (detail.value as CloudMoldWarehouseApi.StockCountDetail)
          .stockCountId,
      });
    }
    message.success('操作已提交');
    commandOpen.value = false;
    await refreshAfterCommand();
  } catch (error) {
    message.error(error instanceof Error ? error.message : '命令执行失败');
  } finally {
    hide();
  }
}

async function submitModalCommand() {
  if (!detail.value) return;
  commandLoading.value = true;
  const envelope = buildCommandEnvelope();
  try {
    if (workspaceKey.value === 'supplier-return') {
      // oxlint-disable-next-line unicorn/prefer-ternary -- each branch constructs a different domain command.
      if (commandMode.value === 'cancel') {
        await executeCloudMoldSupplierReturnCommand({
          ...envelope,
          cancel: {
            reasonCode: commandForm.reasonCode,
            remark: commandForm.note || undefined,
          },
          expectedVersion: getRowVersion(detail.value),
          operation: 'CANCEL',
          returnId: (detail.value as CloudMoldWarehouseApi.SupplierReturnDetail)
            .returnId,
        });
      } else {
        await executeCloudMoldSupplierReturnCommand({
          ...envelope,
          dispatchBatch: {
            batchId: crypto.randomUUID(),
            batchNo: `SRDSP-${Date.now()}`,
            lines: commandLines.value
              .filter((line) => line.quantity > 0)
              .map((line) => ({
                dispatchQuantity: String(line.quantity),
                executionLineId: crypto.randomUUID(),
                lineNumber: line.lineNumber,
                remark: line.remark || undefined,
                returnLineId: line.id,
              })),
            remark: commandForm.note || undefined,
          },
          expectedVersion: getRowVersion(detail.value),
          operation: 'DISPATCH',
          returnId: (detail.value as CloudMoldWarehouseApi.SupplierReturnDetail)
            .returnId,
        });
      }
    } else if (workspaceKey.value === 'inventory-scrap') {
      // oxlint-disable-next-line unicorn/prefer-ternary -- disposal and cancellation have distinct command payloads.
      if (commandMode.value === 'disposition-batch') {
        await executeCloudMoldInventoryScrapCommand({
          ...envelope,
          dispositionBatch: {
            batchId: crypto.randomUUID(),
            batchNo: `SCRAPB-${Date.now()}`,
            dispositionType: commandForm.dispositionType,
            lines: commandLines.value
              .filter((line) => line.quantity > 0)
              .map((line) => ({
                disposedQuantity: String(line.quantity),
                dispositionLineId: crypto.randomUUID(),
                lineNumber: line.lineNumber,
                remark: line.remark || undefined,
              })),
            proofRef: commandForm.proofRef || undefined,
            proofType: commandForm.proofType || undefined,
            remark: commandForm.note || undefined,
          },
          operation: 'RECORD_DISPOSITION_BATCH',
          scrapId: (detail.value as CloudMoldWarehouseApi.InventoryScrapDetail)
            .scrapId,
        });
      } else {
        await executeCloudMoldInventoryScrapCommand({
          ...envelope,
          operation: 'CANCEL',
          scrapId: (detail.value as CloudMoldWarehouseApi.InventoryScrapDetail)
            .scrapId,
        });
      }
    } else {
      await executeCloudMoldStockCountCommand({
        ...envelope,
        countBatch: {
          batchId: crypto.randomUUID(),
          batchNo: `STKCBT-${Date.now()}`,
          lines: commandLines.value.map((line) => ({
            countedOnHandQuantity: String(line.quantity),
            executionLineId: crypto.randomUUID(),
            remark: line.remark || undefined,
            stockCountLineId: line.id,
          })),
          remark: commandForm.note || undefined,
        },
        operation: 'RECORD_COUNT_BATCH',
        stockCountId: (detail.value as CloudMoldWarehouseApi.StockCountDetail)
          .stockCountId,
      });
    }
    message.success('命令已提交');
    commandOpen.value = false;
    await refreshAfterCommand();
  } catch (error) {
    message.error(error instanceof Error ? error.message : '命令执行失败');
  } finally {
    commandLoading.value = false;
  }
}

async function refreshAfterCommand() {
  await loadPage();
  if (detail.value) {
    await openDetail({
      ...(rows.value.find(
        (row) =>
          getRowId(row) === getRowId(detail.value as unknown as TableRow),
      ) ?? {
        [workspaceKey.value === 'inventory-scrap'
          ? 'scrapId'
          : workspaceKey.value === 'stock-count'
            ? 'stockCountId'
            : 'returnId']: getRowId(detail.value as unknown as TableRow),
      }),
    } as TableRow);
  }
}

function detailHeader(detailRow: DetailRow) {
  if ('returnCode' in detailRow)
    return `${detailRow.returnCode} · ${detailRow.currentStageLabel}`;
  if ('scrapCode' in detailRow)
    return `${detailRow.scrapCode} · ${detailRow.scrapStatus}`;
  return `${detailRow.stockCountCode} · ${detailRow.scopeLabel}`;
}

function detailLineRows(detailRow: DetailRow) {
  if ('dispatchBatches' in detailRow) return detailRow.lines;
  if ('dispositionBatches' in detailRow) return detailRow.lines;
  return detailRow.lines;
}

function historyRows(detailRow: DetailRow) {
  if ('dispatchBatches' in detailRow) return detailRow.statusHistory;
  if ('dispositionBatches' in detailRow) return detailRow.statusHistory;
  return detailRow.statusHistory;
}

function historyStatus(
  history:
    | CloudMoldWarehouseApi.InventoryScrapHistory
    | CloudMoldWarehouseApi.StockCountHistory
    | CloudMoldWarehouseApi.SupplierReturnHistory,
) {
  return 'scrapStatus' in history ? history.scrapStatus : history.stageLabel;
}

onMounted(loadPage);
</script>

<template>
  <Page :description="profile.description" :title="profile.title">
    <Alert
      class="mb-4"
      :message="`${profile.title}只读写正式 CloudMold 权威对象`"
      description="页面只调用当前工作树的正式 API、状态机与聚合详情，不再依赖旧 ERP/WMS 模块入口。"
      show-icon
      type="info"
    />

    <Row :gutter="16" class="mb-4">
      <Col :lg="6" :xs="12">
        <Card>
          <Statistic title="当前页草稿" :value="currentPagePending" />
        </Card>
      </Col>
      <Col :lg="6" :xs="12">
        <Card>
          <Statistic title="当前页处理中" :value="currentPageInProgress" />
        </Card>
      </Col>
      <Col :lg="6" :xs="12">
        <Card>
          <Statistic title="当前页待收口" :value="currentPageExceptions" />
        </Card>
      </Col>
      <Col :lg="6" :xs="12">
        <Card>
          <Statistic title="当前页终态" :value="currentPageTerminal" />
        </Card>
      </Col>
    </Row>

    <Card class="mb-4">
      <Space wrap>
        <Input
          v-model:value="query.keyword"
          allow-clear
          :placeholder="`搜索${profile.codeLabel}、业务引用或对象标识`"
          style="width: 320px"
          @press-enter="search"
        />
        <Select
          v-model:value="query.status"
          allow-clear
          :options="profile.statusOptions"
          placeholder="全部状态"
          style="width: 180px"
        />
        <Input
          v-model:value="query.extraFilter"
          allow-clear
          :placeholder="profile.extraFilterPlaceholder"
          style="width: 220px"
          @press-enter="search"
        />
        <Button type="primary" @click="search">查询</Button>
        <Button @click="reset">重置</Button>
      </Space>
    </Card>

    <Card :title="`${profile.title}列表`">
      <template #extra>
        <Tag color="blue">{{ profile.detailTag }}</Tag>
      </template>
      <Alert
        v-if="loadError"
        class="mb-4"
        :message="loadError"
        show-icon
        type="error"
      />
      <Table
        :columns="tableColumns"
        :data-source="rows"
        :loading="loading"
        :pagination="{
          current: pageNo,
          pageSize,
          showSizeChanger: true,
          total,
        }"
        :row-key="(record) => getRowId(record as TableRow)"
        :scroll="{ x: 1350 }"
        @change="
          (pagination) =>
            changePage(pagination.current ?? 1, pagination.pageSize ?? 20)
        "
      >
        <template #emptyText>
          <Empty :description="profile.emptyText" />
        </template>
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'document'">
            <div class="font-medium text-primary">
              {{ getRowCode(asTableRow(record)) }}
            </div>
            <div class="text-xs text-muted-foreground">
              {{ getRowId(asTableRow(record)) }}
            </div>
          </template>
          <template v-else-if="column.key === 'summary'">
            <div class="font-medium">{{ rowSummary(asTableRow(record)) }}</div>
          </template>
          <template v-else-if="column.key === 'quantity'">
            <div>{{ rowQuantity(asTableRow(record)) }}</div>
          </template>
          <template v-else-if="column.key === 'status'">
            <StatusTag v-bind="statusMeta(getRowStatus(asTableRow(record)))" />
            <div
              v-if="'currentStageLabel' in record"
              class="text-xs text-muted-foreground"
            >
              {{ record.currentStageLabel }}
            </div>
          </template>
          <template v-else-if="column.key === 'updatedAt'">
            {{ getUpdatedAt(asTableRow(record)) }}
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button
                type="link"
                size="small"
                @click="openDetail(asTableRow(record))"
              >
                详情
              </Button>
              <template
                v-for="action in rowActions(asTableRow(record))"
                :key="action.label"
              >
                <Button
                  v-if="action.operation !== 'DETAIL'"
                  v-access:code="[action.permission]"
                  :danger="action.danger"
                  size="small"
                  type="link"
                  @click="
                    action.mode
                      ? openCommandModal(
                          action.mode,
                          action.operation,
                          action.label,
                        )
                      : ((pendingActionTitle = action.label),
                        (detail = record as never),
                        runSimpleCommand(action.operation))
                  "
                >
                  {{ action.label }}
                </Button>
              </template>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <Drawer
      v-model:open="detailOpen"
      destroy-on-close
      :title="detail ? detailHeader(detail) : profile.title"
      width="960"
    >
      <template v-if="detail" #extra>
        <Space>
          <template v-for="action in detailActions(detail)" :key="action.label">
            <Button
              v-access:code="[action.permission]"
              :type="action.mode ? 'default' : 'primary'"
              @click="
                action.mode
                  ? openCommandModal(
                      action.mode,
                      action.operation,
                      action.label,
                    )
                  : ((pendingActionTitle = action.label),
                    runSimpleCommand(action.operation))
              "
            >
              {{ action.label }}
            </Button>
          </template>
        </Space>
      </template>
      <template v-if="detailLoading">
        <Card loading />
      </template>
      <template v-else-if="detail">
        <Descriptions :column="2" bordered size="small">
          <Descriptions.Item :label="profile.codeLabel">
            {{
              'returnCode' in detail
                ? detail.returnCode
                : 'scrapCode' in detail
                  ? detail.scrapCode
                  : detail.stockCountCode
            }}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <StatusTag
              v-bind="statusMeta(getRowStatus(detail as unknown as TableRow))"
            />
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {{ detail.createdAt }}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {{ detail.updatedAt }}
          </Descriptions.Item>
          <Descriptions.Item
            v-if="'purchaseOrderId' in detail"
            label="采购/收货"
          >
            {{ detail.purchaseOrderId }} / {{ detail.receiptId }}
          </Descriptions.Item>
          <Descriptions.Item v-if="'supplierId' in detail" label="供应商">
            {{ detail.supplierId }}
          </Descriptions.Item>
          <Descriptions.Item v-if="'scrapId' in detail" label="货主">
            {{ detail.ownerType }} / {{ detail.ownerId }}
          </Descriptions.Item>
          <Descriptions.Item v-if="'warehouseId' in detail" label="仓库">
            {{ detail.warehouseId }}
          </Descriptions.Item>
          <Descriptions.Item v-if="'scopeType' in detail" label="盘点范围">
            {{ detail.scopeType }} / {{ detail.scopeLabel }}
          </Descriptions.Item>
          <Descriptions.Item
            v-if="'freezeLedgerTransactionId' in detail"
            label="冻结账本"
          >
            {{ detail.freezeLedgerTransactionId ?? '-' }}
          </Descriptions.Item>
        </Descriptions>

        <Card class="mt-4" title="业务行">
          <Table
            :data-source="detailLineRows(detail)"
            :pagination="false"
            row-key="lineNumber"
            size="small"
          >
            <Table.Column
              key="lineNumber"
              data-index="lineNumber"
              title="行号"
              width="80"
            />
            <Table.Column
              key="canonicalSkuId"
              data-index="canonicalSkuId"
              title="规范 SKU"
            />
            <Table.Column key="status" title="状态" width="140">
              <template #default="{ record }">
                <StatusTag
                  v-bind="
                    statusMeta(
                      record.lineStatus ?? record.countStatus ?? record.status,
                    )
                  "
                />
              </template>
            </Table.Column>
            <Table.Column key="quantity" title="数量 / 证据">
              <template #default="{ record }">
                <template v-if="'returnQuantity' in record">
                  退供 {{ formatDecimal(record.returnQuantity) }}
                  {{ record.uomCode }}
                  <div class="text-xs text-muted-foreground">
                    已发运 {{ formatDecimal(record.dispatchedQuantity) }} /
                    待发运
                    {{ formatDecimal(record.outstandingQuantity) }}
                  </div>
                </template>
                <template v-else-if="'requestedQuantity' in record">
                  申请 {{ formatDecimal(record.requestedQuantity) }}
                  {{ record.baseUomCode }}
                  <div class="text-xs text-muted-foreground">
                    已处置 {{ formatDecimal(record.disposedQuantity) }} ·
                    {{ record.evidenceType ?? '无证据类型' }}
                  </div>
                </template>
                <template v-else>
                  账面 {{ formatDecimal(record.bookOnHandQuantity) }}
                  {{ record.baseUomCode }}
                  <div class="text-xs text-muted-foreground">
                    实盘 {{ formatDecimal(record.countedOnHandQuantity) }} ·
                    差异
                    {{ formatDecimal(record.differenceQuantity) }}
                  </div>
                </template>
              </template>
            </Table.Column>
          </Table>
        </Card>

        <Card class="mt-4" title="状态历史">
          <Timeline>
            <Timeline.Item
              v-for="history in historyRows(detail)"
              :key="history.historyId"
            >
              <div class="font-medium">
                {{ historyStatus(history) }}
              </div>
              <div class="text-xs text-muted-foreground">
                {{ history.changedAt }}
              </div>
            </Timeline.Item>
          </Timeline>
        </Card>
      </template>
    </Drawer>

    <Modal
      v-model:open="commandOpen"
      :confirm-loading="commandLoading"
      :title="pendingActionTitle"
      width="820"
      @ok="submitModalCommand"
    >
      <Form layout="vertical">
        <Form.Item v-if="commandMode === 'cancel'" label="取消原因码" required>
          <Input v-model:value="commandForm.reasonCode" />
        </Form.Item>
        <Form.Item
          v-if="commandMode === 'disposition-batch'"
          label="处置类型"
          required
        >
          <Select
            v-model:value="commandForm.dispositionType"
            :options="[
              { label: '销毁', value: 'DESTROYED' },
              { label: '回收', value: 'RECYCLED' },
            ]"
          />
        </Form.Item>
        <Form.Item
          v-if="commandMode === 'disposition-batch'"
          label="证明类型 / 证明引用"
        >
          <Space.Compact block>
            <Input
              v-model:value="commandForm.proofType"
              placeholder="QUALITY"
            />
            <Input
              v-model:value="commandForm.proofRef"
              placeholder="evidence:batch-001"
            />
          </Space.Compact>
        </Form.Item>
        <Form.Item v-if="commandMode !== 'none'" label="备注">
          <Input.TextArea v-model:value="commandForm.note" :rows="3" />
        </Form.Item>
      </Form>

      <Table
        v-if="commandLines.length > 0"
        :data-source="commandLines"
        :pagination="false"
        row-key="id"
        size="small"
      >
        <Table.Column
          key="lineNumber"
          data-index="lineNumber"
          title="行号"
          width="80"
        />
        <Table.Column key="quantity" title="执行数量">
          <template #default="{ record }">
            <InputNumber
              v-model:value="record.quantity"
              :min="0"
              :precision="6"
              style="width: 180px"
            />
            <span class="ml-2 text-xs text-muted-foreground">
              {{ record.quantityLabel }}
            </span>
          </template>
        </Table.Column>
        <Table.Column key="remark" title="行备注">
          <template #default="{ record }">
            <Input v-model:value="record.remark" />
          </template>
        </Table.Column>
      </Table>
    </Modal>
  </Page>
</template>
