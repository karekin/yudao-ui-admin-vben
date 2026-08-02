import { describe, expect, it } from 'vitest';

import {
  agentControlRoleLabel,
  aiOperationsConsoleNotice,
  approvalGateSummary,
  buildApprovalRoleOptions,
  buildRoleCapabilityBusinessUnits,
  buildRoleCapabilityMap,
  managedWorkflowOwnerRoleLabel,
  normalizeManagedWorkflowList,
  roleCapabilityProfiles,
  temporalBusinessAutonomySummary,
  temporalDiscoverySourceSummary,
  temporalDispatchOutcomeSummary,
  toCoveragePercent,
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

  it('presents every registered business role with a business-facing name', () => {
    expect(managedWorkflowOwnerRoleLabel('supplier-sourcing-operator')).toBe(
      '供应商寻源运营',
    );
    expect(managedWorkflowOwnerRoleLabel('pricing-revenue-operator')).toBe(
      '定价与收益运营',
    );
    expect(managedWorkflowOwnerRoleLabel('merchant-managed-growth-operator')).toBe(
      '托管商家成长运营',
    );
    expect(managedWorkflowOwnerRoleLabel('future-role')).toBe('future-role');
  });

  it('maps 36 managed operating roles plus five visible horizontal capability gaps', () => {
    const map = buildRoleCapabilityMap(
      [
        {
          approvalRequired: true,
          description: '供应商寻源与定标。',
          definitionClosureSha256: 'a'.repeat(64),
          definitionSha256: 'b'.repeat(64),
          displayName: '供应商寻源日运营',
          durableAuthority: 'SKILL_TASK',
          managementSurface: 'DEER_FLOW',
          maxAttempts: 3,
          orchestrationSurface: 'ADMIN_CONSOLE',
          ownerRole: 'supplier-sourcing-operator',
          riskLevel: 'R2',
          skillId: 'skill.cloudmold.supplier.sourcing-daily-operations.v1',
          skillVersion: '1.0.0',
          stepCount: 12,
          triggerSource: 'ADMIN_CONSOLE',
          workflowLevel: 'BUSINESS_ROLE',
          writeStepCount: 4,
        },
      ],
      [
        {
          businessAutonomyState: 'AUTONOMY_PROVEN',
          candidateCount: 2,
          discoverySource: 'DOMAIN_BACKLOG',
          dispatchedCount: 2,
          displayName: '供应商寻源日运营',
          failedCount: 0,
          gapCodes: [],
          scheduleState: 'HEALTHY',
          skillId: 'skill.cloudmold.supplier.sourcing-daily-operations.v1',
          skillVersion: '1.0.0',
        },
      ],
    );

    expect(roleCapabilityProfiles).toHaveLength(41);
    expect(
      new Set(roleCapabilityProfiles.map((item) => item.ownerRole)).size,
    ).toBe(41);
    expect(
      roleCapabilityProfiles.filter(
        (item) => item.capabilityStage !== 'FOUNDATION_REQUIRED',
      ),
    ).toHaveLength(36);
    expect(map).toHaveLength(41);
    expect(
      map.find((item) => item.ownerRole === 'supplier-sourcing-operator'),
    ).toMatchObject({
      automation: [
        {
          businessAutonomyState: 'AUTONOMY_PROVEN',
          scheduleState: 'HEALTHY',
        },
      ],
      workflowCount: 1,
      workflowIds: ['skill.cloudmold.supplier.sourcing-daily-operations.v1'],
    });
    expect(
      map.find((item) => item.ownerRole === 'warehouse-operations'),
    ).toMatchObject({ workflowCount: 0 });
    expect(
      map.find(
        (item) => item.ownerRole === 'merchant-managed-growth-operator',
      ),
    ).toMatchObject({
      dailyDuty: '跟进入驻诊断、验厂、试用期与月度成材评审',
      verifiableOutcome: '托管入驻、验厂、评分与等级权益读回',
      externalFactGate: '验厂现场、供应链与质量证据，以及买手和人工终审结论',
    });
    expect(
      map.find((item) => item.ownerRole === 'privacy-security-operator'),
    ).toMatchObject({
      capabilityStage: 'FOUNDATION_REQUIRED',
      foundationRequirements: {
        authoritySources: ['IAM', 'SIEM', '数据分类与隐私请求系统'],
      },
      workflowCount: 0,
    });
    expect(
      map
        .filter((item) => item.capabilityStage === 'FOUNDATION_REQUIRED')
        .every((item) => item.foundationRequirements?.authoritySources.length),
    ).toBe(true);
  });

  it('groups role cards by business unit then business domain from DeerFlow', () => {
    const entries = buildRoleCapabilityMap([]);
    const groups = buildRoleCapabilityBusinessUnits(entries, {
      assigned_skill_count: 1,
      enabled_assigned_skill_count: 1,
      enabled_skill_count: 2,
      business_units: [
        {
          code: 'dewu',
          domains: [
            {
              code: 'merchant',
              name: '商家经营域',
              order: 10,
              roles: [
                {
                  code: 'merchant-onboarding-operator',
                  enabled_skill_count: 1,
                  name: '商家入驻运营',
                  order: 10,
                  skill_count: 1,
                  skills: [
                    {
                      category: 'public',
                      content_sha256: 'a'.repeat(64),
                      description: '商家入驻岗位 Skill',
                      enabled: true,
                      name: 'cloudmold-merchant-onboarding-lifecycle',
                    },
                  ],
                },
              ],
              enabled_skill_count: 1,
              skill_count: 1,
            },
          ],
          name: '得物',
          order: 10,
          enabled_skill_count: 1,
          skill_count: 1,
          status: 'ACTIVE',
        },
        {
          code: 'fashion88',
          domains: [],
          enabled_skill_count: 0,
          name: 'Fashion88',
          order: 20,
          skill_count: 0,
          status: 'PLANNED',
        },
        {
          code: 'cloudmold-shared',
          domains: [
            {
              code: 'platform',
              name: '平台与工程域',
              order: 90,
              roles: [
                {
                  code: 'shared-platform-capability',
                  enabled_skill_count: 1,
                  name: '通用平台能力',
                  order: 10,
                  skill_count: 1,
                  skills: [
                    {
                      category: 'public',
                      content_sha256: 'd'.repeat(64),
                      description: '平台运行 Skill',
                      enabled: true,
                      name: 'cloudmold-dubbo-operator',
                    },
                  ],
                },
              ],
              enabled_skill_count: 1,
              skill_count: 1,
            },
          ],
          name: 'CloudMold 共享平台',
          order: 90,
          enabled_skill_count: 1,
          skill_count: 1,
          status: 'ACTIVE',
        },
      ],
      catalog_sha256: 'b'.repeat(64),
      missing_skill_names: [],
      schema_version: 'cloudmold.skill-business-taxonomy/v1',
      skill_count: 1,
      taxonomy_sha256: 'c'.repeat(64),
    });

    expect(groups).toHaveLength(3);
    expect(groups[0]).toMatchObject({
      code: 'dewu',
      domains: [
        {
          code: 'merchant',
          roles: [
            {
              roleCode: 'merchant-onboarding-operator',
              skills: [{ name: 'cloudmold-merchant-onboarding-lifecycle' }],
            },
          ],
        },
      ],
      name: '得物',
    });
    expect(groups[1]).toMatchObject({
      code: 'fashion88',
      domains: [],
      status: 'PLANNED',
    });
    expect(groups[2]).toMatchObject({
      code: 'cloudmold-shared',
      domains: [
        {
          roles: [
            {
              entry: undefined,
              roleCode: 'shared-platform-capability',
              skills: [{ name: 'cloudmold-dubbo-operator' }],
            },
          ],
        },
      ],
    });
  });

  it('offers every managed role and preserves historical approval roles', () => {
    const options = buildApprovalRoleOptions();

    expect(options).toHaveLength(48);
    expect(options).toEqual(
      expect.arrayContaining([
        { label: '风险争议与损失运营', value: 'risk-operations' },
        { label: '仓储运营', value: 'warehouse-operations' },
        { label: '买手', value: 'buyer' },
        { label: '增长营销运营', value: 'growth-marketing' },
        { label: '商家运营', value: 'merchant-operations' },
        { label: '采购运营', value: 'procurement' },
        {
          label: '托管商家成长运营',
          value: 'merchant-managed-growth-operator',
        },
      ]),
    );
    expect(agentControlRoleLabel('supplier-sourcing-operator')).toBe(
      '供应商寻源运营',
    );
    expect(agentControlRoleLabel('inventory-control')).toBe('库控');
    expect(agentControlRoleLabel('growth-marketing')).toBe('增长营销运营');
    expect(agentControlRoleLabel('merchant-operations')).toBe('商家运营');
    expect(agentControlRoleLabel('procurement')).toBe('采购运营');
    expect(options).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: 'privacy-security-operator' }),
      ]),
    );
  });

  it('puts concrete business outcomes ahead of technical evidence', () => {
    const runColumns = useManagedRunColumns();

    expect(runColumns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'businessOutcome',
          title: '业务结果',
        }),
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
      'ownerRole',
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
