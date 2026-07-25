<script lang="ts" setup>
import type { CloudMoldCatalogCommandApi } from '#/api/cloudmold/catalog/command';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  activateCatalogDefinition,
  defineCatalogSku,
} from '#/api/cloudmold/catalog/command';

import { useSkuCreateFormSchema } from './data';

const emit = defineEmits<{ success: [] }>();

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: { class: 'w-full' },
    formItemClass: 'col-span-1',
    labelWidth: 96,
  },
  layout: 'horizontal',
  schema: useSkuCreateFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    modalApi.lock();
    try {
      const values =
        (await formApi.getValues()) as CloudMoldCatalogCommandApi.DefineSkuCommand & {
          activateNow: boolean;
        };
      const { activateNow, ...command } = values;
      const result = await defineCatalogSku(command);
      if (activateNow) {
        await activateCatalogDefinition(result);
      }
      message.success(
        activateNow ? '商品定义已创建并推进到生效' : '商品定义已保存为草稿',
      );
      await modalApi.close();
      emit('success');
    } catch (error) {
      message.error(
        `创建失败：${error instanceof Error ? error.message : '请检查主数据和状态'}`,
      );
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal class="w-[860px]" title="新建规范商品" confirm-text="创建商品">
    <div class="mb-4 rounded-md bg-blue-50 p-3 text-sm text-blue-700">
      同一编码会复用已有主数据；编码相同但定义不同会被后端拒绝。创建并生效将按依赖顺序执行，每一步均保留幂等和审计记录。
    </div>
    <Form class="mx-4 grid grid-cols-2 gap-x-4" />
  </Modal>
</template>
