<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { createCampaign } from '#/api/cloudmold/promotion';

import { usePromotionCampaignCreateFormSchema } from '../data';

const emit = defineEmits(['success']);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 80,
  },
  layout: 'horizontal',
  schema: usePromotionCampaignCreateFormSchema(),
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
      const values = (await formApi.getValues()) as {
        campaignCode: string;
        campaignKind: string;
        endsAt: Dayjs;
        name: string;
        startsAt: Dayjs;
      };
      await createCampaign({
        campaignCode: values.campaignCode,
        campaignKind: values.campaignKind,
        endsAt: values.endsAt.toISOString(),
        name: values.name,
        startsAt: values.startsAt.toISOString(),
      });
      await modalApi.close();
      emit('success');
      message.success('新建活动成功');
    } catch (error) {
      message.error(
        `新建失败：${error instanceof Error ? error.message : '请检查输入'}`,
      );
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal class="w-1/3" title="新建活动">
    <Form class="mx-4" />
  </Modal>
</template>
