import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestClient } from '#/api/request';

import {
  getCloudMoldAiWorkflowArtifactPage,
  getCloudMoldAiWorkflowObservationPage,
  getCloudMoldAiWorkflowPage,
  getCloudMoldAiWorkflowRunDetail,
  getCloudMoldAiWorkflowRunPage,
  getCloudMoldManagedRunDetail,
  getCloudMoldManagedRunPage,
  getCloudMoldManagedWorkflowList,
  getCloudMoldTemporalAutomationOverview,
} from './index';

vi.mock('#/api/request', () => ({
  requestClient: { get: vi.fn() },
}));

describe('cloudmold ai-operations api', () => {
  beforeEach(() => {
    vi.mocked(requestClient.get).mockReset();
  });

  it('queries managed workflow facts from the SkillTask-facing endpoint', async () => {
    await getCloudMoldManagedWorkflowList();

    expect(requestClient.get).toHaveBeenCalledWith(
      '/cloudmold/ai-operations/managed-workflows',
    );
  });

  it('queries the three-layer Temporal automation overview', async () => {
    await getCloudMoldTemporalAutomationOverview();

    expect(requestClient.get).toHaveBeenCalledWith(
      '/cloudmold/ai-operations/temporal-automation/overview',
    );
  });

  it('queries managed run pages from the managed-runs endpoint', async () => {
    const params = { pageNo: 1, pageSize: 20, status: 'RUNNING' };

    await getCloudMoldManagedRunPage(params);

    expect(requestClient.get).toHaveBeenCalledWith(
      '/cloudmold/ai-operations/managed-runs/page',
      { params },
    );
  });

  it('loads managed run details by encoded task id', async () => {
    await getCloudMoldManagedRunDetail('task/one');

    expect(requestClient.get).toHaveBeenCalledWith(
      '/cloudmold/ai-operations/managed-runs/task%2Fone',
    );
  });

  it('queries AI workflow definitions from the workflows page endpoint', async () => {
    const params = { pageNo: 1, pageSize: 20, workflowCode: 'DEERFLOW' };

    await getCloudMoldAiWorkflowPage(params);

    expect(requestClient.get).toHaveBeenCalledWith(
      '/cloudmold/ai-operations/workflows/page',
      { params },
    );
  });

  it('keeps the existing AI workflow run page contract', async () => {
    const params = { pageNo: 2, pageSize: 50, status: 'SUCCEEDED' };

    await getCloudMoldAiWorkflowRunPage(params);

    expect(requestClient.get).toHaveBeenCalledWith(
      '/cloudmold/ai-operations/runs/page',
      { params },
    );
  });

  it('loads AI workflow run details by encoded run id', async () => {
    await getCloudMoldAiWorkflowRunDetail('run/one');

    expect(requestClient.get).toHaveBeenCalledWith(
      '/cloudmold/ai-operations/runs/run%2Fone',
    );
  });

  it('queries AI artifacts and observations through their read endpoints', async () => {
    const artifactParams = { pageNo: 1, pageSize: 20, runId: 'run-1' };
    const observationParams = {
      outcome: 'SUCCEEDED',
      pageNo: 1,
      pageSize: 20,
    };

    await getCloudMoldAiWorkflowArtifactPage(artifactParams);
    await getCloudMoldAiWorkflowObservationPage(observationParams);

    expect(requestClient.get).toHaveBeenNthCalledWith(
      1,
      '/cloudmold/ai-operations/artifacts/page',
      { params: artifactParams },
    );
    expect(requestClient.get).toHaveBeenNthCalledWith(
      2,
      '/cloudmold/ai-operations/observations/page',
      { params: observationParams },
    );
  });
});
