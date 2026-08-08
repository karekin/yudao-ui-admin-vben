import { requestClient } from '#/api/request';

import { buildCommandEnvelopeWithRunId } from '../command-helpers';

export const CRM_COMMAND_OPERATIONS = {
  ASSIGN_LEAD: 'ASSIGN_LEAD',
  CLAIM_CUSTOMER: 'CLAIM_CUSTOMER',
  CREATE_CONTACT: 'CREATE_CONTACT',
  CREATE_CUSTOMER: 'CREATE_CUSTOMER',
  CREATE_LEAD: 'CREATE_LEAD',
  CREATE_OPPORTUNITY: 'CREATE_OPPORTUNITY',
  RECORD_FOLLOW_UP: 'RECORD_FOLLOW_UP',
  RETURN_CUSTOMER_TO_POOL: 'RETURN_CUSTOMER_TO_POOL',
  UPDATE_CONTACT: 'UPDATE_CONTACT',
  UPDATE_CUSTOMER: 'UPDATE_CUSTOMER',
  UPDATE_LEAD: 'UPDATE_LEAD',
  UPDATE_OPPORTUNITY: 'UPDATE_OPPORTUNITY',
} as const;

export type CloudMoldCrmCommandOperation =
  (typeof CRM_COMMAND_OPERATIONS)[keyof typeof CRM_COMMAND_OPERATIONS];

export interface CloudMoldCrmCommandResult {
  aggregateId: string;
  aggregateType: string;
  aggregateVersion: number;
  currentStatus?: string;
  duplicate: boolean;
  nextFollowUpAt?: string;
  operationId: number;
  ownerPrincipalId?: string;
  poolStatus?: string;
}

export interface CloudMoldCrmCustomerDefinition {
  customerCode?: string;
  customerId?: string;
  customerName?: string;
  expectedVersion?: number;
  industryCode?: string;
  levelCode?: string;
  lifecycleStatus?: string;
  nextFollowUpAt?: string;
  ownerPrincipalId?: string;
  poolStatus?: string;
  regionCode?: string;
  sourceCode?: string;
}

export interface CloudMoldCrmLeadDefinition {
  contactChannelRef?: string;
  expectedVersion?: number;
  leadCode?: string;
  leadId?: string;
  leadName?: string;
  maskedContact?: string;
  nextFollowUpAt?: string;
  ownerPrincipalId?: string;
  sourceCode?: string;
  status?: string;
}

export interface CloudMoldCrmContactDefinition {
  contactChannelRef?: string;
  contactId?: string;
  contactName?: string;
  customerId?: string;
  expectedVersion?: number;
  isPrimary?: boolean;
  maskedContact?: string;
  roleTitle?: string;
  status?: string;
}

export interface CloudMoldCrmOpportunityDefinition {
  currencyCode?: string;
  customerId?: string;
  expectedAmountMinor?: number;
  expectedCloseDate?: string;
  expectedVersion?: number;
  opportunityCode?: string;
  opportunityId?: string;
  opportunityName?: string;
  ownerPrincipalId?: string;
  stage?: string;
}

export interface CloudMoldCrmFollowUpDefinition {
  followUpId?: string;
  methodCode?: string;
  nextFollowUpAt?: string;
  subjectId: string;
  subjectType: string;
  summary: string;
}

interface CloudMoldCrmCommandRequest {
  contact?: CloudMoldCrmContactDefinition;
  customer?: CloudMoldCrmCustomerDefinition;
  followUp?: CloudMoldCrmFollowUpDefinition;
  lead?: CloudMoldCrmLeadDefinition;
  operation: CloudMoldCrmCommandOperation;
  opportunity?: CloudMoldCrmOpportunityDefinition;
  reasonCode?: string;
}

function executeCrmCommand({
  operation,
  reasonCode,
  ...definition
}: CloudMoldCrmCommandRequest) {
  const envelope = buildCommandEnvelopeWithRunId();
  return requestClient.post<CloudMoldCrmCommandResult>(
    '/cloudmold/crm/command',
    {
      ...definition,
      ...envelope,
      causationId: crypto.randomUUID(),
      operation,
      reasonCode,
    },
  );
}

export function createCustomer(customer: CloudMoldCrmCustomerDefinition) {
  return executeCrmCommand({
    customer,
    operation: CRM_COMMAND_OPERATIONS.CREATE_CUSTOMER,
  });
}

export function updateCustomer(
  customer: CloudMoldCrmCustomerDefinition,
  reasonCode?: string,
) {
  return executeCrmCommand({
    customer,
    operation: CRM_COMMAND_OPERATIONS.UPDATE_CUSTOMER,
    reasonCode,
  });
}

export function claimCustomer(
  customer: Pick<
    CloudMoldCrmCustomerDefinition,
    'customerId' | 'expectedVersion' | 'ownerPrincipalId'
  >,
  reasonCode?: string,
) {
  return executeCrmCommand({
    customer,
    operation: CRM_COMMAND_OPERATIONS.CLAIM_CUSTOMER,
    reasonCode,
  });
}

export function returnCustomerToPool(
  customer: Pick<
    CloudMoldCrmCustomerDefinition,
    'customerId' | 'expectedVersion'
  >,
  reasonCode?: string,
) {
  return executeCrmCommand({
    customer,
    operation: CRM_COMMAND_OPERATIONS.RETURN_CUSTOMER_TO_POOL,
    reasonCode,
  });
}

export function createLead(lead: CloudMoldCrmLeadDefinition) {
  return executeCrmCommand({
    lead,
    operation: CRM_COMMAND_OPERATIONS.CREATE_LEAD,
  });
}

export function updateLead(
  lead: CloudMoldCrmLeadDefinition,
  reasonCode?: string,
) {
  return executeCrmCommand({
    lead,
    operation: CRM_COMMAND_OPERATIONS.UPDATE_LEAD,
    reasonCode,
  });
}

export function assignLead(
  lead: CloudMoldCrmLeadDefinition,
  reasonCode?: string,
) {
  return executeCrmCommand({
    lead,
    operation: CRM_COMMAND_OPERATIONS.ASSIGN_LEAD,
    reasonCode,
  });
}

export function createContact(contact: CloudMoldCrmContactDefinition) {
  return executeCrmCommand({
    contact,
    operation: CRM_COMMAND_OPERATIONS.CREATE_CONTACT,
  });
}

export function updateContact(
  contact: CloudMoldCrmContactDefinition,
  reasonCode?: string,
) {
  return executeCrmCommand({
    contact,
    operation: CRM_COMMAND_OPERATIONS.UPDATE_CONTACT,
    reasonCode,
  });
}

export function createOpportunity(
  opportunity: CloudMoldCrmOpportunityDefinition,
) {
  return executeCrmCommand({
    operation: CRM_COMMAND_OPERATIONS.CREATE_OPPORTUNITY,
    opportunity,
  });
}

export function updateOpportunity(
  opportunity: CloudMoldCrmOpportunityDefinition,
  reasonCode?: string,
) {
  return executeCrmCommand({
    operation: CRM_COMMAND_OPERATIONS.UPDATE_OPPORTUNITY,
    opportunity,
    reasonCode,
  });
}

export function recordFollowUp(
  followUp: CloudMoldCrmFollowUpDefinition,
  reasonCode?: string,
) {
  return executeCrmCommand({
    followUp,
    operation: CRM_COMMAND_OPERATIONS.RECORD_FOLLOW_UP,
    reasonCode,
  });
}
