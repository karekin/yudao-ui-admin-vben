<script lang="ts" setup>
import type { TablePaginationConfig } from 'ant-design-vue';

import type { CloudMoldCrmPageKey } from './contracts';

import type {
  CloudMoldCrmContactView,
  CloudMoldCrmCustomerView,
  CloudMoldCrmFollowUpView,
  CloudMoldCrmLeadView,
  CloudMoldCrmOpportunityView,
  CloudMoldCrmPageParams,
} from '#/api/cloudmold/crm';
import type {
  CloudMoldCrmContactDefinition,
  CloudMoldCrmCustomerDefinition,
  CloudMoldCrmFollowUpDefinition,
  CloudMoldCrmLeadDefinition,
  CloudMoldCrmOpportunityDefinition,
} from '#/api/cloudmold/crm/command';
import type { CloudMoldReceivablesSummaryView } from '#/api/cloudmold/crm/finance-summary';

import { computed, onMounted, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Alert,
  Button,
  Card,
  Col,
  Drawer,
  Empty,
  Form,
  FormItem,
  Input,
  message,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
} from 'ant-design-vue';

import {
  getCloudMoldCrmContactPage,
  getCloudMoldCrmCustomerPage,
  getCloudMoldCrmFollowUpPage,
  getCloudMoldCrmLeadPage,
  getCloudMoldCrmOpportunityPage,
  getCloudMoldCrmPoolPage,
} from '#/api/cloudmold/crm';
import {
  assignLead,
  claimCustomer,
  createContact,
  createCustomer,
  createLead,
  createOpportunity,
  recordFollowUp,
  returnCustomerToPool,
  updateContact,
  updateOpportunity,
} from '#/api/cloudmold/crm/command';
import { getCloudMoldCustomerReceivablesSummary } from '#/api/cloudmold/crm/finance-summary';
import CopyIdCell from '#/views/cloudmold/shared/copy-id-cell.vue';
import EvidenceAlert from '#/views/cloudmold/shared/evidence-alert.vue';
import { cloudMoldStatusMeta } from '#/views/cloudmold/shared/status-meta';
import StatusTag from '#/views/cloudmold/shared/status-tag.vue';

import { cloudMoldCrmPageContracts } from './contracts';
import ReceivablesSummaryTable from './receivables-summary-table.vue';

type EntityRow =
  | CloudMoldCrmContactView
  | CloudMoldCrmCustomerView
  | CloudMoldCrmFollowUpView
  | CloudMoldCrmLeadView
  | CloudMoldCrmOpportunityView;

interface CreateFormState {
  contactChannelRef?: string;
  contactName?: string;
  currencyCode?: string;
  customerId?: string;
  customerName?: string;
  expectedAmountMinor?: string;
  expectedCloseDate?: string;
  followUpId?: string;
  industryCode?: string;
  isPrimary?: boolean;
  leadName?: string;
  lifecycleStatus?: string;
  maskedContact?: string;
  methodCode?: string;
  nextFollowUpAt?: string;
  opportunityName?: string;
  ownerPrincipalId?: string;
  poolStatus?: string;
  regionCode?: string;
  roleTitle?: string;
  sourceCode?: string;
  stage?: string;
  subjectId?: string;
  subjectType?: string;
  summary?: string;
}

interface ActionFormState {
  contactChannelRef?: string;
  contactName?: string;
  currencyCode?: string;
  customerId?: string;
  expectedAmountMinor?: string;
  expectedCloseDate?: string;
  isPrimary?: boolean;
  maskedContact?: string;
  methodCode?: string;
  nextFollowUpAt?: string;
  opportunityName?: string;
  ownerPrincipalId?: string;
  reasonCode?: string;
  roleTitle?: string;
  stage?: string;
  summary?: string;
}

type EntityPageKey = Exclude<CloudMoldCrmPageKey, 'salesContract'>;

const props = withDefaults(
  defineProps<{
    financeSummaryScope?: 'customer';
    pageKey: EntityPageKey;
  }>(),
  { financeSummaryScope: undefined },
);

const pageContract = computed(() => cloudMoldCrmPageContracts[props.pageKey]);
const rows = ref<EntityRow[]>([]);
const loading = ref(false);
const loadError = ref('');
const keyword = ref('');
const statusFilter = ref<string>();
const pageNo = ref(1);
const pageSize = ref(10);
const total = ref(0);
const createOpen = ref(false);
const createSaving = ref(false);
const actionOpen = ref(false);
const actionSaving = ref(false);
const financeSummaryOpen = ref(false);
const financeSummaryLoading = ref(false);
const financeSummaryRows = ref<CloudMoldReceivablesSummaryView[]>([]);
const currentRow = ref<EntityRow>();
const createForm = ref<CreateFormState>(resetCreateForm());
const actionForm = ref<ActionFormState>(resetActionForm());

const statusOptions = computed(() => {
  if (props.pageKey === 'pool') return [];
  const values = rows.value.flatMap((row) => {
    const status = rowStatus(row);
    return status ? [status] : [];
  });
  return [...new Set(values)].map((value) => ({
    label: cloudMoldStatusMeta(value).label,
    value,
  }));
});

const columns = computed(() => {
  const list = [
    { key: 'name', title: '业务对象', width: 260 },
    {
      key: 'status',
      title: props.pageKey === 'followup' ? '跟进方式' : '状态',
      width: 130,
    },
    { key: 'owner', title: '负责人/执行人', width: 170 },
  ];
  if (
    props.pageKey !== 'followup' &&
    props.pageKey !== 'customer' &&
    props.pageKey !== 'pool'
  ) {
    list.push({ key: 'contact', title: '联系方式', width: 180 });
  }
  if (props.pageKey === 'business') {
    list.push({ key: 'amount', title: '预期金额', width: 160 });
  }
  if (
    props.pageKey === 'contact' ||
    props.pageKey === 'business' ||
    props.pageKey === 'followup'
  ) {
    list.push({ key: 'related', title: '关联对象', width: 180 });
  }
  list.push(
    { key: 'nextActionAt', title: '下一动作/到期', width: 180 },
    { key: 'updatedAt', title: '更新时间', width: 180 },
    { key: 'action', title: '操作', width: 160 },
  );
  return list;
});

const cards = computed(() => [
  { label: '当前页记录', value: rows.value.length },
  {
    label: '需跟进',
    value: rows.value.filter((row) => Boolean(rowNextAction(row))).length,
  },
  {
    label:
      props.pageKey === 'pool'
        ? '公海客户'
        : props.pageKey === 'business'
          ? '带金额商机'
          : '已关联负责人',
    value:
      props.pageKey === 'business'
        ? rows.value.filter(
            (row) =>
              isOpportunityRow(row) && row.expectedAmountMinor !== undefined,
          ).length
        : rows.value.filter((row) => Boolean(rowOwner(row))).length,
  },
]);

function resetCreateForm(): CreateFormState {
  return {
    currencyCode: 'CNY',
    isPrimary: false,
    lifecycleStatus: 'ACTIVE',
    methodCode: 'CALL',
    poolStatus: props.pageKey === 'pool' ? 'IN_POOL' : 'OWNED',
    stage: 'DISCOVERY',
    status: 'OPEN',
    subjectType: 'CUSTOMER',
  } as CreateFormState & { status?: string };
}

function resetActionForm(): ActionFormState {
  return {
    currencyCode: 'CNY',
    isPrimary: false,
    methodCode: 'CALL',
  };
}

function isCustomerRow(row: EntityRow): row is CloudMoldCrmCustomerView {
  return 'customerId' in row && 'customerName' in row;
}

function isLeadRow(row: EntityRow): row is CloudMoldCrmLeadView {
  return 'leadId' in row;
}

function isContactRow(row: EntityRow): row is CloudMoldCrmContactView {
  return 'contactId' in row;
}

function isOpportunityRow(row: EntityRow): row is CloudMoldCrmOpportunityView {
  return 'opportunityId' in row;
}

function isFollowUpRow(row: EntityRow): row is CloudMoldCrmFollowUpView {
  return 'followUpId' in row;
}

function rowId(row: EntityRow) {
  if (isCustomerRow(row)) return row.customerId;
  if (isLeadRow(row)) return row.leadId;
  if (isContactRow(row)) return row.contactId;
  if (isOpportunityRow(row)) return row.opportunityId;
  return row.followUpId;
}

function rowName(row: EntityRow) {
  if (isCustomerRow(row)) return row.customerName;
  if (isLeadRow(row)) return row.leadName;
  if (isContactRow(row)) return row.contactName;
  if (isOpportunityRow(row)) return row.opportunityName;
  return row.subjectName || row.summary || row.followUpId;
}

function rowCode(row: EntityRow) {
  if (isCustomerRow(row)) return row.customerCode || row.customerId;
  if (isLeadRow(row)) return row.leadCode || row.leadId;
  if (isOpportunityRow(row)) return row.opportunityCode || row.opportunityId;
  if (isFollowUpRow(row)) return row.subjectCode || row.followUpId;
  return row.contactId;
}

function rowStatus(row: EntityRow) {
  if (isCustomerRow(row))
    return props.pageKey === 'pool'
      ? row.poolStatus || 'IN_POOL'
      : row.lifecycleStatus;
  if (isLeadRow(row)) return row.status;
  if (isContactRow(row)) return row.status;
  if (isOpportunityRow(row)) return row.stage;
  return row.methodCode;
}

function rowOwner(row: EntityRow) {
  if (isCustomerRow(row) || isLeadRow(row) || isOpportunityRow(row)) {
    return row.ownerPrincipalId;
  }
  if (isFollowUpRow(row)) return row.actorPrincipalId;
  return '—';
}

function rowContact(row: EntityRow) {
  if (isLeadRow(row) || isContactRow(row)) {
    return {
      channel: row.contactChannelRef,
      masked: row.maskedContact,
    };
  }
  return undefined;
}

function rowRelated(row: EntityRow) {
  if (isContactRow(row)) return row.customerId;
  if (isOpportunityRow(row)) return row.customerId;
  if (isFollowUpRow(row)) {
    return [row.subjectType, row.subjectId].filter(Boolean).join(' / ');
  }
  return '—';
}

function rowNextAction(row: EntityRow) {
  if (isCustomerRow(row)) return row.nextFollowUpAt;
  if (isLeadRow(row)) return row.nextFollowUpAt;
  if (isOpportunityRow(row)) return row.expectedCloseDate;
  if (isFollowUpRow(row)) return row.nextFollowUpAt || row.occurredAt;
  return undefined;
}

function rowUpdatedAt(row: EntityRow) {
  if (isFollowUpRow(row)) return row.createdAt || row.occurredAt;
  return row.updatedAt || row.createdAt;
}

function asEntityRow(record: Record<string, any>) {
  return record as EntityRow;
}

function formatTime(value?: string) {
  if (!value) return '—';
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return value;
  return new Date(timestamp).toLocaleString('zh-CN', { hour12: false });
}

function formatMoney(amountMinor?: number, currencyCode?: string) {
  if (amountMinor === undefined || amountMinor === null) return '—';
  return `${(amountMinor / 100).toFixed(2)} ${currencyCode ?? ''}`.trim();
}

function amountText(row: EntityRow) {
  if (!isOpportunityRow(row)) return '—';
  return formatMoney(row.expectedAmountMinor, row.currencyCode);
}

async function loadPage() {
  loading.value = true;
  loadError.value = '';
  const params: CloudMoldCrmPageParams = {
    keyword: keyword.value.trim() || undefined,
    pageNo: pageNo.value,
    pageSize: pageSize.value,
  };
  if (statusFilter.value) {
    if (props.pageKey === 'customer')
      params.lifecycleStatus = statusFilter.value;
    else if (props.pageKey === 'clue' || props.pageKey === 'contact')
      params.status = statusFilter.value;
    else if (props.pageKey === 'business') params.stage = statusFilter.value;
    else if (props.pageKey === 'followup')
      params.methodCode = statusFilter.value;
  }
  try {
    const result = await {
      business: getCloudMoldCrmOpportunityPage,
      clue: getCloudMoldCrmLeadPage,
      contact: getCloudMoldCrmContactPage,
      customer: getCloudMoldCrmCustomerPage,
      followup: getCloudMoldCrmFollowUpPage,
      pool: getCloudMoldCrmPoolPage,
    }[props.pageKey](params);
    rows.value = result.list;
    total.value = result.total;
  } catch (error) {
    rows.value = [];
    total.value = 0;
    loadError.value =
      error instanceof Error ? error.message : 'CloudMold CRM 页面加载失败';
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
  statusFilter.value = undefined;
  pageNo.value = 1;
  void loadPage();
}

function openCreate() {
  createForm.value = resetCreateForm();
  createOpen.value = true;
}

function openAction(row: EntityRow) {
  currentRow.value = row;
  actionForm.value = resetActionForm();
  if (isLeadRow(row)) {
    actionForm.value.ownerPrincipalId = row.ownerPrincipalId;
  } else if (isContactRow(row)) {
    actionForm.value.contactChannelRef = row.contactChannelRef;
    actionForm.value.contactName = row.contactName;
    actionForm.value.isPrimary = row.isPrimary;
    actionForm.value.maskedContact = row.maskedContact;
    actionForm.value.roleTitle = row.roleTitle;
  } else if (isOpportunityRow(row)) {
    actionForm.value.currencyCode = row.currencyCode || 'CNY';
    actionForm.value.customerId = row.customerId;
    actionForm.value.expectedAmountMinor = row.expectedAmountMinor?.toString();
    actionForm.value.expectedCloseDate = row.expectedCloseDate;
    actionForm.value.opportunityName = row.opportunityName;
    actionForm.value.stage = row.stage;
  } else if (isFollowUpRow(row)) {
    actionForm.value.methodCode = row.methodCode || 'CALL';
    actionForm.value.nextFollowUpAt = row.nextFollowUpAt;
    actionForm.value.summary = row.summary;
  }
  actionOpen.value = true;
}

async function openFinanceSummary(row: EntityRow) {
  if (!props.financeSummaryScope || !isCustomerRow(row)) return;
  currentRow.value = row;
  financeSummaryOpen.value = true;
  financeSummaryLoading.value = true;
  try {
    financeSummaryRows.value = await getCloudMoldCustomerReceivablesSummary(
      row.customerId,
    );
  } catch (error) {
    financeSummaryRows.value = [];
    message.error(
      `财务摘要加载失败：${error instanceof Error ? error.message : '请稍后重试'}`,
    );
  } finally {
    financeSummaryLoading.value = false;
  }
}

function requireText(value: string | undefined, label: string) {
  if (value?.trim()) return true;
  message.error(`${label}不能为空`);
  return false;
}

async function submitCreate() {
  createSaving.value = true;
  try {
    if (props.pageKey === 'customer' || props.pageKey === 'pool') {
      if (!requireText(createForm.value.customerName, '客户名称')) return;
      const customer: CloudMoldCrmCustomerDefinition = {
        customerName: createForm.value.customerName!.trim(),
        industryCode: createForm.value.industryCode?.trim(),
        lifecycleStatus: createForm.value.lifecycleStatus?.trim(),
        nextFollowUpAt: createForm.value.nextFollowUpAt?.trim(),
        ownerPrincipalId: createForm.value.ownerPrincipalId?.trim(),
        poolStatus:
          props.pageKey === 'pool'
            ? 'IN_POOL'
            : createForm.value.poolStatus?.trim(),
        regionCode: createForm.value.regionCode?.trim(),
        sourceCode: createForm.value.sourceCode?.trim(),
      };
      await createCustomer(customer);
    } else if (props.pageKey === 'clue') {
      if (!requireText(createForm.value.leadName, '线索名称')) return;
      const lead: CloudMoldCrmLeadDefinition = {
        contactChannelRef: createForm.value.contactChannelRef?.trim(),
        leadName: createForm.value.leadName!.trim(),
        maskedContact: createForm.value.maskedContact?.trim(),
        nextFollowUpAt: createForm.value.nextFollowUpAt?.trim(),
        ownerPrincipalId: createForm.value.ownerPrincipalId?.trim(),
        sourceCode: createForm.value.sourceCode?.trim(),
        status: 'NEW',
      };
      await createLead(lead);
    } else if (props.pageKey === 'contact') {
      if (!requireText(createForm.value.contactName, '联系人名称')) return;
      const contact: CloudMoldCrmContactDefinition = {
        contactChannelRef: createForm.value.contactChannelRef?.trim(),
        contactName: createForm.value.contactName!.trim(),
        customerId: createForm.value.customerId?.trim(),
        isPrimary: createForm.value.isPrimary,
        maskedContact: createForm.value.maskedContact?.trim(),
        roleTitle: createForm.value.roleTitle?.trim(),
        status: 'ACTIVE',
      };
      await createContact(contact);
    } else if (props.pageKey === 'business') {
      if (!requireText(createForm.value.opportunityName, '商机名称')) return;
      const opportunity: CloudMoldCrmOpportunityDefinition = {
        currencyCode: createForm.value.currencyCode?.trim() || 'CNY',
        customerId: createForm.value.customerId?.trim(),
        expectedAmountMinor: createForm.value.expectedAmountMinor
          ? Number(createForm.value.expectedAmountMinor)
          : undefined,
        expectedCloseDate: createForm.value.expectedCloseDate?.trim(),
        opportunityName: createForm.value.opportunityName!.trim(),
        ownerPrincipalId: createForm.value.ownerPrincipalId?.trim(),
        stage: createForm.value.stage?.trim(),
      };
      await createOpportunity(opportunity);
    } else {
      if (!requireText(createForm.value.subjectId, '关联主体 ID')) return;
      if (!requireText(createForm.value.summary, '跟进摘要')) return;
      const followUp: CloudMoldCrmFollowUpDefinition = {
        methodCode: createForm.value.methodCode?.trim(),
        nextFollowUpAt: createForm.value.nextFollowUpAt?.trim(),
        subjectId: createForm.value.subjectId!.trim(),
        subjectType: createForm.value.subjectType!.trim(),
        summary: createForm.value.summary!.trim(),
      };
      await recordFollowUp(followUp);
    }
    message.success(`${pageContract.value.createLabel}成功`);
    createOpen.value = false;
    void loadPage();
  } catch (error) {
    message.error(
      `${pageContract.value.createLabel}失败：${error instanceof Error ? error.message : '请稍后重试'}`,
    );
  } finally {
    createSaving.value = false;
  }
}

async function submitAction() {
  if (!currentRow.value) return;
  actionSaving.value = true;
  try {
    const reasonCode = actionForm.value.reasonCode?.trim();
    if (props.pageKey === 'customer') {
      await returnCustomerToPool(
        {
          customerId: (currentRow.value as CloudMoldCrmCustomerView).customerId,
          expectedVersion: (currentRow.value as CloudMoldCrmCustomerView)
            .version,
        },
        reasonCode,
      );
    } else if (props.pageKey === 'pool') {
      if (!requireText(actionForm.value.ownerPrincipalId, '负责人主体')) return;
      await claimCustomer(
        {
          customerId: (currentRow.value as CloudMoldCrmCustomerView).customerId,
          expectedVersion: (currentRow.value as CloudMoldCrmCustomerView)
            .version,
          ownerPrincipalId: actionForm.value.ownerPrincipalId?.trim(),
        },
        reasonCode,
      );
    } else if (props.pageKey === 'clue') {
      if (!requireText(actionForm.value.ownerPrincipalId, '负责人主体')) return;
      const row = currentRow.value as CloudMoldCrmLeadView;
      await assignLead(
        {
          contactChannelRef: row.contactChannelRef,
          expectedVersion: row.version,
          leadId: row.leadId,
          leadName: row.leadName,
          maskedContact: row.maskedContact,
          nextFollowUpAt: row.nextFollowUpAt,
          ownerPrincipalId: actionForm.value.ownerPrincipalId?.trim(),
          sourceCode: row.sourceCode,
          status: row.status,
        },
        reasonCode,
      );
    } else if (props.pageKey === 'contact') {
      if (!requireText(actionForm.value.contactName, '联系人名称')) return;
      const row = currentRow.value as CloudMoldCrmContactView;
      await updateContact(
        {
          contactChannelRef: actionForm.value.contactChannelRef?.trim(),
          contactId: row.contactId,
          contactName: actionForm.value.contactName!.trim(),
          customerId: row.customerId,
          expectedVersion: row.version,
          isPrimary: actionForm.value.isPrimary,
          maskedContact: actionForm.value.maskedContact?.trim(),
          roleTitle: actionForm.value.roleTitle?.trim(),
          status: row.status,
        },
        reasonCode,
      );
    } else if (props.pageKey === 'business') {
      if (!requireText(actionForm.value.opportunityName, '商机名称')) return;
      const row = currentRow.value as CloudMoldCrmOpportunityView;
      await updateOpportunity(
        {
          currencyCode: actionForm.value.currencyCode?.trim() || 'CNY',
          customerId: actionForm.value.customerId?.trim() || row.customerId,
          expectedAmountMinor: actionForm.value.expectedAmountMinor
            ? Number(actionForm.value.expectedAmountMinor)
            : row.expectedAmountMinor,
          expectedCloseDate:
            actionForm.value.expectedCloseDate?.trim() || row.expectedCloseDate,
          expectedVersion: row.version,
          opportunityId: row.opportunityId,
          opportunityName: actionForm.value.opportunityName!.trim(),
          ownerPrincipalId: row.ownerPrincipalId,
          stage: actionForm.value.stage?.trim() || row.stage,
        },
        reasonCode,
      );
    } else {
      if (!requireText(actionForm.value.summary, '跟进摘要')) return;
      const row = currentRow.value as CloudMoldCrmFollowUpView;
      await recordFollowUp(
        {
          methodCode: actionForm.value.methodCode?.trim() || row.methodCode,
          nextFollowUpAt:
            actionForm.value.nextFollowUpAt?.trim() || row.nextFollowUpAt,
          subjectId: row.subjectId || '',
          subjectType: row.subjectType || 'CUSTOMER',
          summary: actionForm.value.summary!.trim(),
        },
        reasonCode,
      );
    }
    message.success(`${pageContract.value.operationLabel}成功`);
    actionOpen.value = false;
    void loadPage();
  } catch (error) {
    message.error(
      `${pageContract.value.operationLabel}失败：${error instanceof Error ? error.message : '请稍后重试'}`,
    );
  } finally {
    actionSaving.value = false;
  }
}

function handleTableChange(pagination: TablePaginationConfig) {
  pageNo.value = pagination.current ?? 1;
  pageSize.value = pagination.pageSize ?? 10;
  void loadPage();
}

watch(
  () => props.pageKey,
  () => {
    pageNo.value = 1;
    keyword.value = '';
    statusFilter.value = undefined;
    void loadPage();
  },
);

onMounted(() => {
  void loadPage();
});
</script>

<template>
  <Page auto-content-height>
    <EvidenceAlert
      :message="pageContract.title"
      :description="pageContract.description"
    />

    <Row :gutter="12" class="mb-3">
      <Col v-for="card in cards" :key="card.label" :span="8">
        <Card size="small">
          <Statistic :title="card.label" :value="card.value" />
        </Card>
      </Col>
    </Row>

    <Card size="small">
      <Space class="mb-3" wrap>
        <Input
          v-model:value="keyword"
          allow-clear
          placeholder="输入关键词"
          style="width: 260px"
        />
        <Select
          v-if="statusOptions.length > 0"
          v-model:value="statusFilter"
          allow-clear
          :options="statusOptions"
          placeholder="全部状态"
          style="width: 180px"
        />
        <Button type="primary" @click="search">查询</Button>
        <Button @click="reset">重置</Button>
        <Button type="dashed" @click="openCreate">
          {{ pageContract.createLabel }}
        </Button>
      </Space>

      <Alert
        v-if="loadError"
        class="mb-3"
        type="error"
        show-icon
        :message="`${pageContract.title}加载失败`"
        :description="loadError"
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
        :row-key="rowId"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <div class="flex flex-col gap-1">
              <span class="font-medium">{{
                rowName(asEntityRow(record))
              }}</span>
              <CopyIdCell
                :value="rowCode(asEntityRow(record))"
                label="业务编号"
              />
            </div>
          </template>
          <template v-else-if="column.key === 'status'">
            <StatusTag
              v-bind="cloudMoldStatusMeta(rowStatus(asEntityRow(record)))"
            />
          </template>
          <template v-else-if="column.key === 'owner'">
            <span>{{ rowOwner(asEntityRow(record)) || '—' }}</span>
          </template>
          <template v-else-if="column.key === 'contact'">
            <div class="flex flex-col gap-1">
              <span>{{ rowContact(asEntityRow(record))?.masked || '—' }}</span>
              <span class="text-xs text-[var(--ant-color-text-description)]">
                {{
                  rowContact(asEntityRow(record))?.channel || '未登记渠道引用'
                }}
              </span>
            </div>
          </template>
          <template v-else-if="column.key === 'amount'">
            <span>{{ amountText(asEntityRow(record)) }}</span>
          </template>
          <template v-else-if="column.key === 'related'">
            <span>{{ rowRelated(asEntityRow(record)) }}</span>
          </template>
          <template v-else-if="column.key === 'nextActionAt'">
            <span>{{ formatTime(rowNextAction(asEntityRow(record))) }}</span>
          </template>
          <template v-else-if="column.key === 'updatedAt'">
            <span>{{ formatTime(rowUpdatedAt(asEntityRow(record))) }}</span>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space :size="4">
              <Button
                type="link"
                size="small"
                @click="openAction(asEntityRow(record))"
              >
                {{ pageContract.operationLabel }}
              </Button>
              <Button
                v-if="
                  props.financeSummaryScope === 'customer' &&
                  props.pageKey === 'customer'
                "
                type="link"
                size="small"
                @click="openFinanceSummary(asEntityRow(record))"
              >
                财务摘要
              </Button>
            </Space>
          </template>
        </template>

        <template #emptyText>
          <Empty :description="pageContract.emptyDescription" />
        </template>
      </Table>
    </Card>

    <Modal
      v-model:open="createOpen"
      :confirm-loading="createSaving"
      :title="pageContract.createLabel"
      @ok="submitCreate"
    >
      <Form :model="createForm" layout="vertical">
        <FormItem
          v-if="props.pageKey === 'customer' || props.pageKey === 'pool'"
          label="客户名称"
          required
        >
          <Input v-model:value="createForm.customerName" />
        </FormItem>
        <FormItem
          v-if="props.pageKey === 'customer' || props.pageKey === 'pool'"
          label="生命周期状态"
        >
          <Input
            v-model:value="createForm.lifecycleStatus"
            placeholder="例如 ACTIVE"
          />
        </FormItem>
        <FormItem
          v-if="props.pageKey === 'customer' || props.pageKey === 'pool'"
          label="负责人主体"
        >
          <Input v-model:value="createForm.ownerPrincipalId" />
        </FormItem>
        <FormItem
          v-if="props.pageKey === 'customer' || props.pageKey === 'pool'"
          label="来源编码"
        >
          <Input v-model:value="createForm.sourceCode" />
        </FormItem>

        <FormItem v-if="props.pageKey === 'clue'" label="线索名称" required>
          <Input v-model:value="createForm.leadName" />
        </FormItem>
        <FormItem v-if="props.pageKey === 'clue'" label="联系方式遮罩">
          <Input
            v-model:value="createForm.maskedContact"
            placeholder="例如 138****0001"
          />
        </FormItem>
        <FormItem v-if="props.pageKey === 'clue'" label="联系渠道引用">
          <Input
            v-model:value="createForm.contactChannelRef"
            placeholder="例如 WECHAT:lead-a"
          />
        </FormItem>
        <FormItem v-if="props.pageKey === 'clue'" label="负责人主体">
          <Input v-model:value="createForm.ownerPrincipalId" />
        </FormItem>

        <FormItem
          v-if="props.pageKey === 'contact'"
          label="联系人名称"
          required
        >
          <Input v-model:value="createForm.contactName" />
        </FormItem>
        <FormItem v-if="props.pageKey === 'contact'" label="客户 ID">
          <Input v-model:value="createForm.customerId" />
        </FormItem>
        <FormItem v-if="props.pageKey === 'contact'" label="岗位">
          <Input v-model:value="createForm.roleTitle" />
        </FormItem>
        <FormItem v-if="props.pageKey === 'contact'" label="联系方式遮罩">
          <Input v-model:value="createForm.maskedContact" />
        </FormItem>
        <FormItem v-if="props.pageKey === 'contact'" label="渠道引用">
          <Input v-model:value="createForm.contactChannelRef" />
        </FormItem>
        <FormItem v-if="props.pageKey === 'contact'" label="主联系人">
          <Switch v-model:checked="createForm.isPrimary" />
        </FormItem>

        <FormItem v-if="props.pageKey === 'business'" label="商机名称" required>
          <Input v-model:value="createForm.opportunityName" />
        </FormItem>
        <FormItem v-if="props.pageKey === 'business'" label="客户 ID">
          <Input v-model:value="createForm.customerId" />
        </FormItem>
        <FormItem v-if="props.pageKey === 'business'" label="阶段">
          <Input
            v-model:value="createForm.stage"
            placeholder="例如 DISCOVERY"
          />
        </FormItem>
        <FormItem v-if="props.pageKey === 'business'" label="预期金额（分）">
          <Input v-model:value="createForm.expectedAmountMinor" />
        </FormItem>
        <FormItem v-if="props.pageKey === 'business'" label="币种">
          <Input v-model:value="createForm.currencyCode" />
        </FormItem>
        <FormItem v-if="props.pageKey === 'business'" label="预计成交日期">
          <Input
            v-model:value="createForm.expectedCloseDate"
            placeholder="YYYY-MM-DD"
          />
        </FormItem>
        <FormItem v-if="props.pageKey === 'business'" label="负责人主体">
          <Input v-model:value="createForm.ownerPrincipalId" />
        </FormItem>

        <FormItem v-if="props.pageKey === 'followup'" label="主体类型" required>
          <Select
            v-model:value="createForm.subjectType"
            :options="[
              { label: '客户', value: 'CUSTOMER' },
              { label: '线索', value: 'LEAD' },
              { label: '联系人', value: 'CONTACT' },
              { label: '商机', value: 'OPPORTUNITY' },
            ]"
          />
        </FormItem>
        <FormItem v-if="props.pageKey === 'followup'" label="主体 ID" required>
          <Input v-model:value="createForm.subjectId" />
        </FormItem>
        <FormItem v-if="props.pageKey === 'followup'" label="跟进方式">
          <Input
            v-model:value="createForm.methodCode"
            placeholder="例如 CALL"
          />
        </FormItem>
        <FormItem v-if="props.pageKey === 'followup'" label="跟进摘要" required>
          <Input.TextArea v-model:value="createForm.summary" :rows="3" />
        </FormItem>
        <FormItem v-if="props.pageKey === 'followup'" label="下一次跟进时间">
          <Input
            v-model:value="createForm.nextFollowUpAt"
            placeholder="例如 2026-08-09T10:00:00"
          />
        </FormItem>
      </Form>
    </Modal>

    <Modal
      v-model:open="actionOpen"
      :confirm-loading="actionSaving"
      :title="pageContract.operationLabel"
      @ok="submitAction"
    >
      <Form :model="actionForm" layout="vertical">
        <FormItem label="业务对象">
          <div class="font-medium">
            {{ currentRow ? rowName(currentRow) : '—' }}
          </div>
          <div class="text-xs text-[var(--ant-color-text-description)]">
            {{ currentRow ? rowId(currentRow) : '—' }}
          </div>
        </FormItem>
        <FormItem
          v-if="['clue', 'pool'].includes(props.pageKey)"
          label="新负责人主体"
          required
        >
          <Input v-model:value="actionForm.ownerPrincipalId" />
        </FormItem>
        <FormItem
          v-if="props.pageKey === 'contact'"
          label="联系人名称"
          required
        >
          <Input v-model:value="actionForm.contactName" />
        </FormItem>
        <FormItem v-if="props.pageKey === 'contact'" label="岗位">
          <Input v-model:value="actionForm.roleTitle" />
        </FormItem>
        <FormItem v-if="props.pageKey === 'contact'" label="联系方式遮罩">
          <Input v-model:value="actionForm.maskedContact" />
        </FormItem>
        <FormItem v-if="props.pageKey === 'contact'" label="渠道引用">
          <Input v-model:value="actionForm.contactChannelRef" />
        </FormItem>
        <FormItem v-if="props.pageKey === 'contact'" label="主联系人">
          <Switch v-model:checked="actionForm.isPrimary" />
        </FormItem>
        <FormItem v-if="props.pageKey === 'business'" label="商机名称" required>
          <Input v-model:value="actionForm.opportunityName" />
        </FormItem>
        <FormItem v-if="props.pageKey === 'business'" label="客户 ID">
          <Input v-model:value="actionForm.customerId" />
        </FormItem>
        <FormItem v-if="props.pageKey === 'business'" label="阶段">
          <Input v-model:value="actionForm.stage" />
        </FormItem>
        <FormItem v-if="props.pageKey === 'business'" label="预期金额（分）">
          <Input v-model:value="actionForm.expectedAmountMinor" />
        </FormItem>
        <FormItem v-if="props.pageKey === 'business'" label="币种">
          <Input v-model:value="actionForm.currencyCode" />
        </FormItem>
        <FormItem v-if="props.pageKey === 'business'" label="预计成交日期">
          <Input
            v-model:value="actionForm.expectedCloseDate"
            placeholder="YYYY-MM-DD"
          />
        </FormItem>
        <FormItem v-if="props.pageKey === 'followup'" label="跟进方式">
          <Input v-model:value="actionForm.methodCode" />
        </FormItem>
        <FormItem v-if="props.pageKey === 'followup'" label="跟进摘要" required>
          <Input.TextArea v-model:value="actionForm.summary" :rows="3" />
        </FormItem>
        <FormItem v-if="props.pageKey === 'followup'" label="下一次跟进时间">
          <Input
            v-model:value="actionForm.nextFollowUpAt"
            placeholder="例如 2026-08-09T10:00:00"
          />
        </FormItem>
        <FormItem label="原因编码">
          <Input
            v-model:value="actionForm.reasonCode"
            :placeholder="pageContract.operationPlaceholder"
          />
        </FormItem>
      </Form>
    </Modal>

    <Drawer
      v-model:open="financeSummaryOpen"
      :title="
        isCustomerRow(currentRow as EntityRow)
          ? `${(currentRow as CloudMoldCrmCustomerView).customerName} 财务摘要`
          : '客户财务摘要'
      "
      width="960"
    >
      <Card size="small" class="mb-3">
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span class="text-[var(--ant-color-text-description)]">客户 ID：</span>
            <span>{{
              isCustomerRow(currentRow as EntityRow)
                ? (currentRow as CloudMoldCrmCustomerView).customerId
                : '—'
            }}</span>
          </div>
          <div>
            <span class="text-[var(--ant-color-text-description)]">生命周期：</span>
            <span>{{
              isCustomerRow(currentRow as EntityRow)
                ? (currentRow as CloudMoldCrmCustomerView).lifecycleStatus
                : '—'
            }}</span>
          </div>
          <div>
            <span class="text-[var(--ant-color-text-description)]">公海状态：</span>
            <span>{{
              isCustomerRow(currentRow as EntityRow)
                ? (currentRow as CloudMoldCrmCustomerView).poolStatus || '—'
                : '—'
            }}</span>
          </div>
          <div>
            <span class="text-[var(--ant-color-text-description)]">下次跟进：</span>
            <span>{{
              isCustomerRow(currentRow as EntityRow)
                ? formatTime(
                    (currentRow as CloudMoldCrmCustomerView).nextFollowUpAt,
                  )
                : '—'
            }}</span>
          </div>
        </div>
      </Card>

      <ReceivablesSummaryTable
        :rows="financeSummaryRows"
        :loading="financeSummaryLoading"
        empty-description="该客户当前没有回款摘要"
      />
    </Drawer>
  </Page>
</template>
