<script lang="ts" setup>
import { Alert } from 'ant-design-vue';

/**
 * CloudMold 红区统一的「证据边界」提示块。
 * 抽自 catalog / inventory / commerce / data-readiness 四个页面里
 * 各自手写的 <Alert> 证据边界说明，保证措辞与位置一致。
 */
interface Props {
  description?: string;
  message: string;
  type?: 'error' | 'info' | 'success' | 'warning';
}

withDefaults(defineProps<Props>(), {
  description: '',
  type: 'info',
});
</script>

<template>
  <Alert
    class="mb-4"
    show-icon
    :description="description || undefined"
    :message="message"
    :type="type"
  />
</template>
