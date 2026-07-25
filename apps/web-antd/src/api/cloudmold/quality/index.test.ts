import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestClient } from '#/api/request';

import { executeQualityCommand, getQualityWorkItemPage } from './index';

vi.mock('#/api/request', () => ({
  requestClient: { get: vi.fn(), post: vi.fn() },
}));

describe('cloudmold quality api', () => {
  beforeEach(() => {
    vi.mocked(requestClient.get).mockReset();
    vi.mocked(requestClient.post).mockReset();
  });

  it('queries only the CloudMold quality work-item endpoint', async () => {
    const params = { pageNo: 1, pageSize: 100 };

    await getQualityWorkItemPage(params);

    expect(requestClient.get).toHaveBeenCalledWith(
      '/cloudmold/quality/work-item/page',
      { params },
    );
  });

  it('adds an auditable command envelope to quality writes', async () => {
    await executeQualityCommand({
      inspectionTask: {
        expectedVersion: 3,
        taskId: 'task-id',
      },
      operation: 'START_INSPECTION_TASK',
    });

    expect(requestClient.post).toHaveBeenCalledWith(
      '/cloudmold/quality/command',
      expect.objectContaining({
        correlationId: expect.any(String),
        idempotencyKey: expect.any(String),
        inspectionTask: {
          expectedVersion: 3,
          taskId: 'task-id',
        },
        occurredAt: expect.any(String),
        operation: 'START_INSPECTION_TASK',
        runId: expect.any(String),
      }),
    );
  });
});
