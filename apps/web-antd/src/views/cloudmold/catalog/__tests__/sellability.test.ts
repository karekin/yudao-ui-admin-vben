import { describe, expect, it } from 'vitest';

import {
  blockerLabel,
  qualityDecisionMeta,
  qualityStatusMeta,
  sellabilityStatusMeta,
} from '../data';

describe('catalog sellability presentation', () => {
  it('uses explicit success labels only for verified and sellable states', () => {
    expect(qualityStatusMeta.VERIFIED).toEqual({
      color: 'success',
      label: '鉴别通过',
    });
    expect(qualityDecisionMeta.PASS).toEqual({
      color: 'success',
      label: '通过',
    });
    expect(sellabilityStatusMeta.sellable.label).toBe('可售');
  });

  it('renders blocked and unknown reasons honestly', () => {
    expect(qualityStatusMeta.RECALLED.color).toBe('error');
    expect(blockerLabel('NO_ALLOCATABLE_INVENTORY')).toBe('没有可分配库存');
    expect(blockerLabel('NEW_GATE')).toBe('NEW GATE');
  });
});
