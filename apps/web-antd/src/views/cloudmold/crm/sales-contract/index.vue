<script lang="ts" setup>
import type { CloudMoldReceivablesSummaryView } from '#/api/cloudmold/crm/finance-summary';
import type {
  CloudMoldSalesContractCommand,
  CloudMoldSalesContractItem,
} from '#/api/cloudmold/crm/sales-contract';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  DescriptionsItem,
  Divider,
  Empty,
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Modal,
  Row,
  Space,
  Table,
} from 'ant-design-vue';

import { getCloudMoldSalesContractReceivablesSummary } from '#/api/cloudmold/crm/finance-summary';
import {
  executeSalesContractCommand,
  getCloudMoldSalesContract,
  listCloudMoldSalesContracts,
  SALES_CONTRACT_OPERATIONS,
} from '#/api/cloudmold/crm/sales-contract';
import EvidenceAlert from '#/views/cloudmold/shared/evidence-alert.vue';
import { cloudMoldStatusMeta } from '#/views/cloudmold/shared/status-meta';
import StatusTag from '#/views/cloudmold/shared/status-tag.vue';

import ReceivablesSummaryTable from '../shared/receivables-summary-table.vue';

defineOptions({ name: 'CloudMoldCrmSalesContract' });

interface DraftFormState {
  contractCode: string;
  contractName: string;
  currencyCode: string;
  customerId: string;
  effectiveDate: string;
  expiresOn: string;
  items: Array<{
    canonicalSkuId: string;
    itemName: string;
    lineAmountMinor?: number;
    quantity: string;
    salesContractItemId?: string;
    unitPriceMinor?: number;
    uomCode: string;
  }>;
  reasonCode: string;
  sellerMerchantId: string;
  sellerShopId: string;
}

const contractIdInput = ref('');
const loading = ref(false);
const loadError = ref('');
const detail = ref<Awaited<
  ReturnType<typeof getCloudMoldSalesContract>
> | null>(null);
const contracts = ref<Awaited<ReturnType<typeof listCloudMoldSalesContracts>>>(
  [],
);
const financeLoading = ref(false);
const financeRows = ref<CloudMoldReceivablesSummaryView[]>([]);
const draftOpen = ref(false);
const draftMode = ref<'create' | 'update'>('create');
const draftSaving = ref(false);
const draftForm = ref<DraftFormState>(emptyDraftForm());
const submitSaving = ref(false);

function emptyDraftForm(): DraftFormState {
  return {
    contractCode: '',
    contractName: '',
    currencyCode: 'CNY',
    customerId: '',
    effectiveDate: '',
    expiresOn: '',
    items: [
      {
        canonicalSkuId: '',
        itemName: '',
        lineAmountMinor: undefined,
        quantity: '',
        unitPriceMinor: undefined,
        uomCode: 'PCS',
      },
    ],
    reasonCode: '',
    sellerMerchantId: '',
    sellerShopId: '',
  };
}

function toCommandItems(
  items: DraftFormState['items'],
): CloudMoldSalesContractItem[] {
  return items.map((item, index) => ({
    canonicalSkuId: item.canonicalSkuId.trim(),
    itemName: item.itemName.trim(),
    lineAmountMinor: Number(item.lineAmountMinor || 0),
    lineNo: index + 1,
    quantity: item.quantity.trim(),
    salesContractItemId: item.salesContractItemId?.trim() || undefined,
    unitPriceMinor: Number(item.unitPriceMinor || 0),
    uomCode: item.uomCode.trim(),
  }));
}

function formatMoney(value?: number, currencyCode?: string) {
  if (value === undefined || value === null) return '—';
  return `${(value / 100).toFixed(2)} ${currencyCode ?? ''}`.trim();
}

function formatTime(value?: string) {
  if (!value) return '—';
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return value;
  return new Date(timestamp).toLocaleString('zh-CN', { hour12: false });
}

const totalFromDraft = computed(() =>
  draftForm.value.items.reduce(
    (sum, item) => sum + Number(item.lineAmountMinor || 0),
    0,
  ),
);

async function loadContract(salesContractId = contractIdInput.value.trim()) {
  if (!salesContractId) {
    message.error('请输入销售合同 ID');
    return;
  }
  loading.value = true;
  financeLoading.value = true;
  loadError.value = '';
  try {
    const contract = await getCloudMoldSalesContract(salesContractId);
    detail.value = contract;
    contractIdInput.value = salesContractId;
    try {
      financeRows.value =
        await getCloudMoldSalesContractReceivablesSummary(salesContractId);
    } catch {
      financeRows.value = [];
      message.warning('合同已加载，应收摘要暂不可用');
    }
  } catch (error) {
    detail.value = null;
    financeRows.value = [];
    loadError.value =
      error instanceof Error ? error.message : '销售合同详情加载失败';
  } finally {
    loading.value = false;
    financeLoading.value = false;
  }
}

async function loadContracts() {
  try {
    contracts.value = await listCloudMoldSalesContracts();
    if (!detail.value && contracts.value[0]) {
      await loadContract(contracts.value[0].salesContractId);
    }
  } catch (error) {
    message.warning(
      `合同列表加载失败：${error instanceof Error ? error.message : '请稍后重试'}`,
    );
  }
}

function selectContract(contract: Record<string, any>) {
  if (typeof contract.salesContractId === 'string') {
    void loadContract(contract.salesContractId);
  }
}

function openCreateDraft() {
  draftMode.value = 'create';
  draftForm.value = emptyDraftForm();
  draftOpen.value = true;
}

function openUpdateDraft() {
  if (!detail.value) {
    message.error('请先加载销售合同详情');
    return;
  }
  draftMode.value = 'update';
  draftForm.value = {
    contractCode: detail.value.contractCode || '',
    contractName: detail.value.contractName || '',
    currencyCode: detail.value.currencyCode || 'CNY',
    customerId: detail.value.customerId || '',
    effectiveDate: detail.value.effectiveDate || '',
    expiresOn: detail.value.expiresOn || '',
    items: detail.value.items.map((item) => ({
      canonicalSkuId: item.canonicalSkuId,
      itemName: item.itemName,
      lineAmountMinor: item.lineAmountMinor,
      quantity: item.quantity,
      salesContractItemId: item.salesContractItemId,
      unitPriceMinor: item.unitPriceMinor,
      uomCode: item.uomCode,
    })),
    reasonCode: '',
    sellerMerchantId: detail.value.sellerMerchantId || '',
    sellerShopId: detail.value.sellerShopId || '',
  };
  draftOpen.value = true;
}

function addItemRow() {
  draftForm.value.items.push({
    canonicalSkuId: '',
    itemName: '',
    lineAmountMinor: undefined,
    quantity: '',
    unitPriceMinor: undefined,
    uomCode: 'PCS',
  });
}

function removeItemRow(index: number) {
  draftForm.value.items.splice(index, 1);
  if (draftForm.value.items.length === 0) addItemRow();
}

function validateDraft() {
  if (!draftForm.value.contractCode.trim()) return '合同编码不能为空';
  if (!draftForm.value.contractName.trim()) return '合同名称不能为空';
  if (!draftForm.value.customerId.trim()) return '客户 ID 不能为空';
  if (!draftForm.value.sellerMerchantId.trim())
    return 'Seller Merchant ID 不能为空';
  if (!draftForm.value.sellerShopId.trim()) return 'Seller Shop ID 不能为空';
  if (!draftForm.value.effectiveDate.trim()) return '生效日期不能为空';
  if (!draftForm.value.reasonCode.trim()) return '变更原因码不能为空';
  if (draftForm.value.items.some((item) => !item.canonicalSkuId.trim())) {
    return '每一行都必须填写 canonical SKU';
  }
  if (
    draftForm.value.items.some(
      (item) =>
        !item.quantity.trim() ||
        Number(item.quantity) <= 0 ||
        Number(item.unitPriceMinor || 0) <= 0 ||
        Number(item.lineAmountMinor || 0) <= 0,
    )
  ) {
    return '每一行都必须填写正数数量、单价和金额';
  }
  return '';
}

async function submitDraft() {
  const validationError = validateDraft();
  if (validationError) {
    message.error(validationError);
    return;
  }
  draftSaving.value = true;
  try {
    const command: CloudMoldSalesContractCommand = {
      contractCode: draftForm.value.contractCode.trim(),
      contractName: draftForm.value.contractName.trim(),
      currencyCode: draftForm.value.currencyCode.trim() || 'CNY',
      customerId: draftForm.value.customerId.trim(),
      effectiveDate: draftForm.value.effectiveDate.trim() || undefined,
      expectedVersion:
        draftMode.value === 'update' ? detail.value?.version : undefined,
      expiresOn: draftForm.value.expiresOn.trim() || undefined,
      items: toCommandItems(draftForm.value.items),
      operation:
        draftMode.value === 'create'
          ? SALES_CONTRACT_OPERATIONS.CREATE_DRAFT
          : SALES_CONTRACT_OPERATIONS.UPDATE_DRAFT,
      reasonCode: draftForm.value.reasonCode.trim() || undefined,
      salesContractId:
        draftMode.value === 'update'
          ? detail.value?.salesContractId
          : undefined,
      sellerMerchantId: draftForm.value.sellerMerchantId.trim(),
      sellerShopId: draftForm.value.sellerShopId.trim(),
    };
    const result = await executeSalesContractCommand(command);
    message.success(
      `${draftMode.value === 'create' ? '创建' : '更新'}销售合同草稿成功`,
    );
    draftOpen.value = false;
    await loadContract(result.salesContractId);
  } catch (error) {
    message.error(
      `${draftMode.value === 'create' ? '创建' : '更新'}草稿失败：${error instanceof Error ? error.message : '请稍后重试'}`,
    );
  } finally {
    draftSaving.value = false;
  }
}

async function submitApproval() {
  if (!detail.value) {
    message.error('请先加载销售合同详情');
    return;
  }
  submitSaving.value = true;
  try {
    const result = await executeSalesContractCommand({
      expectedVersion: detail.value.version,
      operation: SALES_CONTRACT_OPERATIONS.SUBMIT_APPROVAL,
      reasonCode: 'SUBMIT_APPROVAL',
      salesContractId: detail.value.salesContractId,
    });
    message.success('已提交审批');
    await loadContract(result.salesContractId);
  } catch (error) {
    message.error(
      `提交审批失败：${error instanceof Error ? error.message : '请稍后重试'}`,
    );
  } finally {
    submitSaving.value = false;
  }
}

onMounted(loadContracts);
</script>

<template>
  <Page auto-content-height>
    <EvidenceAlert
      message="CloudMold 销售合同权威"
      description="本页直连 SalesContractCommand API、销售合同列表与详情；只展示 canonical SKU、seller merchant/shop/legal entity、BPM process id，以及只读 Finance summary。"
    />

    <Card size="small" class="mb-3">
      <Space wrap>
        <Input
          v-model:value="contractIdInput"
          allow-clear
          placeholder="输入销售合同 ID"
          style="width: 320px"
        />
        <Button type="primary" :loading="loading" @click="loadContract()">
          查询合同
        </Button>
        <Button type="dashed" @click="openCreateDraft">新建草稿</Button>
        <Button :disabled="!detail" @click="openUpdateDraft">更新草稿</Button>
        <Button
          type="default"
          :disabled="!detail"
          :loading="submitSaving"
          @click="submitApproval"
        >
          提交审批
        </Button>
      </Space>
    </Card>

    <Card
      size="small"
      title="销售合同"
      class="mb-3"
      :loading="loading && !detail"
    >
      <Table
        :columns="[
          { key: 'contractCode', title: '合同编码', width: 190 },
          { key: 'contractName', title: '合同名称', width: 260 },
          { key: 'status', title: '状态', width: 120 },
          { key: 'totalAmountMinor', title: '合同金额', width: 150 },
          { key: 'effectiveDate', title: '生效日期', width: 130 },
          { key: 'updatedAt', title: '更新时间', width: 180 },
          { key: 'action', title: '操作', width: 90 },
        ]"
        :data-source="contracts"
        :pagination="false"
        row-key="salesContractId"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <StatusTag v-bind="cloudMoldStatusMeta(record.status)" />
          </template>
          <template v-else-if="column.key === 'totalAmountMinor'">
            {{ formatMoney(record.totalAmountMinor, record.currencyCode) }}
          </template>
          <template v-else-if="column.key === 'updatedAt'">
            {{ formatTime(record.updatedAt) }}
          </template>
          <template v-else-if="column.key === 'action'">
            <Button type="link" size="small" @click="selectContract(record)">
              详情
            </Button>
          </template>
        </template>
      </Table>
      <Empty
        v-if="contracts.length === 0"
        description="暂无销售合同，完成客户转商机后的合同会自动出现在这里"
      />
    </Card>

    <Alert
      v-if="loadError"
      class="mb-3"
      type="error"
      show-icon
      message="销售合同加载失败"
      :description="loadError"
    />

    <Card
      v-if="detail"
      :loading="loading"
      size="small"
      title="合同详情"
      class="mb-3"
    >
      <Descriptions :column="2" bordered size="small">
        <DescriptionsItem label="合同 ID">
          {{ detail.salesContractId }}
        </DescriptionsItem>
        <DescriptionsItem label="状态">
          <StatusTag v-bind="cloudMoldStatusMeta(detail.status)" />
        </DescriptionsItem>
        <DescriptionsItem label="合同编码">
          {{ detail.contractCode || '—' }}
        </DescriptionsItem>
        <DescriptionsItem label="合同名称">
          {{ detail.contractName || '—' }}
        </DescriptionsItem>
        <DescriptionsItem label="客户 ID">
          {{ detail.customerId || '—' }}
        </DescriptionsItem>
        <DescriptionsItem label="Seller Merchant ID">
          {{ detail.sellerMerchantId || '—' }}
        </DescriptionsItem>
        <DescriptionsItem label="Seller Shop ID">
          {{ detail.sellerShopId || '—' }}
        </DescriptionsItem>
        <DescriptionsItem label="Seller Legal Entity ID">
          {{ detail.sellerLegalEntityId || '—' }}
        </DescriptionsItem>
        <DescriptionsItem label="币种 / 总额">
          {{ formatMoney(detail.totalAmountMinor, detail.currencyCode) }}
        </DescriptionsItem>
        <DescriptionsItem label="BPM Process ID">
          {{ detail.approvalProcessInstanceId || '—' }}
        </DescriptionsItem>
        <DescriptionsItem label="生效日期">
          {{ detail.effectiveDate || '—' }}
        </DescriptionsItem>
        <DescriptionsItem label="到期日期">
          {{ detail.expiresOn || '—' }}
        </DescriptionsItem>
        <DescriptionsItem label="版本">
          {{ detail.version ?? '—' }}
        </DescriptionsItem>
        <DescriptionsItem label="更新时间">
          {{ formatTime(detail.updatedAt) }}
        </DescriptionsItem>
      </Descriptions>

      <Divider orientation="left">合同明细</Divider>
      <Table
        :columns="[
          { key: 'lineNo', title: '行号', width: 80 },
          { key: 'canonicalSkuId', title: 'Canonical SKU', width: 200 },
          { key: 'itemName', title: '名称', width: 180 },
          { key: 'quantity', title: '数量', width: 100 },
          { key: 'uomCode', title: '单位', width: 100 },
          { key: 'unitPriceMinor', title: '单价', width: 140 },
          { key: 'lineAmountMinor', title: '行金额', width: 140 },
        ]"
        :data-source="detail.items"
        :pagination="false"
        row-key="salesContractItemId"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'unitPriceMinor'">
            <span>{{
              formatMoney(record.unitPriceMinor, detail.currencyCode)
            }}</span>
          </template>
          <template v-else-if="column.key === 'lineAmountMinor'">
            <span>{{
              formatMoney(record.lineAmountMinor, detail.currencyCode)
            }}</span>
          </template>
        </template>
      </Table>
    </Card>

    <Card v-else size="small" class="mb-3">
      <Empty description="请输入销售合同 ID 或先创建草稿" />
    </Card>

    <Card size="small" title="Finance 只读摘要">
      <ReceivablesSummaryTable
        :rows="financeRows"
        :loading="financeLoading"
        empty-description="该销售合同当前没有回款摘要"
      />
    </Card>

    <Modal
      v-model:open="draftOpen"
      :confirm-loading="draftSaving"
      :title="draftMode === 'create' ? '新建销售合同草稿' : '更新销售合同草稿'"
      width="1100px"
      @ok="submitDraft"
    >
      <Form :model="draftForm" layout="vertical">
        <Row :gutter="12">
          <Col :span="12">
            <FormItem label="合同编码" required>
              <Input v-model:value="draftForm.contractCode" />
            </FormItem>
          </Col>
          <Col :span="12">
            <FormItem label="合同名称" required>
              <Input v-model:value="draftForm.contractName" />
            </FormItem>
          </Col>
          <Col :span="12">
            <FormItem label="客户 ID" required>
              <Input v-model:value="draftForm.customerId" />
            </FormItem>
          </Col>
          <Col :span="12">
            <FormItem label="币种">
              <Input v-model:value="draftForm.currencyCode" />
            </FormItem>
          </Col>
          <Col :span="12">
            <FormItem label="Seller Merchant ID" required>
              <Input v-model:value="draftForm.sellerMerchantId" />
            </FormItem>
          </Col>
          <Col :span="12">
            <FormItem label="Seller Shop ID" required>
              <Input v-model:value="draftForm.sellerShopId" />
            </FormItem>
          </Col>
          <Col :span="12">
            <FormItem label="生效日期">
              <Input
                v-model:value="draftForm.effectiveDate"
                placeholder="YYYY-MM-DD"
              />
            </FormItem>
          </Col>
          <Col :span="12">
            <FormItem label="到期日期">
              <Input
                v-model:value="draftForm.expiresOn"
                placeholder="YYYY-MM-DD"
              />
            </FormItem>
          </Col>
        </Row>

        <Divider orientation="left">合同条目</Divider>
        <Space direction="vertical" style="width: 100%">
          <Card
            v-for="(item, index) in draftForm.items"
            :key="index"
            size="small"
          >
            <Row :gutter="12">
              <Col :span="8">
                <FormItem label="Canonical SKU" required>
                  <Input v-model:value="item.canonicalSkuId" />
                </FormItem>
              </Col>
              <Col :span="8">
                <FormItem label="名称">
                  <Input v-model:value="item.itemName" />
                </FormItem>
              </Col>
              <Col :span="8">
                <FormItem label="单位">
                  <Input v-model:value="item.uomCode" />
                </FormItem>
              </Col>
              <Col :span="8">
                <FormItem label="数量">
                  <Input v-model:value="item.quantity" />
                </FormItem>
              </Col>
              <Col :span="8">
                <FormItem label="单价（分）">
                  <InputNumber
                    v-model:value="item.unitPriceMinor"
                    style="width: 100%"
                    :min="0"
                  />
                </FormItem>
              </Col>
              <Col :span="8">
                <FormItem label="行金额（分）">
                  <InputNumber
                    v-model:value="item.lineAmountMinor"
                    style="width: 100%"
                    :min="0"
                  />
                </FormItem>
              </Col>
            </Row>
            <Button danger type="link" @click="removeItemRow(index)">
              删除此行
            </Button>
          </Card>
        </Space>
        <Button class="mt-2" type="dashed" @click="addItemRow">新增条目</Button>

        <Card size="small" class="mt-3">
          <div class="flex items-center justify-between">
            <span>草稿总额</span>
            <span class="font-medium">
              {{ formatMoney(totalFromDraft, draftForm.currencyCode) }}
            </span>
          </div>
        </Card>

        <FormItem label="原因编码" class="mt-3">
          <Input
            v-model:value="draftForm.reasonCode"
            placeholder="例如 CONTRACT_REVISED"
          />
        </FormItem>
      </Form>
    </Modal>
  </Page>
</template>
