import { requestClient } from '#/api/request';

export namespace CloudMoldSupplierPerformanceApi {
  export interface Readiness {
    evidenceCounts: Record<string, number>;
    missingMetricCodes: string[];
    periodEnd: string;
    periodStart: string;
    status: 'NEEDS_DATA' | 'READY_TO_SCORE';
    supplierId: string;
  }

  export interface Scorecard {
    assessment: 'AT_RISK' | 'HEALTHY' | 'WATCH';
    capacityBps: number;
    capaBps: number;
    evidenceSnapshotSha256: string;
    generatedAt: string;
    otifBps: number;
    overallBps: number;
    periodEnd: string;
    periodStart: string;
    qualityBps: number;
    scorecardId: string;
    scorecardVersion: number;
    supplierId: string;
    supplierName?: string;
  }
}

export function getSupplierPerformanceReadiness(params: {
  periodEnd: string;
  periodStart: string;
  supplierId: string;
}) {
  return requestClient.get<CloudMoldSupplierPerformanceApi.Readiness>(
    '/cloudmold/supplier-sourcing/performance/readiness',
    { params },
  );
}

export function getLatestSupplierPerformanceScorecard(supplierId: string) {
  return requestClient.get<CloudMoldSupplierPerformanceApi.Scorecard>(
    `/cloudmold/supplier-sourcing/performance/latest/${encodeURIComponent(supplierId)}`,
  );
}
