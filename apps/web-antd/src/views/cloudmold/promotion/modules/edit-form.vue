<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenForm } from '#/adapter/form';
import { updateCampaign } from '#/api/cloudmold/promotion';

import { usePromotionCampaignEditFormSchema } from '../data';

const emit = defineEmits(['success']);

interface EditContext {
  campaignId: string;
  campaignKind: string;
  endsAt: string;
  expectedVersion: number;
  name: string;
  startsAt: string;
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
  schema: usePromotionCampaignEditFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    const ctx = modalApi.getData<EditContext>();
    if (!ctx) {
      return;
    }
    modalApi.lock();
    try {
      const values = (await formApi.getValues()) as {
        campaignKind: string;
        endsAt: Dayjs;
        name: string;
        startsAt: Dayjs;
      };
      await updateCampaign({
        campaignId: ctx.campaignId,
        campaignKind: values.campaignKind,
        endsAt: values.endsAt.toISOString(),
        expectedVersion: ctx.expectedVersion,
        name: values.name,
        startsAt: values.startsAt.toISOString(),
      });
      await modalApi.close();
      emit('success');
      message.success('编辑活动成功');
    } catch (error) {
      message.error(
        `编辑失败：${error instanceof Error ? error.message : '请检查输入或刷新后重试'}`,
      );
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    // 回填现有业务字段（campaignCode 业务键不可改，不在表单）
    const ctx = modalApi.getData<EditContext>();
    if (!ctx) {
      return;
    }
    await formApi.setValues({
      campaignKind: ctx.campaignKind,
      endsAt: dayjs(ctx.endsAt),
      name: ctx.name,
      startsAt: dayjs(ctx.startsAt),
    });
  },
});
</script>

<template>
  <Modal class="w-1/3" title="编辑活动">
    <Form class="mx-4" />
  </Modal>
</template>
