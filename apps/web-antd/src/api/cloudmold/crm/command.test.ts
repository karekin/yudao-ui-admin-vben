import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestClient } from '#/api/request';

import {
  assignLead,
  claimCustomer,
  createContact,
  createCustomer,
  createLead,
  createOpportunity,
  CRM_COMMAND_OPERATIONS,
  recordFollowUp,
  returnCustomerToPool,
  updateContact,
  updateCustomer,
  updateLead,
  updateOpportunity,
} from './command';

vi.mock('#/api/request', () => ({
  requestClient: { post: vi.fn() },
}));

describe('cloudmold crm command api', () => {
  beforeEach(() => {
    vi.mocked(requestClient.post).mockReset();
  });

  it('submits only supported CloudMold CRM create operations', async () => {
    await createCustomer({ customerName: 'Customer A' });
    await createLead({ leadName: 'Lead A' });
    await createContact({ contactName: 'Contact A' });
    await createOpportunity({ opportunityName: 'Opportunity A' });
    await recordFollowUp({
      subjectId: 'customer-1',
      subjectType: 'CUSTOMER',
      summary: 'Follow up tomorrow',
    });

    expect(requestClient.post).toHaveBeenNthCalledWith(
      1,
      '/cloudmold/crm/command',
      expect.objectContaining({
        customer: { customerName: 'Customer A' },
        operation: CRM_COMMAND_OPERATIONS.CREATE_CUSTOMER,
      }),
    );
    expect(requestClient.post).toHaveBeenNthCalledWith(
      2,
      '/cloudmold/crm/command',
      expect.objectContaining({
        lead: { leadName: 'Lead A' },
        operation: CRM_COMMAND_OPERATIONS.CREATE_LEAD,
      }),
    );
    expect(requestClient.post).toHaveBeenNthCalledWith(
      3,
      '/cloudmold/crm/command',
      expect.objectContaining({
        contact: { contactName: 'Contact A' },
        operation: CRM_COMMAND_OPERATIONS.CREATE_CONTACT,
      }),
    );
    expect(requestClient.post).toHaveBeenNthCalledWith(
      4,
      '/cloudmold/crm/command',
      expect.objectContaining({
        operation: CRM_COMMAND_OPERATIONS.CREATE_OPPORTUNITY,
        opportunity: { opportunityName: 'Opportunity A' },
      }),
    );
    expect(requestClient.post).toHaveBeenNthCalledWith(
      5,
      '/cloudmold/crm/command',
      expect.objectContaining({
        followUp: {
          subjectId: 'customer-1',
          subjectType: 'CUSTOMER',
          summary: 'Follow up tomorrow',
        },
        operation: CRM_COMMAND_OPERATIONS.RECORD_FOLLOW_UP,
      }),
    );
  });

  it('adds the exact top-level command envelope to supported update/claim operations', async () => {
    await updateCustomer(
      {
        customerId: 'customer-1',
        customerName: 'Customer A',
        expectedVersion: 4,
      },
      'OWNER_CHANGED',
    );
    await returnCustomerToPool(
      { customerId: 'customer-1', expectedVersion: 5 },
      'NO_RESPONSE',
    );
    await claimCustomer(
      {
        customerId: 'customer-2',
        expectedVersion: 6,
        ownerPrincipalId: 'PRINCIPAL-2',
      },
      'MANUAL_CLAIM',
    );
    await updateLead(
      { leadId: 'lead-1', leadName: 'Lead A', expectedVersion: 7 },
      'DATA_PATCH',
    );
    await assignLead(
      {
        leadId: 'lead-2',
        leadName: 'Lead B',
        ownerPrincipalId: 'PRINCIPAL-2',
        expectedVersion: 8,
      },
      'OWNER_REASSIGNED',
    );
    await updateContact(
      { contactId: 'contact-1', contactName: 'Contact A', expectedVersion: 9 },
      'CONTACT_REFRESH',
    );
    await updateOpportunity(
      {
        opportunityId: 'opp-1',
        opportunityName: 'Opportunity A',
        expectedVersion: 10,
      },
      'PIPELINE_REFRESH',
    );

    for (const expectedOperation of [
      CRM_COMMAND_OPERATIONS.UPDATE_CUSTOMER,
      CRM_COMMAND_OPERATIONS.RETURN_CUSTOMER_TO_POOL,
      CRM_COMMAND_OPERATIONS.CLAIM_CUSTOMER,
      CRM_COMMAND_OPERATIONS.UPDATE_LEAD,
      CRM_COMMAND_OPERATIONS.ASSIGN_LEAD,
      CRM_COMMAND_OPERATIONS.UPDATE_CONTACT,
      CRM_COMMAND_OPERATIONS.UPDATE_OPPORTUNITY,
    ]) {
      expect(requestClient.post).toHaveBeenCalledWith(
        '/cloudmold/crm/command',
        expect.objectContaining({
          causationId: expect.any(String),
          correlationId: expect.any(String),
          idempotencyKey: expect.any(String),
          occurredAt: expect.any(String),
          operation: expectedOperation,
          reasonCode: expect.any(String),
          runId: expect.any(String),
        }),
      );
    }

    expect(requestClient.post).toHaveBeenCalledWith(
      '/cloudmold/crm/command',
      expect.objectContaining({
        customer: expect.objectContaining({ ownerPrincipalId: 'PRINCIPAL-2' }),
        operation: CRM_COMMAND_OPERATIONS.CLAIM_CUSTOMER,
      }),
    );
  });
});
