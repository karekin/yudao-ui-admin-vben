import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestClient } from '#/api/request';

import {
  getCloudMoldCrmContactPage,
  getCloudMoldCrmCustomerPage,
  getCloudMoldCrmFollowUpPage,
  getCloudMoldCrmLeadPage,
  getCloudMoldCrmOpportunityPage,
  getCloudMoldCrmPoolPage,
  getCloudMoldCrmWorkbench,
} from './index';

vi.mock('#/api/request', () => ({
  requestClient: { get: vi.fn() },
}));

describe('cloudmold crm api', () => {
  beforeEach(() => {
    vi.mocked(requestClient.get).mockReset();
  });

  it('loads the CRM sales workbench from the CloudMold authority', async () => {
    await getCloudMoldCrmWorkbench();

    expect(requestClient.get).toHaveBeenCalledWith('/cloudmold/crm/workbench');
  });

  it('routes entity page queries through the exact CloudMold CRM endpoints', async () => {
    const params = {
      keyword: 'owner-a',
      lifecycleStatus: 'ACTIVE',
      pageNo: 2,
      pageSize: 10,
    };

    await getCloudMoldCrmCustomerPage(params);
    await getCloudMoldCrmLeadPage(params);
    await getCloudMoldCrmContactPage(params);
    await getCloudMoldCrmOpportunityPage(params);
    await getCloudMoldCrmFollowUpPage(params);
    await getCloudMoldCrmPoolPage(params);

    expect(requestClient.get).toHaveBeenNthCalledWith(
      1,
      '/cloudmold/crm/customers',
      { params },
    );
    expect(requestClient.get).toHaveBeenNthCalledWith(
      2,
      '/cloudmold/crm/leads',
      { params },
    );
    expect(requestClient.get).toHaveBeenNthCalledWith(
      3,
      '/cloudmold/crm/contacts',
      { params },
    );
    expect(requestClient.get).toHaveBeenNthCalledWith(
      4,
      '/cloudmold/crm/opportunities',
      { params },
    );
    expect(requestClient.get).toHaveBeenNthCalledWith(
      5,
      '/cloudmold/crm/follow-ups',
      { params },
    );
    expect(requestClient.get).toHaveBeenNthCalledWith(
      6,
      '/cloudmold/crm/pool',
      { params },
    );
  });
});
