<script lang="ts" setup>
import type { TableProps } from 'ant-design-vue';

import type { CloudMoldAgentControlApi } from '#/api/cloudmold/agent-control';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Alert,
  Button,
  DatePicker,
  Form,
  FormItem,
  InputNumber,
  message,
  Modal,
  Select,
  SelectOption,
  Space,
  Table,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  getCloudMoldAgentRoleGrants,
  isAgentControlUnavailable,
} from '#/api/cloudmold/agent-control';
import { grantRole, revokeRole } from '#/api/cloudmold/agent-control/command';

import CopyIdCell from '../shared/copy-id-cell.vue';
import EvidenceAlert from '../shared/evidence-alert.vue';
import StatusTag from '../shared/status-tag.vue';

defineOptions({ name: 'CloudMoldAgentControlGrants' });

type Grant = CloudMoldAgentControlApi.ActorRoleGrantView;
type Dayjs = dayjs.Dayjs;

const grantStatusMeta: Record<string, { color: string; label: string }> = {
  ACTIVE: { color: 'success', label: '生效' },
  EXPIRED: { color: 'warning', label: '已过期' },
  REVOKED: { color: 'default', label: '已撤销' },
};

const GrantStatus = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  REVOKED: 'REVOKED',
} as const;

const roleOptions = [
  { label: '库控', value: 'inventory-control' },
  { label: '买手', value: 'buyer' },
  { label: '客服', value: 'customer-service' },
  { label: '企划', value: 'planning' },
  { label: '招商', value: 'merchant-acquisition' },
  { label: '体验', value: 'customer-experience' },
];

const roleName: Record<string, string> = Object.fromEntries(
  roleOptions.map((r) => [r.value, r.label]),
);

const dataSource = ref<Grant[]>([]);
const loading = ref(false);
const serviceUnavailable = ref(false);
const filterRole = ref<string | undefined>(undefined);
const filterStatus = ref<string | undefined>(undefined);

const columns: TableProps['columns'] = [
  { title: '授予 ID', dataIndex: 'grantId', key: 'grantId', width: 220 },
  {
    title: '被授予用户',
    dataIndex: 'actorUserId',
    key: 'actorUserId',
    width: 120,
  },
  { title: '岗位', dataIndex: 'roleCode', key: 'roleCode', width: 100 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '生效起', dataIndex: 'validFrom', key: 'validFrom', width: 170 },
  { title: '生效止', dataIndex: 'validUntil', key: 'validUntil', width: 170 },
  { title: '版本', dataIndex: 'version', key: 'version', width: 80 },
  { title: '操作', key: 'action', width: 100, fixed: 'right' },
];

function statusMeta(status: string) {
  return grantStatusMeta[status] ?? { color: 'default', label: status };
}

async function loadGrants() {
  loading.value = true;
  try {
    dataSource.value = await getCloudMoldAgentRoleGrants({
      limit: 200,
      roleCode: filterRole.value,
      status: filterStatus.value,
    });
    serviceUnavailable.value = false;
  } catch (error) {
    dataSource.value = [];
    serviceUnavailable.value = isAgentControlUnavailable(error);
    if (!serviceUnavailable.value) {
      message.error(
        `加载失败：${error instanceof Error ? error.message : '请稍后重试'}`,
      );
    }
  } finally {
    loading.value = false;
  }
}

onMounted(loadGrants);

async function handleRevoke(row: Grant) {
  const hide = message.loading({ content: '正在撤销…', duration: 0 });
  try {
    const result = await revokeRole(
      row.grantId,
      row.actorUserId,
      row.roleCode,
      row.version,
    );
    if (result.duplicate) {
      message.warning('该操作已处理（幂等重放）');
    } else {
      message.success('撤销成功');
    }
    await loadGrants();
  } catch (error) {
    message.error(
      `撤销失败：${error instanceof Error ? error.message : '请稍后重试'}`,
    );
  } finally {
    hide();
  }
}

function confirmRevoke(row: Grant) {
  Modal.confirm({
    title: '撤销岗位角色授予',
    content: `确认撤销该用户的「${
      roleName[row.roleCode] ?? row.roleCode
    }」岗位授予？此操作不可恢复。`,
    okText: '撤销',
    okType: 'danger',
    cancelText: '取消',
    onOk: () => handleRevoke(row),
  });
}

/** a-table bodyCell 的 record 固定为 Record<string, any>，统一 cast 后委托给 confirmRevoke */
function onRevoke(record: Record<string, any>) {
  confirmRevoke(record as unknown as Grant);
}

// 新建授予
const grantOpen = ref(false);
const granting = ref(false);
const grantForm = reactive<{
  actorUserId: number | undefined;
  roleCode: string;
  validFrom: Dayjs | undefined;
  validUntil: Dayjs | undefined;
}>({
  actorUserId: undefined,
  roleCode: roleOptions[0]!.value,
  validFrom: undefined,
  validUntil: undefined,
});

function openGrant() {
  grantForm.actorUserId = undefined;
  grantForm.roleCode = roleOptions[0]!.value;
  grantForm.validFrom = dayjs();
  grantForm.validUntil = dayjs().add(1, 'year');
  grantOpen.value = true;
}

async function confirmGrant() {
  if (
    grantForm.actorUserId === undefined ||
    grantForm.actorUserId === null ||
    grantForm.actorUserId <= 0
  ) {
    message.warning('请输入有效的用户 ID');
    return;
  }
  if (!grantForm.validFrom || !grantForm.validUntil) {
    message.warning('请选择生效起止时间');
    return;
  }
  if (!grantForm.validUntil.isAfter(grantForm.validFrom)) {
    message.warning('生效止必须晚于生效起');
    return;
  }
  granting.value = true;
  const hide = message.loading({ content: '正在授予…', duration: 0 });
  try {
    const result = await grantRole(
      grantForm.actorUserId,
      grantForm.roleCode,
      grantForm.validFrom.toISOString(),
      grantForm.validUntil.toISOString(),
    );
    if (result.duplicate) {
      message.warning('该操作已处理（幂等重放）');
    } else {
      message.success('授予成功');
    }
    grantOpen.value = false;
    await loadGrants();
  } catch (error) {
    message.error(
      `授予失败：${error instanceof Error ? error.message : '请稍后重试'}`,
    );
  } finally {
    granting.value = false;
    hide();
  }
}

function formatTime(value?: string) {
  if (!value) return '-';
  return dayjs(value).format('YYYY-MM-DD HH:mm');
}
</script>

<template>
  <Page auto-content-height>
    <EvidenceAlert
      message="CloudMold 岗位角色授予治理"
      description="本页治理 Agent 岗位角色授予（授予/撤销，幂等命令 + 乐观版本）；actorUserId 为 yudao 用户 ID，roleCode 为 CloudMold 规范岗位。后端校验：治理者不能给自己授/撤、角色须 ACTIVE、有效期合法。"
    />

    <Alert
      v-if="serviceUnavailable"
      class="mb-4"
      type="warning"
      show-icon
      message="Agent Control 治理能力当前未启用"
      description="岗位授予与撤销在 P0 激活评审前保持默认关闭；当前页面仅保留治理边界说明。"
    />

    <Space class="mb-4" wrap>
      <Select
        v-model:value="filterRole"
        allow-clear
        class="w-40"
        :options="roleOptions"
        :disabled="serviceUnavailable"
        placeholder="按岗位筛选"
        @change="loadGrants"
      />
      <Select
        v-model:value="filterStatus"
        allow-clear
        class="w-40"
        :disabled="serviceUnavailable"
        placeholder="按状态筛选"
        :options="[
          { label: '生效', value: GrantStatus.ACTIVE },
          { label: '已撤销', value: GrantStatus.REVOKED },
          { label: '已过期', value: GrantStatus.EXPIRED },
        ]"
        @change="loadGrants"
      />
      <Button
        :disabled="serviceUnavailable"
        :loading="loading"
        @click="loadGrants"
      >
        刷新
      </Button>
      <Button :disabled="serviceUnavailable" type="primary" @click="openGrant">
        授予岗位
      </Button>
    </Space>

    <Table
      :columns="columns"
      :data-source="dataSource"
      :loading="loading"
      :pagination="{ pageSize: 20, showSizeChanger: true }"
      row-key="grantId"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'grantId'">
          <CopyIdCell :value="record.grantId" label="授予 ID" />
        </template>
        <template v-else-if="column.key === 'roleCode'">
          {{ roleName[record.roleCode] ?? record.roleCode }}
        </template>
        <template v-else-if="column.key === 'status'">
          <StatusTag v-bind="statusMeta(record.status)" />
        </template>
        <template v-else-if="column.key === 'validFrom'">
          {{ formatTime(record.validFrom) }}
        </template>
        <template v-else-if="column.key === 'validUntil'">
          {{ formatTime(record.validUntil) }}
        </template>
        <template v-else-if="column.key === 'action'">
          <Button
            v-if="record.status === GrantStatus.ACTIVE"
            danger
            size="small"
            type="link"
            @click="onRevoke(record)"
          >
            撤销
          </Button>
          <span v-else>-</span>
        </template>
      </template>
    </Table>

    <Modal
      v-model:open="grantOpen"
      :confirm-loading="granting"
      title="授予岗位角色"
      @ok="confirmGrant"
    >
      <Form layout="vertical">
        <FormItem label="被授予用户 ID（yudao 用户 ID）">
          <InputNumber
            v-model:value="grantForm.actorUserId"
            class="w-full"
            :min="1"
            placeholder="输入数字用户 ID"
          />
        </FormItem>
        <FormItem label="岗位">
          <Select v-model:value="grantForm.roleCode">
            <SelectOption
              v-for="r in roleOptions"
              :key="r.value"
              :value="r.value"
            >
              {{ r.label }}
            </SelectOption>
          </Select>
        </FormItem>
        <FormItem label="生效起">
          <DatePicker
            v-model:value="grantForm.validFrom"
            class="w-full"
            show-time
          />
        </FormItem>
        <FormItem label="生效止">
          <DatePicker
            v-model:value="grantForm.validUntil"
            class="w-full"
            show-time
          />
        </FormItem>
      </Form>
    </Modal>
  </Page>
</template>
