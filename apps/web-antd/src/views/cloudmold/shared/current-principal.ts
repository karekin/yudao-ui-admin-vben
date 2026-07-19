import { useUserStore } from '@vben/stores';

import { resolveCloudMoldSourceIdentity } from '#/api/cloudmold/identity';

/**
 * 当前登录管理员对应的 CloudMold principal 解析（会话内缓存）。
 *
 * CloudMold 写命令的 principal 字段（如 risk DECIDE 的 decidedByPrincipalId）
 * 需规范 principal id，而前端 userStore 只有 yudao userId；通过 identity
 * source resolve（SYSTEM / SYSTEM_ADMIN_USER / userId）映射。resolve 失败
 * （管理员未 link source）返回 null，调用方应据此禁用需 principal 的操作。
 */

let cachedPrincipal: null | string | undefined;

export async function getCurrentPrincipal(): Promise<null | string> {
  if (cachedPrincipal !== undefined) {
    return cachedPrincipal;
  }
  const userStore = useUserStore();
  const userId = userStore.userInfo?.id;
  if (!userId) {
    cachedPrincipal = null;
    return null;
  }
  try {
    const source = await resolveCloudMoldSourceIdentity({
      sourceId: String(userId),
      sourceSystem: 'SYSTEM',
      sourceType: 'SYSTEM_ADMIN_USER',
    });
    cachedPrincipal = source?.principalId ?? null;
  } catch {
    cachedPrincipal = null;
  }
  return cachedPrincipal;
}
