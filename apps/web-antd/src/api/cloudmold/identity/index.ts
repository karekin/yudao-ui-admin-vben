import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

/**
 * CloudMold 规范身份只读查询 + source resolve API。
 * 仅读取 cloudmold_identity_principal / source_identity / operation 权威表。
 */
export namespace CloudMoldIdentityApi {
  export interface Operation {
    commandType: string;
    createdAt: string;
    idempotencyKey: string;
    operationId: number;
    principalId?: string;
    status: number;
    updatedAt: string;
  }

  export interface Principal {
    createdAt: string;
    principalId: string;
    principalType: string;
    status: string;
    tenantId: number;
    updatedAt: string;
    version: number;
  }

  export interface PrincipalPageParams extends PageParam {
    principalType?: string;
    status?: string;
  }

  export interface OperationPageParams extends PageParam {
    commandType?: string;
    principalId?: string;
    status?: number;
  }

  export interface ResolveSourceInput {
    sourceId: string;
    sourceSystem: string;
    sourceType: string;
  }

  export interface Source {
    principalId: string;
    principalType?: string;
    sourceId: string;
    sourceIdentityId: string;
    sourceSystem: string;
    sourceType: string;
    status: string;
    updatedAt: string;
    validFrom?: string;
    validTo?: string;
    version: number;
  }

  export interface SourcePageParams extends PageParam {
    principalId?: string;
    sourceSystem?: string;
    sourceType?: string;
    status?: string;
  }
}

export function getCloudMoldIdentityOperationPage(
  params: CloudMoldIdentityApi.OperationPageParams,
) {
  return requestClient.get<PageResult<CloudMoldIdentityApi.Operation>>(
    '/cloudmold/identity/operations/page',
    { params },
  );
}

export function getCloudMoldIdentityPrincipalPage(
  params: CloudMoldIdentityApi.PrincipalPageParams,
) {
  return requestClient.get<PageResult<CloudMoldIdentityApi.Principal>>(
    '/cloudmold/identity/principals/page',
    { params },
  );
}

export function getCloudMoldIdentitySourcePage(
  params: CloudMoldIdentityApi.SourcePageParams,
) {
  return requestClient.get<PageResult<CloudMoldIdentityApi.Source>>(
    '/cloudmold/identity/sources/page',
    { params },
  );
}

/** 解析 source 三元组到 CloudMold principal（管理员用 SYSTEM/SYSTEM_ADMIN_USER/userId） */
export function resolveCloudMoldSourceIdentity(
  params: CloudMoldIdentityApi.ResolveSourceInput,
) {
  return requestClient.post<CloudMoldIdentityApi.Source>(
    '/cloudmold/identity/source/resolve',
    params,
  );
}
