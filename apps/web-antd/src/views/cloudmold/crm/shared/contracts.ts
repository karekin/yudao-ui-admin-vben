import { CRM_COMMAND_OPERATIONS } from '#/api/cloudmold/crm/command';

export type CloudMoldCrmPageKey =
  | 'business'
  | 'clue'
  | 'contact'
  | 'customer'
  | 'followup'
  | 'pool'
  | 'salesContract';

export interface CloudMoldCrmPageContract {
  componentPath: string;
  createLabel: string;
  description: string;
  emptyDescription: string;
  endpoint:
    | 'contacts'
    | 'customers'
    | 'follow-ups'
    | 'leads'
    | 'opportunities'
    | 'pool'
    | 'sales-contracts';
  operation: string;
  operationLabel: string;
  operationPlaceholder: string;
  title: string;
}

export const CLOUDMOLD_CRM_WORKBENCH_COMPONENT_PATH =
  'cloudmold/crm/workbench/index';

export const cloudMoldCrmPageContracts: Record<
  CloudMoldCrmPageKey,
  CloudMoldCrmPageContract
> = {
  business: {
    componentPath: 'cloudmold/crm/business/index',
    createLabel: '新建商机',
    description:
      '聚焦 CloudMold 规范商机，金额统一使用 expectedAmountMinor + currencyCode，行内操作只调用 CREATE/UPDATE_OPPORTUNITY。',
    emptyDescription: '当前没有商机，可先录入一个标准化商机并补充预期金额。',
    endpoint: 'opportunities',
    operation: CRM_COMMAND_OPERATIONS.UPDATE_OPPORTUNITY,
    operationLabel: '更新商机',
    operationPlaceholder: '例如 PIPELINE_REFRESH',
    title: 'CloudMold 商机权威',
  },
  clue: {
    componentPath: 'cloudmold/crm/clue/index',
    createLabel: '新建线索',
    description:
      '线索只读取 CloudMold CRM leads 契约；联系方式只暴露 contactChannelRef 与 maskedContact，行内合法动作仅限分派线索。',
    emptyDescription: '当前没有线索，可先录入一条带来源和联系方式遮罩的线索。',
    endpoint: 'leads',
    operation: CRM_COMMAND_OPERATIONS.ASSIGN_LEAD,
    operationLabel: '分派线索',
    operationPlaceholder: '例如 OWNER_REASSIGNED',
    title: 'CloudMold 线索权威',
  },
  contact: {
    componentPath: 'cloudmold/crm/contact/index',
    createLabel: '新建联系人',
    description:
      '联系人只面向 CloudMold 规范联系人账本，联系方式统一落 contactChannelRef 与 maskedContact，行内更新走 UPDATE_CONTACT。',
    emptyDescription: '当前没有联系人，可为已有客户补一条主联系人信息。',
    endpoint: 'contacts',
    operation: CRM_COMMAND_OPERATIONS.UPDATE_CONTACT,
    operationLabel: '更新联系人',
    operationPlaceholder: '例如 CONTACT_REFRESH',
    title: 'CloudMold 联系人权威',
  },
  customer: {
    componentPath: 'cloudmold/crm/customer/index',
    createLabel: '新建客户',
    description:
      '客户台账只走 CloudMold CRM customers 契约；行内合法动作是 RETURN_CUSTOMER_TO_POOL，不再散落旧 CRM 直写接口。',
    emptyDescription: '当前没有客户，可先创建一个标准化客户台账。',
    endpoint: 'customers',
    operation: CRM_COMMAND_OPERATIONS.RETURN_CUSTOMER_TO_POOL,
    operationLabel: '放回公海',
    operationPlaceholder: '例如 NO_RESPONSE',
    title: 'CloudMold 客户权威',
  },
  followup: {
    componentPath: 'cloudmold/crm/followup/index',
    createLabel: '登记跟进',
    description:
      '跟进记录只面向 CloudMold follow-ups 契约；新增和追加都统一走 RECORD_FOLLOW_UP。',
    emptyDescription: '当前没有待跟进事项，可先登记一条下一步动作。',
    endpoint: 'follow-ups',
    operation: CRM_COMMAND_OPERATIONS.RECORD_FOLLOW_UP,
    operationLabel: '追加跟进',
    operationPlaceholder: '例如 FOLLOW_UP_APPEND',
    title: 'CloudMold 跟进权威',
  },
  pool: {
    componentPath: 'cloudmold/crm/customer/pool/index',
    createLabel: '录入公海客户',
    description:
      '公海客户只读取 CloudMold pool 契约；领取客户由 CLAIM_CUSTOMER 处理，客户创建仍复用 CREATE_CUSTOMER。',
    emptyDescription: '当前公海为空，可录入一条待认领客户或等待自动流入。',
    endpoint: 'pool',
    operation: CRM_COMMAND_OPERATIONS.CLAIM_CUSTOMER,
    operationLabel: '领取客户',
    operationPlaceholder: '例如 MANUAL_CLAIM',
    title: 'CloudMold 客户公海权威',
  },
  salesContract: {
    componentPath: 'cloudmold/crm/sales-contract/index',
    createLabel: '新建销售合同草稿',
    description:
      '销售合同页直连 CloudMold SalesContractCommand API，只支持 CREATE_DRAFT / UPDATE_DRAFT / SUBMIT_APPROVAL，并在详情里只读展示 Finance summary。',
    emptyDescription: '当前没有销售合同详情，请输入合同 ID 查询或先创建草稿。',
    endpoint: 'sales-contracts',
    operation: 'UPDATE_DRAFT',
    operationLabel: '更新草稿',
    operationPlaceholder: '例如 CONTRACT_REVISED',
    title: 'CloudMold 销售合同权威',
  },
};

export const CLOUDMOLD_CRM_COMPONENT_PATHS = [
  CLOUDMOLD_CRM_WORKBENCH_COMPONENT_PATH,
  ...Object.values(cloudMoldCrmPageContracts).map(
    (contract) => contract.componentPath,
  ),
];
