import { useClipboard } from '@vueuse/core';
import { message } from 'ant-design-vue';

/**
 * CloudMold 红区统一的「复制规范 ID」交互。
 * 复制到剪贴板走仓库事实标准 useClipboard（兼容 HTTP 环境的 legacy 模式），
 * 成功 / 失败都给可定位的提示，避免静默失败。
 */
export function useCopyId() {
  const { copy, copied, isSupported } = useClipboard({ legacy: true });

  async function copyId(
    value: null | number | string | undefined,
    label = '规范 ID',
  ) {
    if (value === null || value === undefined || value === '') {
      message.warning('当前行无可复制的 ID');
      return;
    }
    await copy(String(value));
    message.success(`${label}已复制：${value}`);
  }

  return { copy, copied, copyId, isSupported };
}
