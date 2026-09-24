import type { Recordable, UserInfo } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace UserApi {
  /** 用户状态：active=启用 inactive=禁用 banned=封禁 */
  export type UserStatus = 'active' | 'banned' | 'inactive';

  /** /auth/me 与 /users/profile 返回的用户资料 */
  export interface UserProfile {
    avatar: null | string;
    created_at?: string;
    email: null | string;
    email_verified_at?: null | string;
    id: number;
    name: string;
    nickname: null | string;
    phone: null | string;
    phone_verified_at?: null | string;
    status: string;
    updated_at?: string;
  }

  /** 用户列表项中的角色引用（name 实为角色 code，display_name 为显示名） */
  export interface UserRoleRef {
    display_name: null | string;
    id: number;
    name: string;
  }

  /** 用户列表 / 详情记录（snake_case，直接来自 Laravel 分页器或资源） */
  export interface UserListItem {
    avatar: null | string;
    created_at?: null | string;
    email: null | string;
    email_verified_at?: null | string;
    id: number;
    is_deleted?: boolean;
    name: string;
    nickname: null | string;
    permissions?: string[];
    phone: null | string;
    phone_verified_at?: null | string;
    roles: UserRoleRef[];
    status: string | UserStatus;
    token_version?: number;
    updated_at?: null | string;
  }

  /** 新建 / 修改用户请求体（roles 为角色 code 数组） */
  export interface UserPayload {
    avatar?: string;
    email?: string;
    name?: string;
    nickname?: string;
    /** 新建必填，修改可选 */
    password?: string;
    phone?: string;
    /** 角色 code 数组（sync：替换现有角色） */
    roles?: string[];
    status?: string | UserStatus;
  }

  /** 用户列表查询参数 */
  export interface UserListParams extends Recordable<any> {
    /** 页码 */
    page?: number;
    /** 每页条数（默认 15） */
    per_page?: number;
    /** 按 role code/name 过滤 */
    role?: string;
    /** 关键字：name/email/phone 模糊匹配 */
    search?: string;
    /** 按状态过滤 */
    status?: string | UserStatus;
  }

  /** vxe-grid 代理所需的结构 */
  export interface UserPageResult {
    items: UserListItem[];
    total: number;
  }

  /** 修改当前用户个人资料请求体 */
  export interface ProfilePayload {
    avatar?: string;
    name?: string;
    nickname?: string;
  }

  /** 修改当前用户密码请求体 */
  export interface ChangePasswordPayload {
    current_password: string;
    password: string;
    password_confirmation: string;
  }
}

/**
 * 获取当前登录用户信息
 * 后端接口：/api/v1/user-center/auth/me
 * 该接口不返回角色与权限码，角色以登录时持久化的信息为准
 */
export async function getUserInfoApi(): Promise<UserInfo> {
  const profile = await requestClient.get<UserApi.UserProfile>(
    '/v1/user-center/auth/me',
  );

  return {
    avatar: profile.avatar ?? '',
    desc: profile.email ?? '',
    homePath: '',
    realName: profile.nickname || profile.name,
    // /auth/me 不返回角色，刷新场景下角色以持久化的 accessCodes 为准
    roles: [],
    token: '',
    userId: String(profile.id),
    username: profile.name,
  };
}

/**
 * 获取用户分页列表
 * 后端接口：GET /api/v1/user-center/users
 * 返回 Laravel 分页器，此处转换为 vxe-grid 所需的 { items, total }。
 */
export async function getUserList(
  params: UserApi.UserListParams,
): Promise<UserApi.UserPageResult> {
  const pageData = await requestClient.get<{
    data: UserApi.UserListItem[];
    total: number;
  }>('/v1/user-center/users', { params });
  return {
    items: pageData.data ?? [],
    total: pageData.total ?? 0,
  };
}

/**
 * 获取用户详情
 * 后端接口：GET /api/v1/user-center/users/{id}
 */
export async function getUserDetail(id: number): Promise<UserApi.UserListItem> {
  return requestClient.get<UserApi.UserListItem>(`/v1/user-center/users/${id}`);
}

/**
 * 新建用户
 * 后端接口：POST /api/v1/user-center/users
 */
export async function createUser(
  data: UserApi.UserPayload,
): Promise<UserApi.UserListItem> {
  return requestClient.post<UserApi.UserListItem>(
    '/v1/user-center/users',
    data,
  );
}

/**
 * 修改用户（部分更新）
 * 后端接口：PUT /api/v1/user-center/users/{id}
 */
export async function updateUser(
  id: number,
  data: UserApi.UserPayload,
): Promise<UserApi.UserListItem> {
  return requestClient.put<UserApi.UserListItem>(
    `/v1/user-center/users/${id}`,
    data,
  );
}

/**
 * 删除用户
 * 后端接口：DELETE /api/v1/user-center/users/{id}
 */
export async function deleteUser(id: number) {
  return requestClient.delete(`/v1/user-center/users/${id}`);
}

/**
 * 启用用户
 * 后端接口：POST /api/v1/user-center/users/{id}/activate
 */
export async function activateUser(id: number) {
  return requestClient.post(`/v1/user-center/users/${id}/activate`);
}

/**
 * 禁用用户
 * 后端接口：POST /api/v1/user-center/users/{id}/deactivate
 */
export async function deactivateUser(id: number) {
  return requestClient.post(`/v1/user-center/users/${id}/deactivate`);
}

/**
 * 封禁用户
 * 后端接口：POST /api/v1/user-center/users/{id}/ban
 */
export async function banUser(id: number) {
  return requestClient.post(`/v1/user-center/users/${id}/ban`);
}

/**
 * 重置用户密码（复用修改用户接口，仅提交 password 字段）
 * 后端接口：PUT /api/v1/user-center/users/{id}
 */
export async function resetUserPassword(id: number, password: string) {
  return updateUser(id, { password });
}

/**
 * 获取当前用户个人资料
 * 后端接口：GET /api/v1/user-center/users/profile
 */
export async function getUserProfile(): Promise<UserApi.UserProfile> {
  return requestClient.get<UserApi.UserProfile>(
    '/v1/user-center/users/profile',
  );
}

/**
 * 修改当前用户个人资料
 * 后端接口：PUT /api/v1/user-center/users/profile
 */
export async function updateUserProfile(
  data: UserApi.ProfilePayload,
): Promise<UserApi.UserProfile> {
  return requestClient.put<UserApi.UserProfile>(
    '/v1/user-center/users/profile',
    data,
  );
}

/**
 * 修改当前用户密码
 * 后端接口：POST /api/v1/user-center/users/change-password
 */
export async function changeUserPassword(data: UserApi.ChangePasswordPayload) {
  return requestClient.post('/v1/user-center/users/change-password', data);
}
