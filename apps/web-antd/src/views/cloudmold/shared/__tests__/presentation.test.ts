import { describe, expect, it } from 'vitest';

import { statusSelect, withCloudMoldTableColumns } from '../form-helpers';
import { cloudMoldPageIntro, visibleCloudMoldPageKeys } from '../page-intro';
import { cloudMoldEnumLabel, cloudMoldStatusMeta } from '../status-meta';

describe('cloudmold 管理端展示规范', () => {
  it('将领域枚举转换为用户可理解的中文', () => {
    expect(cloudMoldEnumLabel('DELIVERED')).toBe('已送达');
    expect(cloudMoldEnumLabel('INTERNAL_TEST')).toBe('内部测试');
    expect(cloudMoldEnumLabel('MIGRATION_OPENING')).toBe('迁移开账');
    expect(cloudMoldEnumLabel('NOT_A_REAL_STATUS')).toBe(
      '未知（NOT_A_REAL_STATUS）',
    );
  });

  it('为状态筛选器生成中文选项', () => {
    const schema = statusSelect('status', [
      'CREATED',
      'IN_TRANSIT',
      'DELIVERED',
    ]);
    expect(schema.component).toBe('Select');
    expect(schema.componentProps).toMatchObject({
      allowClear: true,
      options: [
        { label: '待发货', value: 'CREATED' },
        { label: '运输中', value: 'IN_TRANSIT' },
        { label: '已送达', value: 'DELIVERED' },
      ],
    });
  });

  it('为普通表格列启用单行截断和悬浮完整值', () => {
    const columns = withCloudMoldTableColumns([
      { field: 'orderNo', title: '订单号' },
      {
        field: 'status',
        slots: { default: 'status' },
        title: '状态',
      },
      { field: 'action', title: '操作' },
    ]);
    expect(columns?.[0]).toMatchObject({ showOverflow: 'tooltip' });
    expect(columns?.[1]).toMatchObject({ showOverflow: false });
    expect(columns?.[2]).toMatchObject({ showOverflow: false });
  });

  it('覆盖当前菜单中的全部业务页面，并避免技术实现话术', () => {
    expect(visibleCloudMoldPageKeys).toHaveLength(11);
    for (const key of visibleCloudMoldPageKeys) {
      const intro = cloudMoldPageIntro[key];
      expect(intro.title.length).toBeLessThanOrEqual(12);
      expect(intro.description.length).toBeLessThanOrEqual(58);
      expect(`${intro.title}${intro.description}`).not.toMatch(
        /canonical|CloudMold|yudao|权威|规范表/i,
      );
    }
  });

  it('为常用状态提供颜色和中文标签', () => {
    expect(cloudMoldStatusMeta('REFUNDED')).toEqual({
      color: 'success',
      label: '已退款',
    });
    expect(cloudMoldStatusMeta('REJECTED')).toEqual({
      color: 'error',
      label: '已驳回',
    });
  });
});
