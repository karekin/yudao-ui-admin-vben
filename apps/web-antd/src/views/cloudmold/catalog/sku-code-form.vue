<script lang="ts" setup>
import { reactive } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Alert, Form, FormItem, Input, message } from 'ant-design-vue';

import { updateCatalogSkuCode } from '#/api/cloudmold/catalog/command';

interface SkuCodeContext {
  expectedVersion: number;
  id: string;
  skuCode: string;
}

const emit = defineEmits<{ success: [] }>();

const form = reactive({
  reason: '',
  skuCode: '',
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const context = modalApi.getData<SkuCodeContext>();
    if (!context) return;

    const skuCode = form.skuCode.trim();
    const reason = form.reason.trim();
    if (!skuCode) {
      message.warning('SKU 编码不能为空');
      return;
    }
    if (!reason) {
      message.warning('变更原因不能为空');
      return;
    }
    if (skuCode.toUpperCase() === context.skuCode.toUpperCase()) {
      message.warning('SKU 编码未发生变化');
      return;
    }

    modalApi.lock();
    try {
      const result = await updateCatalogSkuCode(
        context.id,
        context.expectedVersion,
        skuCode,
        reason,
      );
      message.success(
        result.duplicate ? '该编码变更已处理（幂等重放）' : 'SKU 编码已更新',
      );
      await modalApi.close();
      emit('success');
    } catch (error) {
      message.error(
        `更新失败：${error instanceof Error ? error.message : '请刷新后重试'}`,
      );
    } finally {
      modalApi.unlock();
    }
  },
  onOpenChange(isOpen: boolean) {
    if (!isOpen) return;
    const context = modalApi.getData<SkuCodeContext>();
    if (!context) return;
    form.reason = '';
    form.skuCode = context.skuCode;
  },
});
</script>

<template>
  <Modal class="w-[560px]" title="修改 SKU 编码" confirm-text="确认更新">
    <Alert
      class="mb-4"
      show-icon
      type="info"
      message="仅修改规范 SKU 自有编码"
      description="不会覆盖未由详情接口返回的 Style/SPU 元数据，也不会改变颜色、尺码、库存或渠道投影。提交时会校验当前聚合版本并记录变更原因。"
    />
    <Form :label-col="{ span: 5 }" :wrapper-col="{ span: 18 }">
      <FormItem label="SKU 编码" required>
        <Input v-model:value="form.skuCode" :maxlength="64" />
      </FormItem>
      <FormItem label="变更原因" required>
        <Input.TextArea
          v-model:value="form.reason"
          :maxlength="512"
          :rows="3"
          show-count
        />
      </FormItem>
    </Form>
  </Modal>
</template>
