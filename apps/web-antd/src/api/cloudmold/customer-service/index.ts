import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace CloudMoldCustomerServiceApi {
  export interface Ticket {
    aggregateVersion: number;
    assignedAgentPrincipalId?: string;
    categoryCode: string;
    channelCode: string;
    createdAt: string;
    customerPrincipalId: string;
    priority: string;
    resolutionDeadlineAt?: string;
    status: string;
    ticketId: string;
    ticketNo: string;
    updatedAt: string;
  }

  export interface TicketPageParams extends PageParam {
    assignedAgentPrincipalId?: string;
    categoryCode?: string;
    channelCode?: string;
    createdAtFrom?: string;
    createdAtTo?: string;
    customerPrincipalId?: string;
    priority?: string;
    status?: string;
    ticketId?: string;
    ticketNo?: string;
  }
}

export function getCloudMoldCustomerServiceTicketPage(
  params: CloudMoldCustomerServiceApi.TicketPageParams,
) {
  return requestClient.get<PageResult<CloudMoldCustomerServiceApi.Ticket>>(
    '/cloudmold/customer-service/ticket/page',
    { params },
  );
}
