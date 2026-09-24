import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 菜单 - 管理接口
 * 后端接口前缀：/api/v1/user-center/menus
 * 接口文档：auth-role.doc 第 4 节
 *
 * 注意：列表 / 详情返回值为 camelCase（parentId/componentName/keepAlive/alwaysShow/createdAt）；
 * 新建 / 修改的请求体为 snake_case（parent_id/component_name/keep_alive/always_show）。
 */
export namespace MenuApi {
  /** 菜单类型：1=目录 2=菜单 3=按钮 */
  export type MenuType = 1 | 2 | 3;

  /** 菜单启用状态：0=启用 1=禁用 */
  export type MenuStatus = 0 | 1;

  /** 菜单列表 / 详情记录（camelCase） */
  export interface MenuItem {
    alwaysShow: boolean;
    component: null | string;
    componentName: null | string;
    createdAt: string;
    icon: string;
    id: number;
    keepAlive: boolean;
    name: string;
    parentId: number;
    path: string;
    permission: string;
    sort: number;
    status: MenuStatus | number;
    type: MenuType | number;
    visible: boolean;
  }

  /** 新建 / 修改菜单请求体（snake_case） */
  export interface MenuPayload {
    always_show?: boolean;
    component?: null | string;
    component_name?: null | string;
    icon?: string;
    keep_alive?: boolean;
    name: string;
    parent_id: number;
    path?: string;
    permission?: string;
    sort: number;
    status: MenuStatus | number;
    type: MenuType | number;
    visible?: boolean;
  }

  /** 菜单列表查询参数 */
  export interface MenuListParams extends Recordable<any> {
    /** 按菜单名过滤 */
    name?: string;
    /** 按状态过滤（0=启用 1=禁用） */
    status?: MenuStatus | string;
  }

  /** 精简菜单项（simple-list，下拉用） */
  export interface MenuSimpleItem {
    id: number;
    name: string;
    parentId: number;
    type: MenuType | number;
  }

  /** 树形节点（由扁平列表组装） */
  export interface MenuTreeNode {
    children?: MenuTreeNode[];
    id: number;
    name: string;
    parentId: number;
    type?: MenuType | number;
  }
}

/**
 * 获取菜单列表（扁平）
 * 后端接口：GET /api/v1/user-center/menus
 */
export async function getMenuList(
  params?: MenuApi.MenuListParams,
): Promise<MenuApi.MenuItem[]> {
  return requestClient.get<MenuApi.MenuItem[]>('/v1/user-center/menus', {
    params,
  });
}

/**
 * 获取菜单详情
 * 后端接口：GET /api/v1/user-center/menus/{id}
 */
export async function getMenuDetail(id: number): Promise<MenuApi.MenuItem> {
  return requestClient.get<MenuApi.MenuItem>(`/v1/user-center/menus/${id}`);
}

/**
 * 新建菜单
 * 后端接口：POST /api/v1/user-center/menus
 * @returns 新建菜单 id
 */
export async function createMenu(data: MenuApi.MenuPayload) {
  return requestClient.post<number>('/v1/user-center/menus', data);
}

/**
 * 修改菜单
 * 后端接口：PUT /api/v1/user-center/menus/{id}
 */
export async function updateMenu(id: number, data: MenuApi.MenuPayload) {
  return requestClient.put(`/v1/user-center/menus/${id}`, data);
}

/**
 * 删除菜单
 * 后端接口：DELETE /api/v1/user-center/menus/{id}
 */
export async function deleteMenu(id: number) {
  return requestClient.delete(`/v1/user-center/menus/${id}`);
}

/**
 * 获取精简菜单列表（下拉用，仅认证即可）
 * 后端接口：GET /api/v1/user-center/menus/simple-list
 */
export async function getMenuSimpleList(): Promise<MenuApi.MenuSimpleItem[]> {
  return requestClient.get<MenuApi.MenuSimpleItem[]>(
    '/v1/user-center/menus/simple-list',
  );
}

/**
 * 将扁平菜单列表（含 parentId）组装为树形结构。
 * 供菜单页树表展示与角色菜单分配树使用。
 */
export function buildMenuTree<
  T extends { id: number; name: string; parentId: number; type?: number },
>(flat: T[]): MenuApi.MenuTreeNode[] {
  const map = new Map<number, MenuApi.MenuTreeNode>();
  const roots: MenuApi.MenuTreeNode[] = [];

  // 第一遍：建节点
  for (const item of flat) {
    map.set(item.id, {
      id: item.id,
      name: item.name,
      parentId: item.parentId,
      type: item.type,
    });
  }

  // 第二遍：挂载子节点
  for (const item of flat) {
    const node = map.get(item.id);
    const parent = item.parentId ? map.get(item.parentId) : undefined;
    if (node && parent) {
      (parent.children ??= []).push(node);
    } else if (node) {
      roots.push(node);
    }
  }

  return roots;
}
