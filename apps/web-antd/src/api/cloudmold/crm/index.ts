import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export interface CloudMoldCrmPageParams extends PageParam {
  actorPrincipalId?: string;
  contactId?: string;
  createdAtFrom?: string;
  createdAtTo?: string;
  customerCode?: string;
  customerId?: string;
  industryCode?: string;
  isPrimary?: boolean;
  keyword?: string;
  leadCode?: string;
  leadId?: string;
  lifecycleStatus?: string;
  methodCode?: string;
  opportunityCode?: string;
  opportunityId?: string;
  ownerPrincipalId?: string;
  poolStatus?: string;
  regionCode?: string;
  sourceCode?: string;
  stage?: string;
  status?: string;
  subjectId?: string;
  subjectType?: string;
}

export interface CloudMoldCrmCustomerView {
  createdAt?: string;
  customerCode?: string;
  customerId: string;
  customerName: string;
  industryCode?: string;
  levelCode?: string;
  lifecycleStatus: string;
  nextFollowUpAt?: string;
  ownerPrincipalId?: string;
  poolStatus?: string;
  regionCode?: string;
  sourceCode?: string;
  updatedAt?: string;
  version?: number;
}

export interface CloudMoldCrmLeadView {
  contactChannelRef?: string;
  createdAt?: string;
  leadCode?: string;
  leadId: string;
  leadName: string;
  maskedContact?: string;
  nextFollowUpAt?: string;
  ownerPrincipalId?: string;
  sourceCode?: string;
  status: string;
  updatedAt?: string;
  version?: number;
}

export interface CloudMoldCrmContactView {
  contactChannelRef?: string;
  contactId: string;
  contactName: string;
  createdAt?: string;
  customerId?: string;
  isPrimary?: boolean;
  maskedContact?: string;
  roleTitle?: string;
  status: string;
  updatedAt?: string;
  version?: number;
}

export interface CloudMoldCrmOpportunityView {
  createdAt?: string;
  currencyCode?: string;
  customerId?: string;
  expectedAmountMinor?: number;
  expectedCloseDate?: string;
  opportunityCode?: string;
  opportunityId: string;
  opportunityName: string;
  ownerPrincipalId?: string;
  stage?: string;
  updatedAt?: string;
  version?: number;
}

export interface CloudMoldCrmFollowUpView {
  actorPrincipalId?: string;
  createdAt?: string;
  followUpId: string;
  methodCode?: string;
  nextFollowUpAt?: string;
  occurredAt?: string;
  subjectCode?: string;
  subjectId?: string;
  subjectName?: string;
  subjectType?: string;
  summary?: string;
}

export interface CloudMoldCrmWorkbenchView {
  dueFollowUpCount: number;
  openOpportunityCount: number;
  overdueFollowUpCount: number;
  ownedCustomerCount: number;
  ownedLeadCount: number;
  ownerPrincipalId?: string;
  poolCustomerCount: number;
  upcomingFollowUps: CloudMoldCrmFollowUpView[];
}

export function getCloudMoldCrmWorkbench() {
  return requestClient.get<CloudMoldCrmWorkbenchView>(
    '/cloudmold/crm/workbench',
  );
}

export function getCloudMoldCrmCustomerPage(params: CloudMoldCrmPageParams) {
  return requestClient.get<PageResult<CloudMoldCrmCustomerView>>(
    '/cloudmold/crm/customers',
    { params },
  );
}

export function getCloudMoldCrmLeadPage(params: CloudMoldCrmPageParams) {
  return requestClient.get<PageResult<CloudMoldCrmLeadView>>(
    '/cloudmold/crm/leads',
    { params },
  );
}

export function getCloudMoldCrmContactPage(params: CloudMoldCrmPageParams) {
  return requestClient.get<PageResult<CloudMoldCrmContactView>>(
    '/cloudmold/crm/contacts',
    { params },
  );
}

export function getCloudMoldCrmOpportunityPage(params: CloudMoldCrmPageParams) {
  return requestClient.get<PageResult<CloudMoldCrmOpportunityView>>(
    '/cloudmold/crm/opportunities',
    { params },
  );
}

export function getCloudMoldCrmFollowUpPage(params: CloudMoldCrmPageParams) {
  return requestClient.get<PageResult<CloudMoldCrmFollowUpView>>(
    '/cloudmold/crm/follow-ups',
    { params },
  );
}

export function getCloudMoldCrmPoolPage(params: CloudMoldCrmPageParams) {
  return requestClient.get<PageResult<CloudMoldCrmCustomerView>>(
    '/cloudmold/crm/pool',
    { params },
  );
}
