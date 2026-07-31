import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CloudMoldAiOperationsApi } from '#/api/cloudmold/ai-operations';

import {
  codeInput,
  enumColumn,
  statusInput,
  timeColumn,
  withCloudMoldTableColumns,
} from '../shared/form-helpers';

export const aiOperationsConsoleNotice =
  '工作流由后台管理系统发起；Temporal 负责定时、编排与恢复，DeerFlow 负责 Agent 管理和有界决策，CloudMold / SkillTask 保存运行实例和执行证据。';

export const managedWorkflowStatusMeta: Record<
  string,
  { color: string; label: string }
> = {
  ACTIVE: { color: 'success', label: '托管中' },
  COMPLETED: { color: 'success', label: '已完成' },
  DISABLED: { color: 'default', label: '已停用' },
  FAILED: { color: 'error', label: '失败' },
  RUNNING: { color: 'processing', label: '运行中' },
  SUSPENDED: { color: 'warning', label: '已挂起' },
};

export const workflowDefinitionStatusMeta: Record<
  string,
  { color: string; label: string }
> = {
  ACTIVE: { color: 'success', label: '生效' },
  PUBLISHED: { color: 'success', label: '已发布' },
  RETIRED: { color: 'default', label: '已退役' },
  SUSPENDED: { color: 'warning', label: '已暂停' },
};

export const workflowRunStatusMeta: Record<
  string,
  { color: string; label: string }
> = {
  CANCELLED: { color: 'default', label: '已取消' },
  FAILED: { color: 'error', label: '失败' },
  NEEDS_REVIEW: { color: 'warning', label: '需人工复核' },
  PAUSED: { color: 'warning', label: '已暂停' },
  QUEUED: { color: 'default', label: '排队中' },
  RUNNING: { color: 'processing', label: '运行中' },
  SUCCEEDED: { color: 'success', label: '成功' },
  WAITING_APPROVAL: { color: 'warning', label: '等待审批' },
  WAITING_CHILD: { color: 'processing', label: '等待子任务' },
};

export const invocationOutcomeMeta: Record<
  string,
  { color: string; label: string }
> = {
  CANCELLED: { color: 'default', label: '已取消' },
  FAILED: { color: 'error', label: '失败' },
  SUCCEEDED: { color: 'success', label: '成功' },
};

export const feedbackOutcomeMeta: Record<
  string,
  { color: string; label: string }
> = {
  NEGATIVE: { color: 'error', label: '负向' },
  NEUTRAL: { color: 'default', label: '中性' },
  POSITIVE: { color: 'success', label: '正向' },
  UNKNOWN: { color: 'warning', label: '未知' },
};

export const approvalStatusMeta: Record<
  string,
  { color: string; label: string }
> = {
  APPROVED: { color: 'success', label: '已批准' },
  NOT_REQUIRED: { color: 'default', label: '无需审批' },
  PENDING: { color: 'processing', label: '待审批' },
  REJECTED: { color: 'error', label: '已驳回' },
};

const temporalScheduleStateMeta: Record<
  string,
  { color: string; label: string }
> = {
  ACTIVE: { color: 'processing', label: '已调度' },
  DEGRADED: { color: 'warning', label: '调度降级' },
  DRIFTED: { color: 'error', label: '配置漂移' },
  HEALTHY: { color: 'success', label: '调度健康' },
  MISSING: { color: 'error', label: '未调度' },
  PAUSED: { color: 'warning', label: '已暂停' },
  SCHEDULED: { color: 'processing', label: '已调度' },
};

const temporalDiscoverySourceMeta: Record<
  string,
  { color: string; label: string }
> = {
  DOMAIN_BACKLOG: { color: 'processing', label: '领域业务待办' },
  EVENT_BACKLOG: { color: 'processing', label: '事件积压队列' },
  GOVERNED_MANUAL: { color: 'warning', label: '治理型人工候选' },
  OUTBOX_EVENT: { color: 'processing', label: 'Outbox 事件' },
  ROTATING_BUSINESS_SCENARIO: { color: 'success', label: '轮换业务场景' },
  TENANT_AGGREGATE: { color: 'success', label: '租户汇总输入' },
  UNWIRED: { color: 'error', label: '候选源未接' },
};

const temporalDispatchOutcomeMeta: Record<
  string,
  { color: string; label: string }
> = {
  DISPATCHED: { color: 'processing', label: '候选已分发' },
  FAILED: { color: 'error', label: '发现失败' },
  NO_ACTION_DUE: { color: 'default', label: '本次无到期对象' },
  PARTIAL_DISPATCH: { color: 'warning', label: '部分候选已分发' },
};

const temporalBusinessAutonomyMeta: Record<
  string,
  { color: string; label: string }
> = {
  AUTONOMY_IN_PROGRESS: { color: 'processing', label: '业务处理中' },
  AUTONOMY_PROVEN: { color: 'success', label: '自治实证成立' },
  BLOCKED: { color: 'error', label: '自治受阻' },
  DISPATCHED: { color: 'processing', label: '已分发，尚无自治实证' },
  NEEDS_REVIEW: { color: 'warning', label: '待人工复核' },
  NOT_PROVEN: { color: 'warning', label: '尚无自治实证' },
  NO_ACTION_DUE: { color: 'default', label: '当前无任务，尚无自治实证' },
  PROVEN: { color: 'success', label: '自治实证成立' },
  READY_IDLE: { color: 'default', label: '发现正常，当前无任务' },
  SCHEDULED_ONLY: { color: 'warning', label: '仅已调度' },
};

const temporalGapLabels: Record<string, string> = {
  CANDIDATE_SOURCE_MISSING: '候选源未接',
  AUTONOMY_PROOF_MISSING: '尚无业务自治实证',
  GOVERNED_WRITE_INPUT_REQUIRED: '需受治理的写入候选',
  GOVERNED_MANUAL_ENTRY: '需治理型人工候选',
  MISSING_EXPERIMENT_SOR: '缺少实验事实源',
  MISSING_FINANCE_SOR: '缺少财务事实源',
  NO_RECENT_DISCOVERY: '近期无发现记录',
  NO_SUCCESSFUL_BUSINESS_OUTCOME: '尚无业务成功实证',
  SCHEDULE_DRIFT: '调度配置漂移',
  SCHEDULE_DRIFTED: '调度配置漂移',
  SCHEDULE_MISSING: '未建立每日调度',
  SCHEDULE_PAUSED: '每日调度已暂停',
};

function automationMeta(
  metadata: Record<string, { color: string; label: string }>,
  value?: null | string,
) {
  const normalized = value?.trim().toUpperCase();
  if (!normalized) {
    return { color: 'default', label: '暂无记录' };
  }
  return metadata[normalized] ?? { color: 'default', label: normalized };
}

export function temporalScheduleStateSummary(value?: null | string) {
  return automationMeta(temporalScheduleStateMeta, value);
}

export function temporalDiscoverySourceSummary(value?: null | string) {
  return automationMeta(temporalDiscoverySourceMeta, value);
}

export function temporalDispatchOutcomeSummary(value?: null | string) {
  return automationMeta(temporalDispatchOutcomeMeta, value);
}

export function temporalBusinessAutonomySummary(value?: null | string) {
  return automationMeta(temporalBusinessAutonomyMeta, value);
}

export function temporalGapSummary(value: string) {
  return temporalGapLabels[value.trim().toUpperCase()] ?? value;
}

export function toCoveragePercent(value?: null | number) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return 0;
  }
  return Math.round(Math.min(100, Math.max(0, value)) * 10) / 10;
}

export function approvalGateSummary(status?: null | string) {
  switch (status) {
    case 'APPROVED': {
      return '已放行';
    }
    case 'NOT_REQUIRED': {
      return '无需审批';
    }
    case 'PENDING': {
      return '等待 BPM 审批或安全确认';
    }
    case 'REJECTED': {
      return '已驳回';
    }
    default: {
      return '未返回审批状态';
    }
  }
}

export function normalizeManagedWorkflowList(
  payload:
    | CloudMoldAiOperationsApi.ManagedWorkflow[]
    | CloudMoldAiOperationsApi.ManagedWorkflowListEnvelope
    | null
    | undefined,
) {
  if (!payload) {
    return [];
  }
  if (Array.isArray(payload)) {
    return payload;
  }
  return payload.items ?? payload.list ?? payload.records ?? payload.data ?? [];
}

const managedWorkflowOwnerRoleLabels: Record<string, string> = {
  'advertising-settlement-operator': '广告结算运营',
  'aftersales-operator': '售后运营',
  'assortment-manager': '选品与波段企划经理',
  'bonded-customs-operations': '保税关务运营',
  'campaign-operations': '促销活动运营',
  'category-operations': '品类运营',
  'consumer-compensation-operator': '消费者赔付运营',
  'consumer-experience-operator': '消费者体验运营',
  'crossborder-operations': '跨境运营',
  'customer-service-agent': '客服专员',
  'data-ai-operations': '数据质量与 AI 运营',
  'finance-operations': '财务结算运营',
  'growth-experiment-operator': '增长实验运营',
  'logistics-operations': '物流运营',
  'logistics-settlement-operator': '物流结算运营',
  'merchant-experience-operator': '商家体验运营',
  'merchant-onboarding-operator': '商家入驻运营',
  'merchant-settlement-operator': '商家结算运营',
  'operations-control': '经营总控',
  'order-exception-operator': '订单异常运营',
  'partner-marketing-operations': '海外合作投放运营',
  'pricing-revenue-operator': '定价与收益运营',
  'procurement-order-operator': '采购订单运营',
  'product-listing-operator': '商品铺品运营',
  'product-operations': '商品运营',
  'production-supervisor': '生产主管',
  'profit-loss-operator': '损益改善运营',
  'quality-operations': '质量运营',
  'replenishment-operator': '补货运营',
  'risk-operations': '风险争议与损失运营',
  'supplier-sourcing-operator': '供应商寻源运营',
  'supply-chain-operator': '供应链运营',
  'supply-planning-manager': '需求计划经理',
  'synthetic-consumer': '受控消费者场景',
  'warehouse-operations': '仓储运营',
  'enterprise-platform-operator': '企业平台工程运营',
  'hr-organization-operator': '人力与组织运营',
  'legal-ip-operator': '法务与知识产权运营',
  'privacy-security-operator': '隐私与信息安全运营',
  'strategy-pmo-control-operator': '战略、PMO 与内控运营',
};

export interface RoleCapabilityProfile {
  capabilityStage?: 'FOUNDATION_REQUIRED' | 'MANAGED';
  domain: string;
  dailyDuty: string;
  externalFactGate: string;
  foundationRequirements?: {
    approvalBoundary: string;
    authoritySources: string[];
    controlledArtifact: string;
  };
  ownerRole: string;
  verifiableOutcome: string;
}

export interface RoleCapabilityEntry extends RoleCapabilityProfile {
  automation: CloudMoldAiOperationsApi.TemporalAutomationWorkflow[];
  workflowCount: number;
  workflowIds: string[];
}

export const roleCapabilityProfiles: RoleCapabilityProfile[] = [
  {
    domain: '财务经营',
    ownerRole: 'advertising-settlement-operator',
    dailyDuty: '复核广告账单与结算差异',
    verifiableOutcome: '内部结算案件、凭证',
    externalFactGate: '媒体账单、发票和付款',
  },
  {
    domain: '交易与消费者',
    ownerRole: 'aftersales-operator',
    dailyDuty: '处理退货、退款和逆向入库',
    verifiableOutcome: '售后单、退款、库存终态',
    externalFactGate: 'PSP 与真实消费者身份',
  },
  {
    domain: '商品与企划',
    ownerRole: 'assortment-manager',
    dailyDuty: '编排波段、候选款和采购建议',
    verifiableOutcome: '企划、候选款、采购读回',
    externalFactGate: '趋势、成本、需求和预算',
  },
  {
    domain: '履约、质量与合规',
    ownerRole: 'bonded-customs-operations',
    dailyDuty: '编排保税单证、异常和会签',
    verifiableOutcome: '关务案件、单证状态',
    externalFactGate: '海关申报、放行和法定责任',
  },
  {
    domain: '增长与营销',
    ownerRole: 'campaign-operations',
    dailyDuty: '创建活动并回收受控触达结果',
    verifiableOutcome: '活动、触达、订单读回',
    externalFactGate: '外部投放平台真实转化',
  },
  {
    domain: '商品与企划',
    ownerRole: 'category-operations',
    dailyDuty: '汇总商品、活动、实验和消费者反馈',
    verifiableOutcome: '品类行动单、领域终态',
    externalFactGate: '各领域最终经营事实',
  },
  {
    domain: '交易与消费者',
    ownerRole: 'consumer-compensation-operator',
    dailyDuty: '处理无法履约的退款与赔付',
    verifiableOutcome: '订单、退款、赔付终态',
    externalFactGate: '赔付资金与客户身份',
  },
  {
    domain: '交易与消费者',
    ownerRole: 'consumer-experience-operator',
    dailyDuty: '处理投诉判责与体验整改',
    verifiableOutcome: '工单、判责、整改读回',
    externalFactGate: '人工事实认定与真实客诉渠道',
  },
  {
    domain: '履约、质量与合规',
    ownerRole: 'crossborder-operations',
    dailyDuty: '编排跨境订单、单证与异常',
    verifiableOutcome: '订单、物流与单证状态',
    externalFactGate: '承运商轨迹、税务和通关回执',
  },
  {
    domain: '交易与消费者',
    ownerRole: 'customer-service-agent',
    dailyDuty: '受控咨询、工单分流和升级',
    verifiableOutcome: '客服工单及闭环状态',
    externalFactGate: '客户隐私和真实身份',
  },
  {
    domain: '风险与数据 AI',
    ownerRole: 'data-ai-operations',
    dailyDuty: '执行 DQC、血缘核验和恢复行动',
    verifiableOutcome: 'DQC 规则、运行、行动单',
    externalFactGate: '生产湖仓作业与真实经营指标',
  },
  {
    domain: '财务经营',
    ownerRole: 'finance-operations',
    dailyDuty: '关账编排与结算差异处置',
    verifiableOutcome: '内部凭证、结算案件、行动单',
    externalFactGate: '银行、PSP、税务与法定账簿',
  },
  {
    domain: '增长与营销',
    ownerRole: 'growth-experiment-operator',
    dailyDuty: '配置实验、受控分流和效果回读',
    verifiableOutcome: '实验、分组和归因读回',
    externalFactGate: '媒体增量归因与真实实验结论',
  },
  {
    domain: '履约、质量与合规',
    ownerRole: 'logistics-operations',
    dailyDuty: '发现履约异常并推动处置',
    verifiableOutcome: '异常案件、履约状态',
    externalFactGate: '承运商实时轨迹和签收事实',
  },
  {
    domain: '财务经营',
    ownerRole: 'logistics-settlement-operator',
    dailyDuty: '复核物流服务费用差异',
    verifiableOutcome: '物流结算案件、凭证',
    externalFactGate: '承运商账单、发票和付款',
  },
  {
    domain: '商家与供给',
    ownerRole: 'merchant-experience-operator',
    dailyDuty: '跟踪商责、赔付与整改复核',
    verifiableOutcome: '商责案件、整改读回',
    externalFactGate: '外部商家履约事实',
  },
  {
    domain: '商家与供给',
    ownerRole: 'merchant-onboarding-operator',
    dailyDuty: '审核准入资料并激活商家店铺',
    verifiableOutcome: '商家、店铺状态',
    externalFactGate: 'KYC、合同和法定准入',
  },
  {
    domain: '财务经营',
    ownerRole: 'merchant-settlement-operator',
    dailyDuty: '汇总售卖、退款和服务费结算',
    verifiableOutcome: '商家结算案件、凭证',
    externalFactGate: '银行支付和三方对账',
  },
  {
    domain: '经营总控',
    ownerRole: 'operations-control',
    dailyDuty: '汇总跨域日经营动作和终态检查',
    verifiableOutcome: '跨域行动单、领域读回',
    externalFactGate: '领域负责人和审批人结论',
  },
  {
    domain: '交易与消费者',
    ownerRole: 'order-exception-operator',
    dailyDuty: '处理已付未发、取消与退款异常',
    verifiableOutcome: '订单、库存、退款终态',
    externalFactGate: '真实支付事实',
  },
  {
    domain: '增长与营销',
    ownerRole: 'partner-marketing-operations',
    dailyDuty: '维护 KOL/媒体合作与受控归因',
    verifiableOutcome: '合作案件、内容、结算读回',
    externalFactGate: '平台投放、媒体结算和真实归因',
  },
  {
    domain: '定价与收益',
    ownerRole: 'pricing-revenue-operator',
    dailyDuty: '对已发布商品执行受控调价',
    verifiableOutcome: '不可变 offer revision、渠道回执',
    externalFactGate: '成本、税费、毛利和收益归因',
  },
  {
    domain: '采购与制造',
    ownerRole: 'procurement-order-operator',
    dailyDuty: '下发采购订单并回收供应商确认',
    verifiableOutcome: '采购订单、确认状态',
    externalFactGate: '实物收货和供应商绩效',
  },
  {
    domain: '商品与企划',
    ownerRole: 'product-listing-operator',
    dailyDuty: '将已就绪商品发布到受控渠道',
    verifiableOutcome: '刊登、渠道发布回执',
    externalFactGate: '真实渠道刊登和素材生产',
  },
  {
    domain: '商品与企划',
    ownerRole: 'product-operations',
    dailyDuty: '维护商品开发、质量和上架条件',
    verifiableOutcome: '商品、质量、刊登前状态',
    externalFactGate: '竞品、趋势和真实素材',
  },
  {
    domain: '采购与制造',
    ownerRole: 'production-supervisor',
    dailyDuty: '试产/量产排程、报工和入库编排',
    verifiableOutcome: '工单、报工、入库读回',
    externalFactGate: 'BOM、OEE、委外和成本结转',
  },
  {
    domain: '财务经营',
    ownerRole: 'profit-loss-operator',
    dailyDuty: '识别偏差并形成改善行动',
    verifiableOutcome: '改善行动单、责任、终态',
    externalFactGate: '真实总账和经营指标',
  },
  {
    domain: '履约、质量与合规',
    ownerRole: 'quality-operations',
    dailyDuty: '检验、CAPA、召回和库存隔离',
    verifiableOutcome: '质检、CAPA、召回、隔离读回',
    externalFactGate: '外部实验室与全量批次追溯',
  },
  {
    domain: '供应链与仓网',
    ownerRole: 'replenishment-operator',
    dailyDuty: '生成补货建议并回读库存',
    verifiableOutcome: '计划、采购/调拨草稿、库存轨迹',
    externalFactGate: '供应商 OTIF 的规范收货事实',
  },
  {
    domain: '风险与数据 AI',
    ownerRole: 'risk-operations',
    dailyDuty: '处理拒付、争议、止损和损失台账',
    verifiableOutcome: '风险案件、争议、损失台账',
    externalFactGate: '生产风控模型、支付机构和法律结论',
  },
  {
    domain: '商家与供给',
    ownerRole: 'supplier-sourcing-operator',
    dailyDuty: '寻源、询报价、样品评估和定标',
    verifiableOutcome: '寻源案件、报价、样品、授标',
    externalFactGate: '持续履约与质量绩效',
  },
  {
    domain: '供应链与仓网',
    ownerRole: 'supply-chain-operator',
    dailyDuty: '统筹供给异常和入仓决策',
    verifiableOutcome: '供给行动、入仓决策读回',
    externalFactGate: '完整多仓网络和承运商事实',
  },
  {
    domain: '供应链与仓网',
    ownerRole: 'supply-planning-manager',
    dailyDuty: '生成预测、S&OP 与供需计划',
    verifiableOutcome: '预测、计划与建议单',
    externalFactGate: '真实全量数据仓供需平衡',
  },
  {
    domain: '交易与消费者',
    ownerRole: 'synthetic-consumer',
    dailyDuty: '产生明确标识的受控选购/下单场景',
    verifiableOutcome: '受控订单、库存、履约读回',
    externalFactGate: '真实消费者和真实市场需求',
  },
  {
    domain: '供应链与仓网',
    ownerRole: 'warehouse-operations',
    dailyDuty: '收货、上架、移库和盘点作业',
    verifiableOutcome: '入库、库存、作业轨迹',
    externalFactGate: '物理作业和设备/WMS 回执',
  },
  {
    capabilityStage: 'FOUNDATION_REQUIRED',
    domain: '企业平台与工程',
    ownerRole: 'enterprise-platform-operator',
    dailyDuty: '分诊 SLO、变更风险、容量成本与灾备演练候选',
    verifiableOutcome: '受控变更评审单、SLO 异常工单、演练证据',
    externalFactGate: '生产发布、回滚、灾备切换与运行负责人确认',
    foundationRequirements: {
      authoritySources: ['CMDB', '可观测性平台', 'CI/CD 与变更系统'],
      controlledArtifact: '变更风险评审单与 SLO 异常工单',
      approvalBoundary: '生产变更、回滚和灾备切换由变更负责人批准',
    },
  },
  {
    capabilityStage: 'FOUNDATION_REQUIRED',
    domain: '人力与组织',
    ownerRole: 'hr-organization-operator',
    dailyDuty: '汇总编制、排班、培训到期与用工风险候选',
    verifiableOutcome: '用工需求、排班异常、培训提醒工单',
    externalFactGate: '录用、绩效、薪酬和劳动处分的法定审批',
    foundationRequirements: {
      authoritySources: ['HRIS', '排班系统', 'LMS'],
      controlledArtifact: '用工需求与培训到期提醒工单',
      approvalBoundary: '录用、绩效、薪酬和劳动处分由 HR 与法定流程决定',
    },
  },
  {
    capabilityStage: 'FOUNDATION_REQUIRED',
    domain: '法务与知识产权',
    ownerRole: 'legal-ip-operator',
    dailyDuty: '归集合同义务、条款偏差、侵权证据与续约提醒',
    verifiableOutcome: '合同义务台账、条款偏差与证据包草稿',
    externalFactGate: '对外签约、法律意见、诉讼和和解决定',
    foundationRequirements: {
      authoritySources: ['合同生命周期系统', '商标/IP 档案', '争议证据库'],
      controlledArtifact: '合同义务台账与证据包草稿',
      approvalBoundary: '对外签约、法律意见、诉讼和和解决定由法务责任人作出',
    },
  },
  {
    capabilityStage: 'FOUNDATION_REQUIRED',
    domain: '隐私与信息安全',
    ownerRole: 'privacy-security-operator',
    dailyDuty: '发现权限复核、敏感数据访问和供应商安全候选',
    verifiableOutcome: '权限复核单、访问异常和安全演练工单',
    externalFactGate: '生产授权、密钥操作、数据披露和事件定级',
    foundationRequirements: {
      authoritySources: ['IAM', 'SIEM', '数据分类与隐私请求系统'],
      controlledArtifact: '权限复核单与安全事件演练工单',
      approvalBoundary:
        '生产授权、密钥操作、数据披露和事件定级由安全责任人批准',
    },
  },
  {
    capabilityStage: 'FOUNDATION_REQUIRED',
    domain: '战略、PMO 与内控',
    ownerRole: 'strategy-pmo-control-operator',
    dailyDuty: '拆解 KPI 偏差、项目依赖、审计整改和预算情景',
    verifiableOutcome: '整改行动单、项目风险与预算情景草案',
    externalFactGate: '目标取舍、预算批准和独立审计结论',
    foundationRequirements: {
      authoritySources: ['PPM', '预算系统', '内审整改台账'],
      controlledArtifact: '项目风险、整改行动与预算情景草案',
      approvalBoundary: '目标取舍、预算批准和独立审计结论由管理层或内审作出',
    },
  },
];

export function managedWorkflowOwnerRoleLabel(value?: string) {
  if (!value) return '未标注岗位';
  return managedWorkflowOwnerRoleLabels[value] ?? value;
}

export function buildRoleCapabilityMap(
  workflows: CloudMoldAiOperationsApi.ManagedWorkflow[],
  automationWorkflows: CloudMoldAiOperationsApi.TemporalAutomationWorkflow[] = [],
): RoleCapabilityEntry[] {
  const workflowIdsByRole = new Map<string, string[]>();
  const automationBySkillId = new Map(
    automationWorkflows.map((workflow) => [workflow.skillId, workflow]),
  );
  workflows.forEach((workflow) => {
    if (!workflow.ownerRole) return;
    const workflowIds = workflowIdsByRole.get(workflow.ownerRole) ?? [];
    workflowIds.push(workflow.skillId);
    workflowIdsByRole.set(workflow.ownerRole, workflowIds);
  });
  return roleCapabilityProfiles.map((profile) => {
    const workflowIds = workflowIdsByRole.get(profile.ownerRole) ?? [];
    return {
      ...profile,
      automation: workflowIds.flatMap((skillId) => {
        const automation = automationBySkillId.get(skillId);
        return automation ? [automation] : [];
      }),
      workflowCount: workflowIds.length,
      workflowIds,
    };
  });
}

const legacyAgentControlRoleLabels: Record<string, string> = {
  buyer: '买手',
  'customer-service': '客服',
  'inventory-control': '库控',
  'merchant-acquisition': '招商',
  merchandising: '商品运营',
  planning: '企划',
};

export function agentControlRoleLabel(value?: string) {
  if (!value) return '-';
  const managedRoleLabel = managedWorkflowOwnerRoleLabels[value];
  return managedRoleLabel ?? legacyAgentControlRoleLabels[value] ?? value;
}

export function buildApprovalRoleOptions() {
  return [
    { label: '全部岗位', value: undefined },
    ...roleCapabilityProfiles
      .filter((profile) => profile.capabilityStage !== 'FOUNDATION_REQUIRED')
      .map((profile) => ({
        label: managedWorkflowOwnerRoleLabel(profile.ownerRole),
        value: profile.ownerRole,
      })),
    ...Object.entries(legacyAgentControlRoleLabels).map(([value, label]) => ({
      label,
      value,
    })),
  ];
}

export function useManagedWorkflowColumns(): VxeTableGridOptions['columns'] {
  return withCloudMoldTableColumns([
    {
      field: 'displayName',
      fixed: 'left',
      minWidth: 170,
      title: '中文名称',
    },
    { field: 'description', minWidth: 300, title: '用途说明' },
    {
      field: 'ownerRole',
      minWidth: 150,
      slots: { default: 'managed-workflow-owner-role' },
      title: '负责岗位',
    },
    { field: 'skillVersion', minWidth: 80, title: '版本' },
    { field: 'riskLevel', minWidth: 90, title: '风险等级' },
    {
      field: 'stepCount',
      minWidth: 110,
      slots: { default: 'managed-workflow-steps' },
      title: '执行步骤',
    },
    {
      field: 'approvalRequired',
      minWidth: 105,
      slots: { default: 'managed-workflow-approval' },
      title: '审批卡口',
    },
    {
      field: 'action',
      fixed: 'right',
      minWidth: 72,
      slots: { default: 'managed-workflow-action' },
      title: '操作',
    },
  ]);
}

export function useManagedWorkflowFormSchema(): VbenFormSchema[] {
  return [
    codeInput('skillId', 'Skill ID'),
    codeInput('ownerRole', '岗位代码'),
    codeInput('riskLevel', '风险等级'),
  ];
}

export function useTemporalScheduleColumns(): VxeTableGridOptions['columns'] {
  return withCloudMoldTableColumns([
    {
      field: 'displayName',
      fixed: 'left',
      minWidth: 280,
      slots: { default: 'temporal-name' },
      title: '定时任务',
    },
    {
      field: 'skillId',
      minWidth: 220,
      slots: { default: 'temporal-workflow' },
      title: '托管工作流',
    },
    {
      field: 'intervalSeconds',
      minWidth: 150,
      slots: { default: 'temporal-interval' },
      title: '执行周期',
    },
    {
      field: 'inputStrategy',
      minWidth: 130,
      slots: { default: 'temporal-strategy' },
      title: '输入发现',
    },
    {
      field: 'status',
      minWidth: 100,
      slots: { default: 'temporal-status' },
      title: '状态',
    },
    timeColumn('lastActionAt', '上次触发'),
    timeColumn('nextActionAt', '下次触发'),
    {
      field: 'action',
      fixed: 'right',
      minWidth: 160,
      slots: { default: 'temporal-action' },
      title: '操作',
    },
  ]);
}

export function useTemporalScheduleFormSchema(): VbenFormSchema[] {
  return [
    codeInput('scheduleId', 'Schedule ID'),
    codeInput('skillId', 'Skill ID'),
    statusInput(),
  ];
}

export function useTemporalAutomationOverviewColumns(): VxeTableGridOptions['columns'] {
  return withCloudMoldTableColumns([
    {
      field: 'displayName',
      fixed: 'left',
      minWidth: 240,
      slots: { default: 'automation-workflow' },
      title: '托管工作流',
    },
    {
      field: 'scheduleState',
      minWidth: 120,
      slots: { default: 'automation-schedule' },
      title: '调度状态',
    },
    {
      field: 'discoverySource',
      minWidth: 140,
      slots: { default: 'automation-source' },
      title: '候选来源',
    },
    {
      field: 'lastDispatchOutcome',
      minWidth: 150,
      slots: { default: 'automation-dispatch' },
      title: '最近发现',
    },
    {
      field: 'candidateCount',
      minWidth: 170,
      slots: { default: 'automation-candidates' },
      title: '候选分发',
    },
    {
      field: 'businessAutonomyState',
      minWidth: 180,
      slots: { default: 'automation-autonomy' },
      title: '业务自治',
    },
    {
      field: 'gapCodes',
      minWidth: 220,
      slots: { default: 'automation-gaps' },
      title: '覆盖缺口',
    },
    {
      field: 'proofRef',
      minWidth: 220,
      slots: { default: 'automation-proof' },
      title: '自治实证引用',
    },
  ]);
}

export function useTemporalAutomationOverviewFormSchema(): VbenFormSchema[] {
  return [
    codeInput('skillId', 'Skill ID'),
    codeInput('scheduleState', '调度状态'),
    codeInput('businessAutonomyState', '自治状态'),
  ];
}

export function useWorkflowDefinitionFormSchema(): VbenFormSchema[] {
  return [
    codeInput('workflowId', '工作流 ID'),
    codeInput('workflowCode', '工作流编码'),
    codeInput('applicationId', '应用 ID'),
    codeInput('applicationCode', '应用编码'),
    codeInput('applicationStatus', '应用状态'),
  ];
}

export function useWorkflowDefinitionColumns(): VxeTableGridOptions['columns'] {
  return withCloudMoldTableColumns([
    {
      field: 'workflowId',
      fixed: 'left',
      minWidth: 220,
      slots: { default: 'workflow-id' },
      title: 'AI 工作流 ID',
    },
    { field: 'workflowCode', minWidth: 160, title: '编码' },
    { field: 'applicationCode', minWidth: 160, title: '应用编码' },
    { field: 'applicationName', minWidth: 180, title: '应用名称' },
    { field: 'workflowVersion', minWidth: 100, title: '版本' },
    { field: 'runCount', minWidth: 90, title: '运行数' },
    { field: 'runningRunCount', minWidth: 90, title: '运行中' },
    { field: 'succeededRunCount', minWidth: 90, title: '成功' },
    { field: 'failedRunCount', minWidth: 90, title: '失败' },
    {
      field: 'applicationStatus',
      minWidth: 110,
      slots: { default: 'workflow-status' },
      title: '应用状态',
    },
    {
      field: 'definitionRef',
      minWidth: 220,
      slots: { default: 'workflow-ref' },
      title: '定义引用',
    },
    timeColumn('publishedAt', '发布时间'),
  ]);
}

export function useWorkflowRunFormSchema(): VbenFormSchema[] {
  return [
    codeInput('runId', '运行 ID'),
    codeInput('runKey', '业务键'),
    codeInput('applicationId', '应用 ID'),
    codeInput('workflowId', '工作流 ID'),
    codeInput('triggerType', '触发类型'),
    statusInput(),
  ];
}

export function useWorkflowRunColumns(): VxeTableGridOptions['columns'] {
  return withCloudMoldTableColumns([
    {
      field: 'runId',
      fixed: 'left',
      minWidth: 220,
      slots: { default: 'run-id' },
      title: '运行 ID',
    },
    { field: 'runKey', minWidth: 180, title: '业务键' },
    { field: 'applicationId', minWidth: 180, title: '应用 ID' },
    { field: 'workflowId', minWidth: 180, title: '工作流 ID' },
    { field: 'workflowVersion', minWidth: 120, title: '工作流版本' },
    enumColumn('triggerType', '触发类型', 120),
    {
      field: 'status',
      minWidth: 100,
      slots: { default: 'run-status' },
      title: '状态',
    },
    { field: 'errorCode', minWidth: 160, title: '错误码' },
    timeColumn('startedAt', '开始时间'),
    timeColumn('finishedAt', '结束时间'),
    {
      field: 'action',
      fixed: 'right',
      minWidth: 88,
      slots: { default: 'run-action' },
      title: '操作',
    },
  ]);
}

export function useManagedRunColumns(): VxeTableGridOptions['columns'] {
  return withCloudMoldTableColumns([
    {
      field: 'skillId',
      fixed: 'left',
      minWidth: 180,
      slots: { default: 'managed-run-workflow' },
      title: '工作流',
    },
    {
      field: 'businessOutcome',
      minWidth: 300,
      slots: { default: 'managed-run-outcome' },
      title: '业务结果',
    },
    {
      field: 'status',
      minWidth: 90,
      slots: { default: 'managed-run-status' },
      title: '状态',
    },
    {
      field: 'currentStepCode',
      minWidth: 130,
      slots: { default: 'managed-run-current-step' },
      title: '当前进度',
    },
    timeColumn('completedAt', '完成时间'),
    {
      field: 'action',
      fixed: 'right',
      minWidth: 72,
      slots: { default: 'managed-run-action' },
      title: '操作',
    },
  ]);
}

export function useManagedRunFormSchema(): VbenFormSchema[] {
  return [
    codeInput('taskId', '任务 ID'),
    codeInput('runId', '运行 ID'),
    codeInput('skillId', 'Skill ID'),
    codeInput('riskLevel', '风险等级'),
    statusInput(),
  ];
}

export function useManagedArtifactColumns(): VxeTableGridOptions['columns'] {
  return withCloudMoldTableColumns([
    {
      field: 'skillId',
      fixed: 'left',
      minWidth: 180,
      slots: { default: 'managed-artifact-workflow' },
      title: '工作流',
    },
    {
      field: 'businessOutcome',
      minWidth: 440,
      slots: { default: 'managed-artifact-outcome' },
      title: '业务产物',
    },
    {
      field: 'status',
      minWidth: 90,
      slots: { default: 'managed-artifact-status' },
      title: '状态',
    },
    timeColumn('completedAt', '完成时间'),
    {
      field: 'action',
      fixed: 'right',
      minWidth: 72,
      slots: { default: 'managed-artifact-action' },
      title: '操作',
    },
  ]);
}

export function useManagedObservationColumns(): VxeTableGridOptions['columns'] {
  return withCloudMoldTableColumns([
    {
      field: 'skillId',
      fixed: 'left',
      minWidth: 180,
      slots: { default: 'managed-observation-workflow' },
      title: '工作流',
    },
    {
      field: 'currentStepCode',
      minWidth: 200,
      slots: { default: 'managed-observation-current-step' },
      title: '当前进度',
    },
    {
      field: 'status',
      minWidth: 90,
      slots: { default: 'managed-observation-status' },
      title: '运行状态',
    },
    { field: 'attemptCount', minWidth: 80, title: '尝试次数' },
    timeColumn('updatedAt', '最近观测'),
    {
      field: 'action',
      fixed: 'right',
      minWidth: 72,
      slots: { default: 'managed-observation-action' },
      title: '操作',
    },
  ]);
}

export function useArtifactFormSchema(): VbenFormSchema[] {
  return [
    codeInput('runId', '运行 ID'),
    codeInput('feedbackType', '产物类型'),
    codeInput('workflowId', '工作流 ID'),
    codeInput('outcomeCode', '结果编码'),
  ];
}

export function useArtifactColumns(): VxeTableGridOptions['columns'] {
  return withCloudMoldTableColumns([
    {
      field: 'feedbackId',
      fixed: 'left',
      minWidth: 220,
      slots: { default: 'artifact-id' },
      title: '反馈产物 ID',
    },
    {
      field: 'runId',
      minWidth: 220,
      slots: { default: 'artifact-run-id' },
      title: '运行 ID',
    },
    enumColumn('feedbackType', '产物类型', 140),
    { field: 'workflowCode', minWidth: 160, title: '工作流' },
    {
      field: 'evidenceRef',
      minWidth: 220,
      slots: { default: 'artifact-ref' },
      title: '证据引用',
    },
    {
      field: 'outcomeCode',
      minWidth: 110,
      slots: { default: 'artifact-status' },
      title: '结果',
    },
    enumColumn('evaluatorType', '评估方', 120),
    timeColumn('occurredAt', '发生时间'),
    {
      field: 'action',
      fixed: 'right',
      minWidth: 88,
      slots: { default: 'artifact-action' },
      title: '操作',
    },
  ]);
}

export function useObservationFormSchema(): VbenFormSchema[] {
  return [
    codeInput('runId', '运行 ID'),
    codeInput('stepRef', '步骤'),
    codeInput('providerCode', '供应方'),
    codeInput('modelCode', '模型'),
    codeInput('outcome', '调用结果'),
  ];
}

export function useObservationColumns(): VxeTableGridOptions['columns'] {
  return withCloudMoldTableColumns([
    {
      field: 'attemptId',
      fixed: 'left',
      minWidth: 220,
      slots: { default: 'observation-id' },
      title: '调用 ID',
    },
    {
      field: 'runId',
      minWidth: 220,
      slots: { default: 'observation-run-id' },
      title: '运行 ID',
    },
    { field: 'stepRef', minWidth: 180, title: '步骤' },
    { field: 'providerCode', minWidth: 120, title: '供应方' },
    { field: 'modelCode', minWidth: 160, title: '模型' },
    {
      field: 'outcome',
      minWidth: 110,
      slots: { default: 'observation-outcome' },
      title: '结果',
    },
    { field: 'totalTokens', minWidth: 110, title: '总 Tokens' },
    { field: 'latencyMillis', minWidth: 110, title: '耗时 ms' },
    { field: 'costAmountMinor', minWidth: 110, title: '成本(分)' },
    { field: 'errorCode', minWidth: 150, title: '错误码' },
    timeColumn('occurredAt', '发生时间'),
    {
      field: 'action',
      fixed: 'right',
      minWidth: 88,
      slots: { default: 'observation-action' },
      title: '操作',
    },
  ]);
}
