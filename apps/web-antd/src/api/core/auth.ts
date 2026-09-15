import type { AxiosResponse } from '@vben/request';

import { baseRequestClient, requestClient } from '#/api/request';

export namespace AuthApi {
  /** 登录接口参数（表单侧字段，username 会在请求时映射为后端的 login） */
  export interface LoginParams {
    password?: string;
    username?: string;
  }

  /** 登录返回的用户信息 */
  export interface LoginUser {
    email: string;
    id: number;
    name: string;
    permissions: string[];
    phone: string;
    roles: string[];
    status: string;
  }

  /** 登录接口返回值（位于响应体 data 字段） */
  export interface LoginResult {
    /** JWT 访问令牌 */
    access_token: string;
    /** 过期时间（秒） */
    expires_in: number;
    token_type: string;
    /** 已认证用户信息（含角色与权限码） */
    user: LoginUser;
  }

  /** 刷新 token 接口 data 字段结构 */
  export interface RefreshTokenData {
    access_token: string;
    expires_in: number;
    token_type: string;
  }

  /** 刷新 token 接口响应体结构 */
  export interface RefreshTokenBody {
    code: number;
    data: RefreshTokenData;
    success: boolean;
  }
}

/**
 * 登录（账号 / 手机号 / 邮箱 + 密码）
 * 后端接口文档：/api/v1/user-center/auth/login
 */
export async function loginApi(data: AuthApi.LoginParams) {
  return requestClient.post<AuthApi.LoginResult>(
    '/v1/user-center/auth/login',
    // 后端使用 login 字段接收账号 / 手机号 / 邮箱
    { login: data.username, password: data.password },
  );
}

/**
 * 刷新 accessToken
 * 注意：使用 baseRequestClient（不经过响应拦截器），返回值为原始 AxiosResponse，
 * 其 data 字段为响应体 { code, data: { access_token, ... } }
 * baseRequestClient 已注入鉴权请求拦截器，会自动携带当前 accessToken
 */
export async function refreshTokenApi(): Promise<
  AxiosResponse<AuthApi.RefreshTokenBody>
> {
  return baseRequestClient.post('/v1/user-center/auth/refresh') as Promise<
    AxiosResponse<AuthApi.RefreshTokenBody>
  >;
}

/**
 * 退出登录
 * 使用 baseRequestClient 携带当前 token 调用后端注销（黑名单当前 token）
 */
export async function logoutApi() {
  return baseRequestClient.post('/v1/user-center/auth/logout');
}
