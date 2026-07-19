<script lang="ts" setup>
import { computed } from 'vue';

import { Button } from 'ant-design-vue';

import { useCopyId } from './use-copy-id';

/**
 * CloudMold 红区列表页「规范 ID + 复制」单元格。
 * 在主单号 / 主 ID 列里展示值并提供一键复制，便于跨页追踪。
 * 用 slot 接入而非全局 vxe renderer，避免改动 adapter/vxe-table.ts 黄区装配面。
 */
interface Props {
  label?: string;
  value?: null | number | string | undefined;
}

const props = withDefaults(defineProps<Props>(), {
  label: '规范 ID',
  value: '',
});

const { copyId } = useCopyId();

const display = computed(() => {
  const { value } = props;
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  return String(value);
});
</script>

<template>
  <span class="inline-flex items-center gap-1">
    <span>{{ display }}</span>
    <Button
      type="link"
      size="small"
      class="h-auto px-1 py-0"
      :disabled="display === '-'"
      @click="copyId(value, label)"
    >
      复制
    </Button>
  </span>
</template>
