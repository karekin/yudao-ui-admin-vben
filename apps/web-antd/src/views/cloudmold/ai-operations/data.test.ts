import { describe, expect, it } from 'vitest';

import {
  aiOperationsConsoleNotice,
  approvalGateSummary,
  normalizeManagedWorkflowList,
  temporalBusinessAutonomySummary,
  temporalDiscoverySourceSummary,
  temporalDispatchOutcomeSummary,
  toCoveragePercent,
  useManagedArtifactColumns,
  useManagedObservationColumns,
  useManagedRunColumns,
  useManagedWorkflowColumns,
  useTemporalAutomationOverviewColumns,
  useTemporalScheduleColumns,
} from './data';

describe('ai operations presentation helpers', () => {
  it('keeps the admin console as trigger source and DeerFlow as management', () => {
    expect(aiOperationsConsoleNotice).toContain('DeerFlow');
    expect(aiOperationsConsoleNotice).toContain('后台管理系统发起');
    expect(aiOperationsConsoleNotice).toContain('CloudMold / SkillTask');
    expect(aiOperationsConsoleNotice).toContain('运行实例和执行证据');
  });

  it('distinguishes BPM pending confirmation from released approval states', () => {
    expect(approvalGateSummary('PENDING')).toBe('等待 BPM 审批或安全确认');
    expect(approvalGateSummary('APPROVED')).toBe('已放行');
    expect(approvalGateSummary('NOT_REQUIRED')).toBe('无需审批');
  });

  it('normalizes managed workflow list envelopes from multiple backend shapes', () => {
    const item = {
      approvalRequired: true,
      description: '依次完成建档、售后与核验。',
      definitionClosureSha256: 'a'.repeat(64),
      definitionSha256: 'b'.repeat(64),
      displayName: '商品售后自治全链路',
      durableAuthority: 'SKILL_TASK' as const,
      managementSurface: 'DEER_FLOW' as const,
      maxAttempts: 3,
      orchestrationSurface: 'ADMIN_CONSOLE' as const,
      riskLevel: 'R3',
      skillId: 'commerce.full-chain-r3',
      skillVersion: '1.0.0',
      stepCount: 12,
      triggerSource: 'ADMIN_CONSOLE' as const,
      writeStepCount: 4,
    };

    expect(normalizeManagedWorkflowList([item])).toEqual([item]);
    expect(normalizeManagedWorkflowList({ items: [item] })).toEqual([item]);
    expect(normalizeManagedWorkflowList({ list: [item] })).toEqual([item]);
    expect(normalizeManagedWorkflowList(undefined)).toEqual([]);
  });

  it('puts concrete business outcomes ahead of technical evidence', () => {
    const runColumns = useManagedRunColumns();
    const artifactColumns = useManagedArtifactColumns();

    expect(runColumns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'businessOutcome',
          title: '业务结果',
        }),
      ]),
    );
    expect(artifactColumns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'businessOutcome',
          title: '业务产物',
        }),
      ]),
    );
    expect(artifactColumns).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: '终态产物哈希' }),
      ]),
    );
  });

  it('keeps schedule, candidate discovery, and autonomy proof semantically separate', () => {
    expect(temporalDiscoverySourceSummary('TENANT_AGGREGATE').label).toBe(
      '租户汇总输入',
    );
    expect(temporalDispatchOutcomeSummary('DISPATCHED')).toEqual({
      color: 'processing',
      label: '候选已分发',
    });
    expect(temporalDispatchOutcomeSummary('NO_ACTION_DUE')).toEqual({
      color: 'default',
      label: '本次无到期对象',
    });
    expect(temporalBusinessAutonomySummary('DISPATCHED').label).toContain(
      '尚无自治实证',
    );
    expect(temporalBusinessAutonomySummary('NO_ACTION_DUE').label).toContain(
      '尚无自治实证',
    );
    expect(temporalBusinessAutonomySummary('AUTONOMY_PROVEN')).toEqual({
      color: 'success',
      label: '自治实证成立',
    });
  });

  it('keeps backend percentage coverage rates bounded for display', () => {
    expect(toCoveragePercent(1)).toBe(1);
    expect(toCoveragePercent(62.5)).toBe(62.5);
    expect(toCoveragePercent(120)).toBe(100);
    expect(toCoveragePercent(undefined)).toBe(0);
  });

  it('keeps operational lists focused on business fields', () => {
    const fieldNames = (columns: ReturnType<typeof useManagedRunColumns>) =>
      columns?.map((column) => column.field);

    expect(fieldNames(useManagedWorkflowColumns())).toEqual([
      'displayName',
      'description',
      'skillVersion',
      'riskLevel',
      'stepCount',
      'approvalRequired',
      'action',
    ]);
    expect(fieldNames(useTemporalScheduleColumns())).toEqual([
      'displayName',
      'skillId',
      'intervalSeconds',
      'inputStrategy',
      'status',
      'lastActionAt',
      'nextActionAt',
      'action',
    ]);
    expect(fieldNames(useTemporalAutomationOverviewColumns())).toEqual([
      'displayName',
      'scheduleState',
      'discoverySource',
      'lastDispatchOutcome',
      'candidateCount',
      'businessAutonomyState',
      'gapCodes',
      'proofRef',
    ]);
    expect(fieldNames(useManagedRunColumns())).toEqual([
      'skillId',
      'businessOutcome',
      'status',
      'currentStepCode',
      'completedAt',
      'action',
    ]);
    expect(fieldNames(useManagedArtifactColumns())).toEqual([
      'skillId',
      'businessOutcome',
      'status',
      'completedAt',
      'action',
    ]);
    expect(fieldNames(useManagedObservationColumns())).toEqual([
      'skillId',
      'currentStepCode',
      'status',
      'attemptCount',
      'updatedAt',
      'action',
    ]);
  });
});
