import { requestClient } from '#/api/request';

export namespace CloudMoldAgentControlApi {
  export type CardType = 'APPROVAL' | 'HANDOFF' | 'RESULT';

  export interface BusinessCard {
    actionCode: string;
    cardId: string;
    cardType: CardType;
    fromRoleCode?: string;
    missionId?: string;
    occurredAt: string;
    outcomeCode?: string;
    riskLevel: string;
    roleCode: string;
    status: string;
    summary?: string;
    title: string;
    workOrderId: string;
  }

  export interface BusinessCardParams {
    cardType?: CardType;
    limit?: number;
    roleCode?: string;
    status?: string;
  }
}

export function getCloudMoldAgentBusinessCards(
  params: CloudMoldAgentControlApi.BusinessCardParams,
) {
  return requestClient.get<CloudMoldAgentControlApi.BusinessCard[]>(
    '/cloudmold/agent-control/business-cards',
    { params },
  );
}
