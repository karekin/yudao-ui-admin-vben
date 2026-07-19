import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { codeInput, statusInput, timeColumn } from '../shared/form-helpers';

export const reviewStatusMeta: Record<
  string,
  { color: string; label: string }
> = {
  CLOSED: { color: 'default', label: '已关闭' },
  DECIDED: { color: 'success', label: '已决策' },
  IN_REVIEW: { color: 'processing', label: '审核中' },
  OPEN: { color: 'warning', label: '待处理' },
};

/** 审核决策表单（DECIDE_REVIEW：decisionType 非惩罚性四选一 + reasonCode） */
export function useRiskReviewDecideFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Select',
      componentProps: {
        options: [
          { label: '确认风险', value: 'CONFIRM_RISK' },
          { label: '驳回', value: 'DISMISS' },
          { label: '升级', value: 'ESCALATE' },
          { label: '持续监控', value: 'MONITOR' },
        ],
        placeholder: '请选择决策类型',
      },
      fieldName: 'decisionType',
      label: '决策类型',
      rules: 'required',
    },
    {
      component: 'Input',
      componentProps: {
        maxLength: 64,
        placeholder: '请输入原因编码（大写字母+连字符）',
      },
      fieldName: 'reasonCode',
      label: '原因编码',
      rules: 'required',
    },
  ];
}

export function useRiskReviewFormSchema(): VbenFormSchema[] {
  return [
    codeInput('caseId', '案例 ID'),
    codeInput('clusterId', '集群 ID'),
    codeInput('reviewerPrincipalId', '审核员主体'),
    statusInput(),
  ];
}

export function useRiskReviewColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'caseId',
      fixed: 'left',
      minWidth: 220,
      slots: { default: 'case-id' },
      title: '案例 ID',
    },
    { field: 'clusterId', minWidth: 220, title: '集群 ID' },
    {
      field: 'status',
      minWidth: 120,
      slots: { default: 'status' },
      title: '状态',
    },
    { field: 'reviewerPrincipalId', minWidth: 180, title: '审核员主体' },
    { field: 'aggregateVersion', minWidth: 80, title: '版本' },
    timeColumn('createdAt', '创建时间'),
    timeColumn('updatedAt', '更新时间'),
    {
      field: 'action',
      fixed: 'right',
      minWidth: 160,
      slots: { default: 'action' },
      title: '操作',
    },
  ];
}
