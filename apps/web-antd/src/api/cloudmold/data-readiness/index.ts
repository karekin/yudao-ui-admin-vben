import { requestClient } from '#/api/request';

export namespace CloudMoldDataReadinessApi {
  export interface EvidenceSection {
    boundary: string;
    connectionStatus: 'CONNECTED' | 'NOT_CONNECTED' | 'UNKNOWN';
    generatedAt: string;
    status: string;
  }

  export interface OutboxOverview {
    boundary: string;
    claimedCount: number;
    deadCount: number;
    generatedAt: string;
    latestPublishedAt?: string;
    latestRecordedAt?: string;
    oldestPendingRecordedAt?: string;
    pendingCount: number;
    publishedCount: number;
  }

  export interface Overview {
    ads: EvidenceSection;
    cdc: EvidenceSection;
    dqc: EvidenceSection;
    generatedAt: string;
    outbox: OutboxOverview;
    sourceGraduation: EvidenceSection;
  }
}

export function getCloudMoldDataReadinessOverview() {
  return requestClient.get<CloudMoldDataReadinessApi.Overview>(
    '/cloudmold/data-readiness/overview',
  );
}
