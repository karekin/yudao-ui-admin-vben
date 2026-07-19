import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace CloudMoldEventOutboxApi {
  export interface EventOutbox {
    aggregateId: string;
    aggregateType: string;
    aggregateVersion: number;
    attemptCount: number;
    destination: string;
    eventId: string;
    eventType: string;
    occurredAt: string;
    publishedAt?: string;
    recordedAt: string;
    schemaVersion: number;
    status: number;
  }

  export interface EventOutboxPageParams extends PageParam {
    aggregateId?: string;
    aggregateType?: string;
    eventId?: string;
    eventType?: string;
    recordedAtFrom?: string;
    recordedAtTo?: string;
    status?: string;
  }
}

export function getCloudMoldEventOutboxPage(
  params: CloudMoldEventOutboxApi.EventOutboxPageParams,
) {
  return requestClient.get<PageResult<CloudMoldEventOutboxApi.EventOutbox>>(
    '/cloudmold/event-outbox/page',
    { params },
  );
}
