import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace CloudMoldMetadataApi {
  export interface Definition {
    createdAt: string;
    currentVersion: number;
    definitionCode: string;
    definitionId: string;
    definitionKind: string;
    displayName: string;
    ownerPrincipalId: string;
    status: string;
    updatedAt: string;
  }

  export interface DefinitionPageParams extends PageParam {
    createdAtFrom?: string;
    createdAtTo?: string;
    definitionCode?: string;
    definitionId?: string;
    definitionKind?: string;
    displayName?: string;
    ownerPrincipalId?: string;
    status?: string;
  }
}

export function getCloudMoldMetadataDefinitionPage(
  params: CloudMoldMetadataApi.DefinitionPageParams,
) {
  return requestClient.get<PageResult<CloudMoldMetadataApi.Definition>>(
    '/cloudmold/metadata/definition/page',
    { params },
  );
}
