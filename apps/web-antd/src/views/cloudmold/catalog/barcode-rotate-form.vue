<script lang="ts" setup>
import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { rotateCatalogBarcode } from '#/api/cloudmold/catalog/command';

import { useBarcodeRotateFormSchema } from './data';

interface BarcodeRotateContext {
  canonicalSkuId: string;
  currentBarcode?: string;
  expectedVersion: number;
}

const emit = defineEmits<{ success: [] }>();

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: { class: 'w-full' },
    formItemClass: 'col-span-2',
    labelWidth: 96,
  },
  layout: 'horizontal',
  schema: useBarcodeRotateFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const context = modalApi.getData<BarcodeRotateContext>();
    if (!context) return;

    const values = (await formApi.getValues()) as {
      barcode: string;
      barcodeType: string;
      reason: string;
    };
    const barcode = values.barcode.trim();
    if (barcode === context.currentBarcode) {
      message.warning('新条码不能与当前主条码相同');
      return;
    }

    modalApi.lock();
    try {
      const result = await rotateCatalogBarcode(
        context.canonicalSkuId,
        context.expectedVersion,
        barcode,
        values.barcodeType,
        values.reason.trim(),
      );
      message.success(
        result.duplicate ? '该条码轮换已处理（幂等重放）' : '主条码已轮换',
      );
      await modalApi.close();
      emit('success');
    } catch (error) {
      message.error(
        `轮换失败：${error instanceof Error ? error.message : '请刷新后重试'}`,
      );
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) return;
    const context = modalApi.getData<BarcodeRotateContext>();
    if (!context) return;
    await formApi.setValues({
      barcode: '',
      barcodeType: 'CODE128',
      currentBarcode: context.currentBarcode ?? '-',
      reason: '',
    });
  },
});
</script>

<template>
  <Modal class="w-[560px]" title="轮换主条码" confirm-text="确认轮换">
    <div class="mb-4 rounded-md bg-amber-50 p-3 text-sm text-amber-700">
      旧主条码会被退役并保留在历史记录中；新条码必须在当前租户的 Catalog
      历史中唯一。
    </div>
    <Form class="mx-4" />
  </Modal>
</template>
