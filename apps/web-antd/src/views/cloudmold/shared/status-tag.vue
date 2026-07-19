<script lang="ts" setup>
import { Tag } from 'ant-design-vue';

/**
 * CloudMold 红区统一的状态标签渲染。
 * 各领域状态语义不同（catalog 数字枚举 / commerce 字符串枚举 /
 * data-readiness 健康度），解析逻辑保留在各自页面或 data.ts，
 * 解析结果以 color + label 传入；未提供 label 时回退为 fallback（默认 UNKNOWN），
 * 保证「未接入 / 未知」状态永远诚实显示，不用空值冒充就绪。
 */
interface Props {
  color?: string;
  fallback?: string;
  label?: null | number | string | undefined;
}

withDefaults(defineProps<Props>(), {
  color: 'default',
  fallback: 'UNKNOWN',
  label: null,
});
</script>

<template>
  <Tag :color="color">{{ label ?? fallback }}</Tag>
</template>
