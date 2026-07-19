<script lang="ts" setup>
import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { createNotificationCampaign } from '#/api/cloudmold/engagement';

import { useNotificationCampaignCreateFormSchema } from '../data';

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
  schema: useNotificationCampaignCreateFormSchema(),
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
        campaignName: string;
        channel: string;
      };
      await createNotificationCampaign({
        campaignCode: values.campaignCode,
        campaignName: values.campaignName,
        channel: values.channel,
      });
      await modalApi.close();
      emit('success');
      message.success('新建通知活动成功');
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
  <Modal class="w-1/3" title="新建通知活动">
    <Form class="mx-4" />
  </Modal>
</template>
