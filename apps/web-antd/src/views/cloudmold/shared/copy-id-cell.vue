<script lang="ts" setup>
import { computed } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Button, Tooltip } from 'ant-design-vue';

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
  <span
    class="group inline-flex min-w-0 max-w-full items-center gap-1 whitespace-nowrap"
  >
    <Tooltip :title="display" placement="topLeft">
      <span
        class="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap"
      >
        {{ display }}
      </span>
    </Tooltip>
    <Tooltip title="复制完整内容">
      <Button
        type="text"
        size="small"
        class="h-6 w-6 shrink-0 p-0 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
        :disabled="display === '-'"
        :aria-label="`复制${label}`"
        @click.stop="copyId(value, label)"
      >
        <IconifyIcon icon="lucide:copy" class="text-sm" />
      </Button>
    </Tooltip>
  </span>
</template>
