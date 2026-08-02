import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestClient } from '#/api/request';

import {
  approveMatchOverride,
  createReconciliationRun,
  executeSupplierInvoiceCommand,
  getFinancialImpact,
  getFinancialImpactPage,
  getJournalPage,
  getReconciliationLine,
  getReconciliationRun,
  getReconciliationRunPage,
  getSupplierInvoice,
  reverseJournal,
} from './index';

vi.mock('#/api/request', () => ({
  requestClient: { get: vi.fn(), post: vi.fn() },
}));

describe('cloudmold finance procure-to-pay api', () => {
  beforeEach(() => {
    vi.mocked(requestClient.get).mockReset();
    vi.mocked(requestClient.post).mockReset();
  });

  it('queries the CloudMold journal authority', async () => {
    const params = { pageNo: 1, pageSize: 20 };
    await getJournalPage(params);
    expect(requestClient.get).toHaveBeenCalledWith(
      '/cloudmold/finance/procure-to-pay/journals/page',
      { params },
    );
  });

  it('queries formal financial impacts through the inventory-control finance surface', async () => {
    const params = { pageNo: 1, pageSize: 20, sourceType: 'SUPPLIER_RETURN' };

    await getFinancialImpactPage(params);
    await getFinancialImpact('posting/id');

    expect(requestClient.get).toHaveBeenNthCalledWith(
      1,
      '/cloudmold/finance/financial-impacts/page',
      { params },
    );
    expect(requestClient.get).toHaveBeenNthCalledWith(
      2,
      '/cloudmold/finance/financial-impacts/posting%2Fid',
    );
  });

  it('loads an encoded supplier-invoice match detail', async () => {
    await getSupplierInvoice('invoice/id');
    expect(requestClient.get).toHaveBeenCalledWith(
      '/cloudmold/finance/procure-to-pay/supplier-invoices/invoice%2Fid',
    );
  });

  it('keeps invoice matching and exception override as typed commands', async () => {
    await executeSupplierInvoiceCommand({
      expectedVersion: 2,
      matchPolicyId: 'policy-1',
      matchPolicyVersion: 1,
      operation: 'RUN_THREE_WAY_MATCH',
      supplierInvoiceId: 'invoice-1',
    });
    await approveMatchOverride({
      exceptionId: 'exception-1',
      expectedVersion: 1,
      operation: 'APPROVE_MATCH_OVERRIDE',
      reasonCode: 'VERIFIED',
      resolutionEvidenceSha256: 'a'.repeat(64),
    });
    expect(requestClient.post).toHaveBeenNthCalledWith(
      1,
      '/cloudmold/finance/procure-to-pay/supplier-invoices/command',
      expect.objectContaining({
        envelope: expect.objectContaining({
          idempotencyKey: expect.any(String),
        }),
        operation: 'RUN_THREE_WAY_MATCH',
      }),
    );
    expect(requestClient.post).toHaveBeenNthCalledWith(
      2,
      '/cloudmold/finance/procure-to-pay/match-exceptions/command',
      expect.objectContaining({ operation: 'APPROVE_MATCH_OVERRIDE' }),
    );
  });

  it('reverses a posted journal through a new immutable journal command', async () => {
    await reverseJournal({
      accountingDate: '2026-08-02',
      accountingPeriodId: 'period-1',
      expectedVersion: 3,
      operation: 'REVERSE_JOURNAL',
      originalJournalEntryId: 'journal-1',
      reasonCode: 'CORRECTION',
      reversalEvidenceSha256: 'b'.repeat(64),
      reversalJournalCode: 'REV-J-1',
      reversalJournalEntryId: 'journal-2',
    });
    expect(requestClient.post).toHaveBeenCalledWith(
      '/cloudmold/finance/procure-to-pay/journals/command',
      expect.objectContaining({ operation: 'REVERSE_JOURNAL' }),
    );
  });

  it('queries and creates procure-inventory-finance reconciliations via formal finance endpoints', async () => {
    const params = { currencyCode: 'CNY', pageNo: 1, pageSize: 20 };

    await getReconciliationRunPage(params);
    await getReconciliationRun('run/id');
    await getReconciliationLine('run/id', 'line/id');
    await createReconciliationRun({
      correlationId: 'corr-1',
      currencyCode: 'CNY',
      idempotencyKey: 'idem-1',
      legalEntityId: 'legal-1',
      occurredAt: '2026-08-02T08:00:00Z',
      runId: 'run-1',
    });

    expect(requestClient.get).toHaveBeenNthCalledWith(
      1,
      '/cloudmold/finance/procure-to-pay/reconciliations/runs/page',
      { params },
    );
    expect(requestClient.get).toHaveBeenNthCalledWith(
      2,
      '/cloudmold/finance/procure-to-pay/reconciliations/runs/run%2Fid',
    );
    expect(requestClient.get).toHaveBeenNthCalledWith(
      3,
      '/cloudmold/finance/procure-to-pay/reconciliations/lines/line%2Fid',
      { params: { runId: 'run/id' } },
    );
    expect(requestClient.post).toHaveBeenLastCalledWith(
      '/cloudmold/finance/procure-to-pay/reconciliations/runs',
      expect.objectContaining({
        currencyCode: 'CNY',
        legalEntityId: 'legal-1',
        runId: 'run-1',
      }),
    );
  });
});
