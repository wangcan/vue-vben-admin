import type { RouteRecordStringComponent } from '@vben/types';

import { useAccessStore, useUserStore } from '@vben/stores';

import { requestClient } from '#/api/request';

/**
 * 后端「权限菜单树」接口（/auth/permission-info）相关类型与转换逻辑。
 * 后端返回的菜单树结构与前端路由（RouteRecordStringComponent）不一致，
 * 需在此处做字段映射；按钮（type=3）节点仅作为权限点，不参与路由生成。
 */
export namespace PermissionApi {
  /** 后端菜单节点 */
  export interface BackendMenu {
    alwaysShow?: boolean;
    children?: BackendMenu[];
    /** 页面组件路径（如 system/user/index）；目录为空字符串，按钮为 null */
    component?: null | string;
    /** 路由 name（用于 keep-alive）；目录通常为 null */
    componentName?: null | string;
    icon?: string;
    id: number;
    /** 显示名称（对应 meta.title） */
    name: string;
    parentId: number;
    /** 权限标识（type=3 按钮的权限码；type=2 菜单的列表权限） */
    permission?: string;
    /** 路由路径：顶级为绝对（/system），子级为相对（user） */
    path: string;
    sort?: number;
    /** 1=目录 2=菜单 3=按钮 */
    type: 1 | 2 | 3;
    keepAlive?: boolean;
    visible?: boolean;
  }

  /** permission-info 中精简的用户资料 */
  export interface PermissionUser {
    avatar?: null | string;
    id: number;
    name: string;
    nickname?: null | string;
  }

  /** /auth/permission-info 响应 data 字段 */
  export interface PermissionInfoData {
    menus: BackendMenu[];
    permissions: string[];
    roles: string[];
    user: PermissionUser;
  }
}

/**
 * 获取当前登录用户的权限信息（角色 / 权限码 / 菜单树）
 * 后端接口：GET /api/v1/user-center/auth/permission-info
 */
export async function getPermissionInfoApi(): Promise<PermissionApi.PermissionInfoData> {
  return requestClient.get<PermissionApi.PermissionInfoData>(
    '/v1/user-center/auth/permission-info',
  );
}

/**
 * 由后端菜单路径派生路由 name（componentName 为空时使用，主要是目录节点）。
 * /system -> System；user -> User；空路径回退到 Menu_{id}。
 */
function deriveNameFromPath(path: string, id: number): string {
  if (!path) return `Menu_${id}`;
  const segments = path.split('/').filter(Boolean);
  const last = segments[segments.length - 1] ?? '';
  if (!last) return `Menu_${id}`;
  return last.charAt(0).toUpperCase() + last.slice(1);
}

/**
 * 将单个后端菜单节点转换为前端路由（RouteRecordStringComponent）。
 * type=3（按钮）为权限点，不生成路由，应在调用前过滤。
 */
function transformMenuNode(
  node: PermissionApi.BackendMenu,
): RouteRecordStringComponent {
  const name = node.componentName || deriveNameFromPath(node.path, node.id);
  // 仅保留 type !== 3 的子节点（目录 / 菜单），按钮节点不参与路由
  const children = (node.children ?? [])
    .filter((child) => child.type !== 3)
    .map((child) => transformMenuNode(child));

  return {
    name,
    path: node.path,
    // 目录 component 为空字符串：generateAccessible 在存在 children 时会删除 component；
    // 菜单 component（如 system/user/index）由 generateRoutesByBackend 映射到 views 下的 .vue
    component: node.component ?? '',
    meta: {
      title: node.name,
      icon: node.icon || undefined,
      order: node.sort,
      hideInMenu: node.visible === false,
      keepAlive: node.keepAlive,
    },
    children,
  };
}

/**
 * 将后端菜单树转换为前端可消费的路由树（RouteRecordStringComponent[]）。
 * 过滤掉顶级按钮节点，递归过滤子级按钮节点。
 */
export function transformBackendMenusToRoutes(
  menus: PermissionApi.BackendMenu[],
): RouteRecordStringComponent[] {
  return menus
    .filter((menu) => menu.type !== 3)
    .map((menu) => transformMenuNode(menu));
}

/**
 * 拉取权限菜单信息并完成权限回填：
 * 1. 写入权限码 accessCodes（按钮级 v-access 依据）；
 * 2. 增量更新 userInfo 的 roles / 头像 / 昵称（/auth/me 不返回 roles，此处补齐）；
 * 3. 返回转换后的菜单路由树，供 generateRoutesByBackend 生成动态路由与菜单。
 */
export async function fetchMenuListWithAccessInfo(): Promise<
  RouteRecordStringComponent[]
> {
  const accessStore = useAccessStore();
  const userStore = useUserStore();

  const info = await getPermissionInfoApi();

  // 权限码
  accessStore.setAccessCodes(info.permissions ?? []);

  // 角色与资料补齐（仅在已有 userInfo 时增量更新，避免覆盖登录态）
  const existing = userStore.userInfo;
  if (existing) {
    userStore.setUserInfo({
      ...existing,
      roles: info.roles ?? existing.roles ?? [],
      avatar: info.user?.avatar ?? existing.avatar,
      realName: info.user?.nickname || info.user?.name || existing.realName,
      username: info.user?.name ?? existing.username,
      userId:
        info.user?.id === undefined ? existing.userId : String(info.user.id),
    });
  }

  return transformBackendMenusToRoutes(info.menus ?? []);
}
