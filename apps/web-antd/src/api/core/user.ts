import type { UserInfo } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace UserApi {
  /** /auth/me 返回的用户资料 */
  export interface UserProfile {
    avatar: null | string;
    created_at?: string;
    email: string;
    email_verified_at?: null | string;
    id: number;
    name: string;
    nickname: null | string;
    phone: string;
    phone_verified_at?: null | string;
    status: string;
    updated_at?: string;
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
