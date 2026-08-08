import { describe, expect, it } from 'vitest';

import { CRM_COMMAND_OPERATIONS } from '#/api/cloudmold/crm/command';

import {
  CLOUDMOLD_CRM_COMPONENT_PATHS,
  CLOUDMOLD_CRM_WORKBENCH_COMPONENT_PATH,
  cloudMoldCrmPageContracts,
} from './contracts';

describe('cloudmold crm page contracts', () => {
  it('registers every menu page under CloudMold-owned component paths only', () => {
    expect(CLOUDMOLD_CRM_WORKBENCH_COMPONENT_PATH).toBe(
      'cloudmold/crm/workbench/index',
    );
    expect(CLOUDMOLD_CRM_COMPONENT_PATHS).toEqual([
      'cloudmold/crm/workbench/index',
      'cloudmold/crm/business/index',
      'cloudmold/crm/clue/index',
      'cloudmold/crm/contact/index',
      'cloudmold/crm/customer/index',
      'cloudmold/crm/followup/index',
      'cloudmold/crm/customer/pool/index',
      'cloudmold/crm/sales-contract/index',
    ]);
    expect(
      CLOUDMOLD_CRM_COMPONENT_PATHS.every(
        (path) => path.startsWith('cloudmold/crm/') && !path.startsWith('crm/'),
      ),
    ).toBe(true);
  });

  it('keeps every page bound to the new CloudMold CRM REST surface', () => {
    expect(cloudMoldCrmPageContracts.clue.endpoint).toBe('leads');
    expect(cloudMoldCrmPageContracts.customer.endpoint).toBe('customers');
    expect(cloudMoldCrmPageContracts.contact.endpoint).toBe('contacts');
    expect(cloudMoldCrmPageContracts.business.endpoint).toBe('opportunities');
    expect(cloudMoldCrmPageContracts.followup.endpoint).toBe('follow-ups');
    expect(cloudMoldCrmPageContracts.pool.endpoint).toBe('pool');
    expect(cloudMoldCrmPageContracts.salesContract.endpoint).toBe(
      'sales-contracts',
    );
  });

  it('uses only operations that currently exist on the backend', () => {
    expect(cloudMoldCrmPageContracts.clue.operation).toBe(
      CRM_COMMAND_OPERATIONS.ASSIGN_LEAD,
    );
    expect(cloudMoldCrmPageContracts.customer.operation).toBe(
      CRM_COMMAND_OPERATIONS.RETURN_CUSTOMER_TO_POOL,
    );
    expect(cloudMoldCrmPageContracts.contact.operation).toBe(
      CRM_COMMAND_OPERATIONS.UPDATE_CONTACT,
    );
    expect(cloudMoldCrmPageContracts.business.operation).toBe(
      CRM_COMMAND_OPERATIONS.UPDATE_OPPORTUNITY,
    );
    expect(cloudMoldCrmPageContracts.followup.operation).toBe(
      CRM_COMMAND_OPERATIONS.RECORD_FOLLOW_UP,
    );
    expect(cloudMoldCrmPageContracts.pool.operation).toBe(
      CRM_COMMAND_OPERATIONS.CLAIM_CUSTOMER,
    );
    expect(cloudMoldCrmPageContracts.salesContract.operation).toBe(
      'UPDATE_DRAFT',
    );
  });
});
