<script lang="ts" setup>
import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { decideReview } from '#/api/cloudmold/risk';

import { useRiskReviewDecideFormSchema } from '../data';

const emit = defineEmits(['success']);

interface DecideContext {
  caseId: string;
  decidedByPrincipalId: string;
  expectedVersion: number;
}

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 80,
  },
  layout: 'horizontal',
  schema: useRiskReviewDecideFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    try {
      const data = modalApi.getData<DecideContext>();
      const values = (await formApi.getValues()) as {
        decisionType: string;
        reasonCode: string;
      };
      await decideReview(
        data.caseId,
        data.expectedVersion,
        data.decidedByPrincipalId,
        values.decisionType,
        values.reasonCode,
      );
      await modalApi.close();
      emit('success');
      message.success('审核决策已提交');
    } catch (error) {
      message.error(
        `决策失败：${error instanceof Error ? error.message : '请检查输入'}`,
      );
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal class="w-1/3" title="审核决策">
    <Form class="mx-4" />
  </Modal>
</template>
