<script lang="ts" setup>
import type { CloudMoldInventoryCommandApi } from '#/api/cloudmold/inventory';

import { computed, reactive } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Alert,
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
} from 'ant-design-vue';

import { executeCloudMoldInventoryCommand } from '#/api/cloudmold/inventory';

export interface InventoryCommandContext extends Omit<
  CloudMoldInventoryCommandApi.Command,
  'businessId' | 'businessItemId' | 'businessNo' | 'businessType' | 'quantity'
> {
  businessId?: string;
  businessItemId?: string;
  businessNo?: string;
  businessType?: string;
  quantity?: string;
  skuCode: string;
  warehouseCode: string;
  locationCode: string;
}

const emit = defineEmits<{ success: [] }>();
const context = reactive<InventoryCommandContext>({
  baseUomCode: '',
  canonicalSkuId: '',
  locationCode: '',
  locationId: '',
  operation: '',
  ownerId: '',
  ownerType: '',
  qualityStatus: '',
  skuCode: '',
  stockStatus: '',
  warehouseCode: '',
  warehouseId: '',
});
const form = reactive({
  businessId: '',
  businessItemId: '',
  businessNo: '',
  businessType: '',
  quantity: undefined as number | undefined,
});

const operationName = computed(
  () =>
    ({
      RECEIVE: '采购/调拨入库',
      RELEASE: '释放预占',
      RESERVE: '创建预占',
      RETURN: '退货入库',
      SHIP: '确认出库',
    })[context.operation] ?? context.operation,
);

const [Modal, modalApi] = useVbenModal({
  onOpenChange(open) {
    if (!open) return;
    Object.assign(context, modalApi.getData<InventoryCommandContext>());
    Object.assign(form, {
      businessId: context.businessId ?? '',
      businessItemId: context.businessItemId ?? '',
      businessNo: context.businessNo ?? '',
      businessType: context.businessType ?? '',
      quantity: context.quantity ? Number(context.quantity) : undefined,
    });
  },
  async onConfirm() {
    if (
      !form.quantity ||
      form.quantity <= 0 ||
      !form.businessType.trim() ||
      !form.businessId.trim() ||
      !form.businessItemId.trim() ||
      !form.businessNo.trim()
    ) {
      message.warning('请填写正数量和完整业务凭证');
      return;
    }
    modalApi.lock();
    try {
      const result = await executeCloudMoldInventoryCommand({
        baseUomCode: context.baseUomCode,
        businessId: form.businessId.trim(),
        businessItemId: form.businessItemId.trim(),
        businessNo: form.businessNo.trim(),
        businessType: form.businessType.trim().toUpperCase(),
        canonicalSkuId: context.canonicalSkuId,
        locationId: context.locationId,
        ...(context.lotId ? { lotId: context.lotId } : {}),
        operation: context.operation,
        ownerId: context.ownerId,
        ownerType: context.ownerType,
        qualityStatus: context.qualityStatus,
        quantity: String(form.quantity),
        ...(context.reservationId
          ? { reservationId: context.reservationId }
          : {}),
        stockStatus: context.stockStatus,
        warehouseId: context.warehouseId,
      });
      message.success(
        result.duplicate
          ? '该库存命令已处理（幂等重放）'
          : `${operationName.value}成功`,
      );
      await modalApi.close();
      emit('success');
    } catch (error) {
      message.error(
        `库存命令失败：${error instanceof Error ? error.message : '请检查余额、预占与业务凭证'}`,
      );
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="operationName" class="w-[620px]" confirm-text="确认执行">
    <Alert
      class="mb-4"
      type="warning"
      show-icon
      message="这是库存账本命令，不是直接修改余额"
      description="系统会校验精确货主、SKU、仓库、库位、批次、库存状态和预占关系，并生成不可变流水、幂等记录与审计事件。"
    />
    <Form layout="vertical">
      <div class="grid grid-cols-2 gap-x-4">
        <FormItem label="SKU">
          <Input :value="context.skuCode" disabled />
        </FormItem>
        <FormItem label="仓库 / 库位">
          <Input
            :value="`${context.warehouseCode} / ${context.locationCode}`"
            disabled
          />
        </FormItem>
        <FormItem label="数量" required>
          <InputNumber
            v-model:value="form.quantity"
            class="w-full"
            :min="0.000001"
            :precision="6"
          />
        </FormItem>
        <FormItem label="计量单位">
          <Input :value="context.baseUomCode" disabled />
        </FormItem>
        <FormItem label="业务类型" required>
          <Input
            v-model:value="form.businessType"
            placeholder="例如 PURCHASE_RECEIPT"
          />
        </FormItem>
        <FormItem label="业务单号" required>
          <Input v-model:value="form.businessNo" placeholder="可读业务单号" />
        </FormItem>
        <FormItem label="业务 ID" required>
          <Input
            v-model:value="form.businessId"
            placeholder="上游业务聚合 ID"
          />
        </FormItem>
        <FormItem label="业务行 ID" required>
          <Input
            v-model:value="form.businessItemId"
            placeholder="上游业务明细 ID"
          />
        </FormItem>
      </div>
    </Form>
  </Modal>
</template>
