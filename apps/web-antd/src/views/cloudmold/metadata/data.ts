import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { codeInput, statusInput, timeColumn } from '../shared/form-helpers';

export const definitionKindMeta: Record<
  string,
  { color: string; label: string }
> = {
  DATASET: { color: 'processing', label: '数据集' },
  DATA_SOURCE: { color: 'default', label: '数据源' },
  DQC_RULE: { color: 'warning', label: '质量规则' },
  LINEAGE: { color: 'default', label: '血缘' },
  METRIC: { color: 'success', label: '指标' },
  TASK: { color: 'processing', label: '任务' },
};

export const definitionStatusMeta: Record<
  string,
  { color: string; label: string }
> = {
  DRAFT: { color: 'default', label: '草稿' },
  PUBLISHED: { color: 'success', label: '已发布' },
};

export function useMetadataDefinitionFormSchema(): VbenFormSchema[] {
  return [
    codeInput('definitionId', '定义 ID'),
    codeInput('definitionKind', '种类'),
    codeInput('definitionCode', '业务编码'),
    codeInput('displayName', '显示名'),
    codeInput('ownerPrincipalId', '负责人'),
    statusInput(),
  ];
}

export function useMetadataDefinitionColumns(): VxeTableGridOptions['columns'] {
  return [
    {
      field: 'definitionId',
      fixed: 'left',
      minWidth: 220,
      slots: { default: 'definition-id' },
      title: '定义 ID',
    },
    {
      field: 'definitionKind',
      minWidth: 120,
      slots: { default: 'definition-kind' },
      title: '种类',
    },
    { field: 'definitionCode', minWidth: 180, title: '业务编码' },
    { field: 'displayName', minWidth: 180, title: '显示名' },
    {
      field: 'status',
      minWidth: 100,
      slots: { default: 'status' },
      title: '状态',
    },
    { field: 'currentVersion', minWidth: 100, title: '当前版本' },
    { field: 'ownerPrincipalId', minWidth: 180, title: '负责人' },
    timeColumn('createdAt', '创建时间'),
    timeColumn('updatedAt', '更新时间'),
  ];
}
