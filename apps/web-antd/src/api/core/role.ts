import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 角色 - 管理接口
 * 后端接口前缀：/api/v1/user-center/roles
 * 接口文档：auth-role.doc 第 5 节
 *
 * 注意：角色列表返回 { data, meta:{ total } }（非 Laravel 分页器），
 * 字段为 camelCase（code/dataScope/dataScopeDeptIds/createdAt 等）。
 */
export namespace RoleApi {
  /** 角色类型：1=系统内置（不可删除） 2=自定义 */
  export type RoleType = 1 | 2;

  /** 角色启用状态：0=启用 1=禁用 */
  export type RoleStatus = 0 | 1;

  /** 角色列表 / 详情记录（camelCase） */
  export interface RoleListItem {
    code: string;
    createdAt: string;
    dataScope: number;
    dataScopeDeptIds: null | number[];
    id: number;
    name: string;
    remark: null | string;
    sort: number;
    status: number | RoleStatus;
    type: number | RoleType;
  }

  /** 新建 / 修改角色请求体 */
  export interface RolePayload {
    code: string;
    name: string;
    remark?: string;
    sort: number;
  }

  /** 角色列表查询参数 */
  export interface RoleListParams extends Recordable<any> {
    /** 按 code 过滤 */
    code?: string;
    /** 创建时间上限（包含） */
    end_time?: string;
    /** 按显示名/code 过滤 */
    name?: string;
    /** 页码 */
    page?: number;
    /** 每页条数（默认 10） */
    per_page?: number;
    /** 按状态过滤（0=启用 1=禁用） */
    status?: RoleStatus | string;
    /** 创建时间下限（包含） */
    start_time?: string;
  }

  /** vxe-grid 代理所需的结构 */
  export interface RolePageResult {
    items: RoleListItem[];
    total: number;
  }

  /** 精简角色项（下拉用） */
  export interface RoleSimpleItem {
    code: string;
    id: number;
    name: string;
  }
}

/**
 * 获取角色分页列表
 * 后端接口：GET /api/v1/user-center/roles
 *
 * 响应体为 { success, code, data:[...], meta:{ total, current_page, ... } }：
 * `data`（当前页角色数组）与 `meta`（分页元信息）是并列字段。
 * 由于 requestClient 默认 responseReturn:'data' 只返回 body.data（即角色数组），
 * 会丢失 meta.total，故此处用 responseReturn:'body' 取完整 body 再拆分。
 */
export async function getRoleList(
  params: RoleApi.RoleListParams,
): Promise<RoleApi.RolePageResult> {
  const body = await requestClient.get<{
    data: RoleApi.RoleListItem[];
    meta: { total: number };
  }>('/v1/user-center/roles', { params, responseReturn: 'body' });
  return {
    items: body.data ?? [],
    total: body.meta?.total ?? 0,
  };
}

/**
 * 获取角色详情
 * 后端接口：GET /api/v1/user-center/roles/{id}
 */
export async function getRoleDetail(id: number): Promise<RoleApi.RoleListItem> {
  return requestClient.get<RoleApi.RoleListItem>(`/v1/user-center/roles/${id}`);
}

/**
 * 新建角色
 * 后端接口：POST /api/v1/user-center/roles
 * @returns 新建角色 id
 */
export async function createRole(data: RoleApi.RolePayload) {
  return requestClient.post<number>('/v1/user-center/roles', data);
}

/**
 * 修改角色
 * 后端接口：PUT /api/v1/user-center/roles/{id}
 */
export async function updateRole(id: number, data: RoleApi.RolePayload) {
  return requestClient.put(`/v1/user-center/roles/${id}`, data);
}

/**
 * 删除角色（系统内置角色不可删除）
 * 后端接口：DELETE /api/v1/user-center/roles/{id}
 */
export async function deleteRole(id: number) {
  return requestClient.delete(`/v1/user-center/roles/${id}`);
}

/**
 * 获取精简角色列表（下拉用，仅认证即可）
 * 后端接口：GET /api/v1/user-center/roles/simple-list
 */
export async function getRoleSimpleList(): Promise<RoleApi.RoleSimpleItem[]> {
  return requestClient.get<RoleApi.RoleSimpleItem[]>(
    '/v1/user-center/roles/simple-list',
  );
}
