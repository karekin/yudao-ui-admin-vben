<script lang="ts" setup>
import type { VisibleCloudMoldPageKey } from './page-intro';

import { computed } from 'vue';

import { Alert, Tooltip } from 'ant-design-vue';

import { cloudMoldPageIntro } from './page-intro';

/**
 * CloudMold 红区统一的「证据边界」提示块。
 * 抽自 catalog / inventory / commerce / data-readiness 四个页面里
 * 各自手写的 <Alert> 证据边界说明，保证措辞与位置一致。
 */
interface Props {
  description?: string;
  message?: string;
  page?: VisibleCloudMoldPageKey;
  type?: 'error' | 'info' | 'success' | 'warning';
}

const props = withDefaults(defineProps<Props>(), {
  description: '',
  message: '',
  page: undefined,
  type: 'info',
});

const resolved = computed(() =>
  props.page
    ? cloudMoldPageIntro[props.page]
    : { description: props.description, title: props.message },
);
</script>

<template>
  <Alert class="cloudmold-page-intro mb-2" show-icon :type="type">
    <template #message>
      <Tooltip
        :title="resolved.description || undefined"
        placement="bottomLeft"
      >
        <div class="flex min-w-0 items-center gap-2">
          <span class="shrink-0 font-medium">{{ resolved.title }}</span>
          <span
            v-if="resolved.description"
            class="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-sm opacity-75"
          >
            {{ resolved.description }}
          </span>
        </div>
      </Tooltip>
    </template>
  </Alert>
</template>

<style scoped>
:deep(.cloudmold-page-intro.ant-alert) {
  min-height: 38px;
  padding: 7px 12px;
}

:deep(.cloudmold-page-intro .ant-alert-icon) {
  margin-top: 1px;
}

:deep(.cloudmold-page-intro .ant-alert-message) {
  width: 100%;
  margin-bottom: 0;
}
</style>

<style>
.vxe-table--tooltip-wrapper {
  user-select: text;
}
</style>
