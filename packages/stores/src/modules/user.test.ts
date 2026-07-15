import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useUserStore } from './user';

describe('useUserStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('returns correct userInfo', () => {
    const store = useUserStore();
    const userInfo: any = { name: 'Jane Doe', roles: [{ value: 'user' }] };
    store.setUserInfo(userInfo);
    expect(store.userInfo).toEqual(userInfo);
  });

  // 测试退出登录重置 Store 时的行为
  it('clears userInfo and userRoles when resetting the store', () => {
    const store = useUserStore();
    store.setUserInfo({
      nickname: 'User',
    } as any);
    store.setUserRoles(['user']);
    expect(store.userInfo).not.toBeNull();
    expect(store.userRoles.length).toBeGreaterThan(0);

    store.$reset();
    expect(store.userInfo).toBeNull();
    expect(store.userRoles).toEqual([]);
  });

  // 测试在没有用户角色时返回空数组
  it('returns an empty array for userRoles if not set', () => {
    const store = useUserStore();
    expect(store.userRoles).toEqual([]);
  });
});
