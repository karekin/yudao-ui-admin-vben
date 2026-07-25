import { describe, expect, it } from 'vitest';

import {
  getWorkbenchMeta,
  matchesWorkbenchItem,
  shortReference,
  statusMeta,
} from './operations-workbench';

describe('operations workbench helpers', () => {
  it('returns localized status metadata and preserves unknown values', () => {
    expect(getWorkbenchMeta(statusMeta, 'IN_PROGRESS')).toEqual({
      color: 'processing',
      label: '处理中',
    });
    expect(getWorkbenchMeta(statusMeta, 'CUSTOM_STATE')).toEqual({
      color: 'default',
      label: 'CUSTOM STATE',
    });
  });

  it('matches business fields without case sensitivity', () => {
    const item = {
      code: 'PLAN-SH-01',
      itemType: 'SUPPLY_PLAN',
      relatedRef: 'warehouse-east',
      status: 'APPROVED',
    };

    expect(matchesWorkbenchItem(item, 'plan-sh')).toBe(true);
    expect(matchesWorkbenchItem(item, 'WAREHOUSE')).toBe(true);
    expect(matchesWorkbenchItem(item, 'missing')).toBe(false);
  });

  it('shortens technical references while keeping both identifying ends', () => {
    expect(shortReference('55ce4440-0126-4c85-b6c1-10c3b5217c7f')).toBe(
      '55ce4440-0…217c7f',
    );
    expect(shortReference('short-ref')).toBe('short-ref');
  });
});
