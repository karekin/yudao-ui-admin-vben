<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import type {
  FinanceAction,
  FinanceRow,
  FinanceWorkspace,
} from './presentation';

import type { CloudMoldFinanceApi } from '#/api/cloudmold/finance';

import { computed, onMounted, reactive, ref, watch } from 'vue';
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
  Popconfirm,
  Progress,
  Row,
  Select,
  Space,
  Statistic,
  Steps,
  Table,
  Tabs,
  Tag,
} from 'ant-design-vue';

import {
  approveMatchOverride,
  executeSupplierInvoiceCommand,
  executeSupplierPaymentCommand,
  getApInstallmentPage,
  getJournal,
  getJournalPage,
  getMatchExceptionPage,
  getSupplierInvoice,
  getSupplierInvoicePage,
  getSupplierPaymentPage,
  reverseJournal,
} from '#/api/cloudmold/finance';

import {
  addInt64Strings,
  financeActions,
  financeRowId,
  financeStatusMeta,
  formatMinorMoney,
  isBalancedJournal,
  subtractInt64Strings,
} from './presentation';

defineOptions({ name: 'CloudMoldProcureToPay' });

const route = useRoute();
const workspace = ref<FinanceWorkspace>('INVOICE');
const rows = ref<FinanceRow[]>([]);
const loading = ref(false);
const loadError = ref('');
const commandBusyId = ref('');
const keyword = ref('');
const status = ref<string>();
const pageNo = ref(1);
const pageSize = ref(20);
const total = ref(0);
const journalOpen = ref(false);
const journalLoading = ref(false);
const journal = ref<CloudMoldFinanceApi.JournalDetail>();
const invoiceOpen = ref(false);
const invoiceLoading = ref(false);
const invoiceDetail = ref<CloudMoldFinanceApi.SupplierInvoiceDetail>();
const actionModalOpen = ref(false);
const pendingAction = ref<{ action: FinanceAction; row: FinanceRow }>();
const actionForm = reactive({
  accountingDate: '',
  accountingPeriodId: '',
  bankReference: '',
  currencyCode: 'CNY',
  evidenceSha256: '',
  matchPolicyId: '',
  matchPolicyVersion: undefined as number | undefined,
  reasonCode: '',
  settledAmountMinor: '',
  settlementDate: '',
});

const workspaces: Array<{ key: FinanceWorkspace; label: string }> = [
  { key: 'INVOICE', label: 'Supplier Invoice' },
  { key: 'MATCH_EXCEPTION', label: '三单匹配异常' },
  { key: 'AP', label: 'AP 分期' },
  { key: 'PAYMENT', label: '付款核销' },
  { key: 'JOURNAL', label: '会计分录与反冲' },
];

const statusOptions = [
  'DRAFT',
  'SUBMITTED',
  'MATCHED',
  'EXCEPTION',
  'APPROVED',
  'POSTED',
  'OPEN',
  'PARTIALLY_PAID',
  'PAID',
  'RELEASED',
  'EXECUTED',
  'SETTLED',
  'REVERSED',
].map((value) => ({ label: financeStatusMeta(value).label, value }));

const currentPageOpen = computed(
  () =>
    rows.value.filter((row) =>
      ['DRAFT', 'OPEN', 'SUBMITTED'].includes(row.status),
    ).length,
);
const currentPageExceptions = computed(
  () =>
    rows.value.filter((row) => ['EXCEPTION', 'OPEN'].includes(row.status))
      .length,
);
const currentPagePosted = computed(
  () =>
    rows.value.filter((row) =>
      ['PAID', 'POSTED', 'SETTLED'].includes(row.status),
    ).length,
);
const currentPageRiskAmount = computed(() => {
  const amountMinors: string[] = [];
  for (const row of rows.value) {
    if ('openAmountMinor' in row) amountMinors.push(row.openAmountMinor);
    else if (
      'grossAmountMinor' in row &&
      ['EXCEPTION', 'SUBMITTED'].includes(row.status)
    ) {
      amountMinors.push(row.grossAmountMinor);
    }
  }
  return addInt64Strings(amountMinors);
});

const columns = computed<TableColumnsType>(() => [
  { key: 'document', title: '单据与来源', width: 280 },
  { key: 'party', title: '供应商 / 业务对象', width: 230 },
  { key: 'amount', title: '金额与核销', width: 230 },
  { key: 'status', title: '状态与控制', width: 180 },
  { dataIndex: 'updatedAt', key: 'updatedAt', title: '更新时间', width: 180 },
  { key: 'action', fixed: 'right' as const, title: '操作', width: 220 },
]);

async function loadPage() {
  loading.value = true;
  loadError.value = '';
  const params = {
    keyword: keyword.value.trim() || undefined,
    pageNo: pageNo.value,
    pageSize: pageSize.value,
    status: status.value,
  };
  try {
    const loaders = {
      AP: getApInstallmentPage,
      INVOICE: getSupplierInvoicePage,
      JOURNAL: getJournalPage,
      MATCH_EXCEPTION: getMatchExceptionPage,
      PAYMENT: getSupplierPaymentPage,
    };
    const result = await loaders[workspace.value](params);
    rows.value = result.list as FinanceRow[];
    total.value = result.total;
  } catch (error) {
    rows.value = [];
    total.value = 0;
    loadError.value =
      error instanceof Error ? error.message : '采购到付款工作台加载失败';
  } finally {
    loading.value = false;
  }
}

function search() {
  pageNo.value = 1;
  void loadPage();
}
function reset() {
  keyword.value = '';
  status.value = undefined;
  pageNo.value = 1;
  void loadPage();
}

function asFinanceRow(row: Record<string, any>) {
  return row as FinanceRow;
}

function asJournalRow(row: Record<string, any>) {
  return row as CloudMoldFinanceApi.JournalPageItem;
}

function rowVersion(row: FinanceRow) {
  return 'aggregateVersion' in row ? row.aggregateVersion : 0;
}

async function runDirect(row: FinanceRow, action: FinanceAction) {
  const id = financeRowId(workspace.value, row);
  commandBusyId.value = `${id}:${action.operation}`;
  try {
    const result: CloudMoldFinanceApi.CommandResult =
      workspace.value === 'INVOICE'
        ? await executeSupplierInvoiceCommand({
            expectedVersion: rowVersion(row),
            operation:
              action.operation as CloudMoldFinanceApi.InvoiceTransitionCommand['operation'],
            supplierInvoiceId: id,
          })
        : await executeSupplierPaymentCommand({
            expectedVersion: rowVersion(row),
            operation: action.operation as CloudMoldFinanceApi.PaymentOperation,
            paymentInstructionId: id,
          });
    message[result.duplicate ? 'warning' : 'success'](
      result.duplicate ? '操作已被幂等处理' : `${action.label}成功`,
    );
    await loadPage();
  } catch (error) {
    message.error(
      `${action.label}失败：${error instanceof Error ? error.message : '服务未完成该命令'}`,
    );
  } finally {
    commandBusyId.value = '';
  }
}

function clearActionForm() {
  Object.assign(actionForm, {
    accountingDate: '',
    accountingPeriodId: '',
    bankReference: '',
    currencyCode: 'CNY',
    evidenceSha256: '',
    matchPolicyId: '',
    matchPolicyVersion: undefined,
    reasonCode: '',
    settledAmountMinor: '',
    settlementDate: '',
  });
}

function requestAction(row: FinanceRow, action: FinanceAction) {
  if (action.kind === 'DIRECT') {
    void runDirect(row, action);
    return;
  }
  clearActionForm();
  if ('currencyCode' in row) actionForm.currencyCode = row.currencyCode;
  if ('settledAmountMinor' in row)
    actionForm.settledAmountMinor = subtractInt64Strings(
      row.totalAmountMinor,
      row.settledAmountMinor,
    );
  pendingAction.value = { action, row };
  actionModalOpen.value = true;
}

function requireValue(value: unknown, label: string) {
  if (value === undefined || value === null || String(value).trim() === '')
    throw new Error(`请填写${label}`);
}

function requirePositiveInt64(value: string, label: string) {
  requireValue(value, label);
  if (!/^\d+$/.test(value) || BigInt(value) <= 0n)
    throw new Error(`${label}必须是正整数最小货币单位`);
  if (BigInt(value) > 9_223_372_036_854_775_807n)
    throw new Error(`${label}超出 int64 范围`);
}

function invoiceSettlementProgress(
  detail: CloudMoldFinanceApi.SupplierInvoiceDetail,
) {
  if (detail.status === 'POSTED') return 100;
  if (detail.paymentInstructions.length > 0) return 60;
  return 0;
}

async function submitActionModal() {
  const pending = pendingAction.value;
  if (!pending) return;
  const { action, row } = pending;
  const id = financeRowId(workspace.value, row);
  commandBusyId.value = `${id}:${action.operation}`;
  try {
    let result: CloudMoldFinanceApi.CommandResult;
    if (action.kind === 'RUN_MATCH') {
      requireValue(actionForm.matchPolicyId, '匹配策略 ID');
      requireValue(actionForm.matchPolicyVersion, '匹配策略版本');
      result = await executeSupplierInvoiceCommand({
        expectedVersion: rowVersion(row),
        matchPolicyId: actionForm.matchPolicyId,
        matchPolicyVersion: actionForm.matchPolicyVersion!,
        operation: 'RUN_THREE_WAY_MATCH',
        supplierInvoiceId: id,
      });
    } else if (action.kind === 'MATCH_OVERRIDE') {
      requireValue(actionForm.reasonCode, '例外原因');
      requireValue(actionForm.evidenceSha256, '审批证据 SHA-256');
      result = await approveMatchOverride({
        exceptionId: id,
        expectedVersion: rowVersion(row),
        operation: 'APPROVE_MATCH_OVERRIDE',
        reasonCode: actionForm.reasonCode,
        resolutionEvidenceSha256: actionForm.evidenceSha256,
      });
    } else if (action.kind === 'SETTLE_PAYMENT') {
      requireValue(actionForm.bankReference, '银行流水号');
      requireValue(actionForm.settlementDate, '结算日期');
      requirePositiveInt64(actionForm.settledAmountMinor, '结算金额');
      requireValue(actionForm.evidenceSha256, '结算证据 SHA-256');
      result = await executeSupplierPaymentCommand({
        bankReference: actionForm.bankReference,
        currencyCode: actionForm.currencyCode,
        expectedVersion: rowVersion(row),
        operation: 'SETTLE_SUPPLIER_PAYMENT',
        paymentInstructionId: id,
        settledAmountMinor: actionForm.settledAmountMinor,
        settlementDate: actionForm.settlementDate,
        settlementEvidenceSha256: actionForm.evidenceSha256,
        settlementId: crypto.randomUUID(),
      });
    } else {
      requireValue(actionForm.accountingDate, '会计日期');
      requireValue(actionForm.accountingPeriodId, '会计期间');
      requireValue(actionForm.reasonCode, '反冲原因');
      requireValue(actionForm.evidenceSha256, '反冲证据 SHA-256');
      result = await reverseJournal({
        accountingDate: actionForm.accountingDate,
        accountingPeriodId: actionForm.accountingPeriodId,
        expectedVersion: rowVersion(row),
        operation: 'REVERSE_JOURNAL',
        originalJournalEntryId: id,
        reasonCode: actionForm.reasonCode,
        reversalEvidenceSha256: actionForm.evidenceSha256,
        reversalJournalCode: `REV-${crypto.randomUUID()}`,
        reversalJournalEntryId: crypto.randomUUID(),
      });
    }
    message[result.duplicate ? 'warning' : 'success'](
      result.duplicate ? '操作已被幂等处理' : `${action.label}成功`,
    );
    actionModalOpen.value = false;
    await loadPage();
  } catch (error) {
    message.error(
      `${action.label}失败：${error instanceof Error ? error.message : '服务未完成该命令'}`,
    );
  } finally {
    commandBusyId.value = '';
  }
}

async function openJournal(row: FinanceRow) {
  if (workspace.value !== 'JOURNAL') return;
  journalOpen.value = true;
  journalLoading.value = true;
  journal.value = undefined;
  try {
    journal.value = await getJournal(financeRowId(workspace.value, row));
  } catch (error) {
    message.error(error instanceof Error ? error.message : '分录详情加载失败');
  } finally {
    journalLoading.value = false;
  }
}

async function openInvoiceById(supplierInvoiceId: string) {
  invoiceOpen.value = true;
  invoiceLoading.value = true;
  invoiceDetail.value = undefined;
  try {
    invoiceDetail.value = await getSupplierInvoice(supplierInvoiceId);
  } catch (error) {
    message.error(
      error instanceof Error ? error.message : '供应商发票详情加载失败',
    );
  } finally {
    invoiceLoading.value = false;
  }
}

async function openInvoice(row: FinanceRow) {
  if (workspace.value !== 'INVOICE') return;
  await openInvoiceById(financeRowId(workspace.value, row));
}

function documentTitle(row: FinanceRow) {
  if ('invoiceCode' in row && 'supplierInvoiceNumber' in row)
    return row.invoiceCode;
  if ('exceptionCode' in row) return row.exceptionCode;
  if ('apOpenItemId' in row)
    return `${row.invoiceCode} · 第 ${row.installmentNumber} 期`;
  if ('paymentCode' in row) return row.paymentCode;
  if ('journalCode' in row) return row.journalCode;
  return '-';
}
function documentSubtitle(row: FinanceRow) {
  if ('supplierInvoiceNumber' in row)
    return `供应商发票 ${row.supplierInvoiceNumber}`;
  if ('matchRunId' in row) return `匹配运行 ${row.matchRunId}`;
  if ('apOpenItemId' in row) return `AP ${row.apOpenItemId}`;
  if ('paymentInstructionId' in row)
    return `付款指令 ${row.paymentInstructionId}`;
  if ('sourceAggregateType' in row)
    return `${row.sourceAggregateType} / ${row.sourceAggregateId}`;
  return '-';
}
function party(row: FinanceRow) {
  if ('supplierId' in row) return `供应商 ${row.supplierId}`;
  if ('invoiceCode' in row) return `发票 ${row.invoiceCode}`;
  if ('sourceAggregateType' in row) return row.sourceAggregateType;
  return '-';
}
function amount(row: FinanceRow) {
  if ('grossAmountMinor' in row)
    return formatMinorMoney(row.grossAmountMinor, row.currencyCode);
  if ('openAmountMinor' in row)
    return `未付 ${formatMinorMoney(row.openAmountMinor, row.currencyCode)}`;
  if ('totalAmountMinor' in row)
    return `${formatMinorMoney(row.settledAmountMinor, row.currencyCode)} / ${formatMinorMoney(row.totalAmountMinor, row.currencyCode)}`;
  if ('totalDebitAmountMinor' in row)
    return `借 ${formatMinorMoney(row.totalDebitAmountMinor, row.currencyCode)} / 贷 ${formatMinorMoney(row.totalCreditAmountMinor, row.currencyCode)}`;
  if ('actualAmountMinor' in row && row.actualAmountMinor !== undefined)
    return `实际 ${formatMinorMoney(row.actualAmountMinor, row.currencyCode)}`;
  return '-';
}

watch(workspace, () => {
  pageNo.value = 1;
  status.value = undefined;
  void loadPage();
});
onMounted(async () => {
  await loadPage();
  const supplierInvoiceId = route.params.supplierInvoiceId;
  if (typeof supplierInvoiceId === 'string' && supplierInvoiceId) {
    workspace.value = 'INVOICE';
    await openInvoiceById(supplierInvoiceId);
  }
});
</script>

<template>
  <Page
    description="Supplier Invoice、三单匹配、AP 分期、供应商付款与不可变会计分录共用一条审计链。"
    title="应付与匹配"
  >
    <Alert
      class="mb-4"
      description="Finance 只消费冻结的采购、收货、质检与库存证据；付款、核销和过账均以服务端校验结果为准。"
      message="采购到付款控制边界"
      show-icon
      type="info"
    />

    <Row :gutter="16" class="mb-4">
      <Col :lg="6" :sm="12" :xs="24">
        <Card class="metric-card">
          <Statistic title="待发票审批" :value="currentPageOpen" />
        </Card>
      </Col>
      <Col :lg="6" :sm="12" :xs="24">
        <Card class="metric-card">
          <Statistic title="待匹配 / 匹配异常" :value="currentPageExceptions" />
        </Card>
      </Col>
      <Col :lg="6" :sm="12" :xs="24">
        <Card class="metric-card">
          <Statistic title="已入账 / 已结算" :value="currentPagePosted" />
        </Card>
      </Col>
      <Col :lg="6" :sm="12" :xs="24">
        <Card class="metric-card">
          <Statistic
            title="应付余额"
            :value="formatMinorMoney(currentPageRiskAmount, 'CNY')"
          />
        </Card>
      </Col>
    </Row>

    <Card class="workbench-card">
      <Tabs v-model:active-key="workspace" :items="workspaces" />
      <div class="toolbar">
        <Space wrap>
          <Input
            v-model:value="keyword"
            allow-clear
            placeholder="发票、供应商、PO、付款或凭证"
            style="width: min(380px, 72vw)"
            @press-enter="search"
          />
          <Select
            v-model:value="status"
            allow-clear
            :options="statusOptions"
            placeholder="全部状态"
            style="width: 180px"
          />
          <Button type="primary" @click="search">查询</Button><Button @click="reset">重置</Button>
        </Space>
        <Tag color="purple">三账一致门禁</Tag>
      </div>
      <Alert
        v-if="loadError"
        class="mb-4"
        :message="loadError"
        show-icon
        type="error"
      />
      <Table
        :columns="columns"
        :data-source="rows"
        :loading="loading"
        :pagination="{
          current: pageNo,
          pageSize,
          showSizeChanger: true,
          total,
        }"
        :row-key="(row) => financeRowId(workspace, row as FinanceRow)"
        :scroll="{ x: 1280 }"
        @change="
          (pagination) => {
            pageNo = pagination.current ?? 1;
            pageSize = pagination.pageSize ?? 20;
            loadPage();
          }
        "
      >
        <template #emptyText>
          <Empty description="暂无符合条件的采购到付款事实" />
        </template>
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'document'">
            <Button
              v-if="workspace === 'JOURNAL'"
              class="document-link"
              type="link"
              @click="openJournal(asFinanceRow(record))"
            >
              {{ documentTitle(asFinanceRow(record)) }}
            </Button>
            <Button
              v-else-if="workspace === 'INVOICE'"
              class="document-link"
              type="link"
              @click="openInvoice(asFinanceRow(record))"
            >
              {{ documentTitle(asFinanceRow(record)) }}
            </Button>
            <div v-else class="document-title">
              {{ documentTitle(asFinanceRow(record)) }}
            </div>
            <div class="document-subtitle">
              {{ documentSubtitle(asFinanceRow(record)) }}
            </div>
          </template>
          <template v-else-if="column.key === 'party'">
            {{ party(asFinanceRow(record)) }}
          </template>
          <template v-else-if="column.key === 'amount'">
            <div class="amount-value">{{ amount(asFinanceRow(record)) }}</div>
            <Tag
              v-if="workspace === 'JOURNAL'"
              :color="
                isBalancedJournal(asJournalRow(record)) ? 'success' : 'error'
              "
            >
              {{
                isBalancedJournal(asJournalRow(record))
                  ? '借贷平衡'
                  : '借贷不平'
              }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <Tag :color="financeStatusMeta(record.status).color">
              {{ financeStatusMeta(record.status).label }}
            </Tag>
            <div v-if="'matchStatus' in record" class="document-subtitle">
              匹配：{{ record.matchStatus }}
            </div>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space :size="4">
              <Button
                v-if="workspace === 'JOURNAL'"
                type="link"
                @click="openJournal(asFinanceRow(record))"
              >
                详情
              </Button>
              <Button
                v-if="workspace === 'INVOICE'"
                type="link"
                @click="openInvoice(asFinanceRow(record))"
              >
                详情
              </Button>
              <template
                v-for="action in financeActions(workspace, record.status)"
                :key="action.operation"
              >
                <Popconfirm
                  v-if="action.kind === 'DIRECT'"
                  :description="`服务端会校验聚合版本 ${record.aggregateVersion}、职责分离与会计期间。`"
                  :title="`确认${action.label}？`"
                  @confirm="requestAction(asFinanceRow(record), action)"
                >
                  <Button
                    :loading="
                      commandBusyId ===
                      `${financeRowId(workspace, asFinanceRow(record))}:${action.operation}`
                    "
                    type="link"
                    v-access:code="['cloudmold:finance:procure-to-pay:command']"
                  >
                    {{ action.label }}
                  </Button>
                </Popconfirm>
                <Button
                  v-else
                  type="link"
                  v-access:code="['cloudmold:finance:procure-to-pay:command']"
                  @click="requestAction(asFinanceRow(record), action)"
                >
                  {{ action.label }}
                </Button>
              </template>
              <span v-if="workspace === 'AP'" class="immutable-note">由发票过账生成</span>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <Modal
      v-model:open="actionModalOpen"
      :confirm-loading="Boolean(commandBusyId)"
      :title="pendingAction?.action.label"
      width="640px"
      @ok="submitActionModal"
    >
      <Alert
        class="mb-4"
        message="证据与策略由服务端验证；缺失或不匹配时操作会失败关闭。"
        show-icon
        type="warning"
      />
      <Form layout="vertical">
        <template v-if="pendingAction?.action.kind === 'RUN_MATCH'">
          <Row :gutter="16">
            <Col :span="16">
              <Form.Item label="匹配策略 ID" required>
                <Input v-model:value="actionForm.matchPolicyId" />
              </Form.Item>
</Col><Col :span="8">
              <Form.Item label="策略版本" required>
                <InputNumber
                  v-model:value="actionForm.matchPolicyVersion"
                  :min="1"
                  class="w-full"
                />
              </Form.Item>
            </Col>
          </Row>
          <Alert
            description="数量、价格与税额容差由 Finance 按冻结的匹配策略版本读取，客户端不可覆盖。"
            message="服务端策略权威"
            show-icon
            type="info"
          />
        </template>
        <template v-else-if="pendingAction?.action.kind === 'MATCH_OVERRIDE'">
          <Form.Item label="例外审批原因" required>
            <Input v-model:value="actionForm.reasonCode" />
          </Form.Item>
          <Form.Item label="解决证据 SHA-256" required>
            <Input v-model:value="actionForm.evidenceSha256" :maxlength="64" />
          </Form.Item>
        </template>
        <template v-else-if="pendingAction?.action.kind === 'SETTLE_PAYMENT'">
          <Row :gutter="16">
            <Col :span="12">
              <Form.Item label="结算日期（YYYY-MM-DD）" required>
                <Input v-model:value="actionForm.settlementDate" />
              </Form.Item>
</Col><Col :span="12">
              <Form.Item label="银行流水号" required>
                <Input v-model:value="actionForm.bankReference" />
              </Form.Item>
            </Col>
          </Row>
          <Row :gutter="16">
            <Col :span="12">
              <Form.Item label="结算金额（minor）" required>
                <Input
                  v-model:value="actionForm.settledAmountMinor"
                  inputmode="numeric"
                  placeholder="整数最小货币单位"
                />
              </Form.Item>
</Col><Col :span="12">
              <Form.Item label="币种" required>
                <Input v-model:value="actionForm.currencyCode" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="结算证据 SHA-256" required>
            <Input v-model:value="actionForm.evidenceSha256" :maxlength="64" />
          </Form.Item>
        </template>
        <template v-else>
          <Row :gutter="16">
            <Col :span="12">
              <Form.Item label="会计期间 ID" required>
                <Input v-model:value="actionForm.accountingPeriodId" />
              </Form.Item>
</Col><Col :span="12">
              <Form.Item label="会计日期（YYYY-MM-DD）" required>
                <Input v-model:value="actionForm.accountingDate" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="反冲原因" required>
            <Input v-model:value="actionForm.reasonCode" />
          </Form.Item>
          <Form.Item label="反冲证据 SHA-256" required>
            <Input v-model:value="actionForm.evidenceSha256" :maxlength="64" />
          </Form.Item>
        </template>
      </Form>
    </Modal>

    <Drawer
      v-model:open="invoiceOpen"
      destroy-on-close
      title="供应商发票匹配详情"
      :width="1040"
    >
      <div v-if="invoiceLoading" class="detail-loading">
        正在读取发票、三单匹配与应付事实…
      </div>
      <template v-else-if="invoiceDetail">
        <div class="detail-hero">
          <div>
            <div class="detail-eyebrow">应付与匹配</div>
            <h2>{{ invoiceDetail.invoiceCode }}</h2>
            <p>
              供应商 {{ invoiceDetail.supplierId }} · 供应商发票
              {{ invoiceDetail.supplierInvoiceNumber }}
            </p>
          </div>
          <Tag :color="financeStatusMeta(invoiceDetail.matchStatus).color">
            {{ financeStatusMeta(invoiceDetail.matchStatus).label }}
          </Tag>
        </div>

        <Card class="mb-4 lifecycle-card">
          <Steps
            :current="
              invoiceDetail.status === 'POSTED'
                ? 4
                : invoiceDetail.status === 'APPROVED'
                  ? 3
                  : invoiceDetail.status === 'SUBMITTED'
                    ? 2
                    : 1
            "
            :items="[
              { title: '发票创建' },
              { title: '已提交发票' },
              { title: '三单匹配' },
              { title: '发票审批' },
              { title: 'AP 与入账' },
            ]"
            responsive
            size="small"
          />
        </Card>

        <Row :gutter="16" class="mb-4">
          <Col :lg="16" :xs="24">
            <Card title="供应商发票摘要">
              <Descriptions :column="{ lg: 4, md: 2, xs: 1 }" size="small">
                <Descriptions.Item label="供应商">
                  {{ invoiceDetail.supplierId }}
                </Descriptions.Item>
                <Descriptions.Item label="法人主体">
                  {{ invoiceDetail.legalEntityId }}
                </Descriptions.Item>
                <Descriptions.Item label="币种">
                  {{ invoiceDetail.currencyCode }}
                </Descriptions.Item>
                <Descriptions.Item label="付款条件">
                  {{ invoiceDetail.paymentConditionCode }}
                </Descriptions.Item>
                <Descriptions.Item label="发票净额">
                  {{
                    formatMinorMoney(
                      invoiceDetail.netAmountMinor,
                      invoiceDetail.currencyCode,
                    )
                  }}
                </Descriptions.Item>
                <Descriptions.Item label="进项税额">
                  {{
                    formatMinorMoney(
                      invoiceDetail.taxAmountMinor,
                      invoiceDetail.currencyCode,
                    )
                  }}
                </Descriptions.Item>
                <Descriptions.Item label="发票含税总额">
                  <strong class="amount-highlight">{{
                    formatMinorMoney(
                      invoiceDetail.grossAmountMinor,
                      invoiceDetail.currencyCode,
                    )
                  }}</strong>
                </Descriptions.Item>
                <Descriptions.Item label="到期日">
                  {{ invoiceDetail.dueDate }}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
          <Col :lg="8" :xs="24">
            <Card class="audit-card" title="匹配策略与审计">
              <p>
                匹配策略 {{ invoiceDetail.matchPolicyId ?? '尚未选择' }} / V{{
                  invoiceDetail.matchPolicyVersion ?? '-'
                }}
              </p>
              <p>匹配运行 {{ invoiceDetail.matchRunId ?? '尚未运行' }}</p>
              <Space wrap>
                <Tag color="blue">匹配事实冻结</Tag>
                <Tag color="green">幂等已校验</Tag>
                <Tag color="purple">租户已隔离</Tag>
              </Space>
            </Card>
          </Col>
        </Row>

        <Row :gutter="16">
          <Col :lg="17" :xs="24">
            <Card title="三单匹配明细">
              <template #extra>
                <span class="document-subtitle">采购发布版本 → 合格收货 → 发票行</span>
              </template>
              <Table
                :data-source="invoiceDetail.invoiceLines"
                :pagination="false"
                row-key="invoiceLineId"
                :scroll="{ x: 1120 }"
                :columns="[
                  { dataIndex: 'lineNumber', title: '行', width: 60 },
                  {
                    dataIndex: 'canonicalSkuId',
                    title: '发票行 / SKU',
                    width: 210,
                  },
                  { key: 'quantity', title: '开票 / 合格数量', width: 150 },
                  { key: 'price', title: '采购价 / 发票价', width: 180 },
                  { key: 'difference', title: '差异类型', width: 130 },
                  { key: 'amount', title: '匹配金额', width: 150 },
                  { key: 'receipt', title: '收货事实', width: 220 },
                ]"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'quantity'">
                    {{ record.invoiceQuantity }} /
                    {{ record.acceptedReceiptQuantity }} {{ record.uomCode }}
                  </template>
                  <template v-else-if="column.key === 'price'">
                    {{ record.purchaseOrderUnitNetPriceMinor }} /
                    {{ record.invoiceUnitNetPriceMinor }}
                  </template>
                  <template v-else-if="column.key === 'difference'">
                    <Tag
                      :color="
                        !record.differenceType ||
                        record.differenceType === 'NONE'
                          ? 'success'
                          : 'warning'
                      "
                    >
                      {{ record.differenceType ?? 'NONE' }}
                    </Tag>
                  </template>
                  <template v-else-if="column.key === 'amount'">
                    {{
                      formatMinorMoney(
                        record.lineGrossAmountMinor,
                        invoiceDetail.currencyCode,
                      )
                    }}
                  </template>
                  <template v-else-if="column.key === 'receipt'">
                    <div>
                      {{ record.lineage.receiptLineId ?? '缺少收货行' }}
                    </div>
                    <div class="document-subtitle">
                      质检
                      {{
                        record.lineage.qualityDispositionId ?? '缺少质检处置'
                      }}
                    </div>
                  </template>
                </template>
              </Table>
            </Card>
          </Col>
          <Col :lg="7" :xs="24">
            <Card title="应付与付款事实">
              <Statistic
                title="AP 分期"
                :value="invoiceDetail.apInstallments.length"
                suffix="期"
              />
              <Progress
                class="my-4"
                :percent="invoiceSettlementProgress(invoiceDetail)"
              />
              <Descriptions :column="1" size="small">
                <Descriptions.Item label="付款指令">
                  {{ invoiceDetail.paymentInstructions.length }}
                </Descriptions.Item>
                <Descriptions.Item label="会计凭证">
                  {{ invoiceDetail.journalEntryIds.length }}
                </Descriptions.Item>
                <Descriptions.Item label="会计期间">
                  {{ invoiceDetail.accountingPeriodId }}
                </Descriptions.Item>
              </Descriptions>
              <Alert
                class="mt-4"
                description="发票审批、匹配例外与付款审批执行 maker-checker 分离。"
                message="职责分离"
                show-icon
                type="warning"
              />
            </Card>
          </Col>
        </Row>
      </template>
    </Drawer>

    <Drawer v-model:open="journalOpen" title="会计凭证详情" :width="900">
      <div v-if="journalLoading" class="detail-loading">
        正在读取不可变分录…
      </div>
      <template v-else-if="journal">
        <div class="detail-hero">
          <div>
            <div class="detail-eyebrow">会计凭证</div>
            <h2>{{ journal.journalCode }}</h2>
            <p>
              {{ journal.journalType }} · {{ journal.accountingDate }} ·
              {{ journal.currencyCode }}
            </p>
          </div>
          <Tag :color="isBalancedJournal(journal) ? 'success' : 'error'">
            {{ isBalancedJournal(journal) ? '借贷平衡' : '借贷不平' }}
          </Tag>
        </div>
        <Descriptions bordered :column="2" size="small">
          <Descriptions.Item label="来源聚合">
            {{ journal.sourceAggregateType }} /
            {{ journal.sourceAggregateId }}
          </Descriptions.Item>
          <Descriptions.Item label="过账证据">
            {{ journal.postingEvidenceSha256 }}
          </Descriptions.Item>
          <Descriptions.Item label="借方合计">
            {{
              formatMinorMoney(
                journal.totalDebitAmountMinor,
                journal.currencyCode,
              )
            }}
          </Descriptions.Item>
          <Descriptions.Item label="贷方合计">
            {{
              formatMinorMoney(
                journal.totalCreditAmountMinor,
                journal.currencyCode,
              )
            }}
          </Descriptions.Item>
        </Descriptions>
        <Card class="mt-4" title="不可变分录行">
          <Table
            :data-source="journal.lines"
            :pagination="false"
            row-key="journalLineId"
            :columns="[
              { dataIndex: 'lineNumber', title: '行号', width: 70 },
              { dataIndex: 'accountCode', title: '科目编码', width: 140 },
              { dataIndex: 'accountName', title: '科目名称' },
              {
                dataIndex: 'debitAmountMinor',
                title: '借方（minor）',
                width: 150,
              },
              {
                dataIndex: 'creditAmountMinor',
                title: '贷方（minor）',
                width: 150,
              },
            ]"
          />
        </Card>
      </template>
    </Drawer>
  </Page>
</template>

<style scoped>
.metric-card {
  margin-bottom: 8px;
  border-radius: 12px;
}

.workbench-card {
  border-radius: 12px;
}

.toolbar {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.document-title,
.amount-value {
  font-weight: 600;
  color: hsl(var(--primary));
}

.document-link {
  height: auto;
  padding: 0;
  font-weight: 600;
}

.document-subtitle,
.immutable-note {
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.detail-loading {
  padding: 64px 0;
  color: hsl(var(--muted-foreground));
  text-align: center;
}

.detail-hero {
  display: flex;
  gap: 24px;
  align-items: flex-start;
  justify-content: space-between;
  padding: 4px 0 20px;
}

.detail-hero h2 {
  margin: 4px 0;
  font-size: 24px;
  font-weight: 700;
}

.detail-hero p {
  margin: 0;
  color: hsl(var(--muted-foreground));
}

.detail-eyebrow {
  font-size: 12px;
  font-weight: 600;
  color: hsl(var(--primary));
}

.audit-card {
  min-height: 170px;
  color: hsl(var(--muted));
  background: hsl(var(--foreground));
}

.audit-card :deep(.ant-card-head-title) {
  color: hsl(var(--background));
}

.amount-highlight {
  color: hsl(var(--primary));
}

.lifecycle-card {
  padding-block: 8px;
}

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .detail-hero {
    flex-direction: column;
  }
}
</style>
