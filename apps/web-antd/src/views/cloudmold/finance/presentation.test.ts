import { describe, expect, it } from 'vitest';

import {
  addInt64Strings,
  financeActions,
  formatMinorMoney,
  isBalancedJournal,
  subtractInt64Strings,
} from './presentation';

describe('finance procure-to-pay presentation', () => {
  it('keeps three-way matching separate from invoice approval and posting', () => {
    expect(financeActions('INVOICE', 'SUBMITTED')).toEqual([
      {
        kind: 'RUN_MATCH',
        label: '三单匹配',
        operation: 'RUN_THREE_WAY_MATCH',
      },
    ]);
    expect(financeActions('INVOICE', 'APPROVED')).toEqual([
      { kind: 'DIRECT', label: '过账', operation: 'POST_SUPPLIER_INVOICE' },
    ]);
  });

  it('only offers reversal for posted journals', () => {
    expect(financeActions('JOURNAL', 'DRAFT')).toEqual([]);
    expect(financeActions('JOURNAL', 'POSTED')[0]?.operation).toBe(
      'REVERSE_JOURNAL',
    );
  });

  it('detects unbalanced journal evidence', () => {
    expect(
      isBalancedJournal({
        accountingDate: '2026-08-02',
        aggregateVersion: 1,
        currencyCode: 'CNY',
        journalCode: 'J-1',
        journalEntryId: 'j1',
        journalType: 'SUPPLIER_INVOICE',
        sourceAggregateId: 'i1',
        sourceAggregateType: 'SUPPLIER_INVOICE',
        status: 'POSTED',
        totalCreditAmountMinor: '100',
        totalDebitAmountMinor: '99',
        updatedAt: '2026-08-02T00:00:00Z',
      }),
    ).toBe(false);
  });

  it('keeps BIGINT money exact beyond JavaScript safe integers', () => {
    expect(formatMinorMoney('900719925474099399', 'CNY')).toBe(
      '¥9,007,199,254,740,993.99',
    );
    expect(addInt64Strings(['900719925474099300', '99'])).toBe(
      '900719925474099399',
    );
    expect(subtractInt64Strings('900719925474099399', '99')).toBe(
      '900719925474099300',
    );
  });
});
