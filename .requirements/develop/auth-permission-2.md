# 用户 / 角色 / 权限（菜单）管理 执行结果

> 需求来源：`.requirements/develop/task.txt`（当前版本）。
>
> task.txt 有效需求为「忽略以下所有需求描述」之上的两条：
> 1. `.requirements/develop/auth-role.doc` 为用户认证、角色、权限相关后端接口文档，`{{host}}` 替换为 `http://49.235.53.53:9001` 即可访问真实后端；
> 2. 结合系统管理相关的动态路由与接口实际返回值，补充完善出完整的 **用户、角色、权限管理功能**。
>
> 其后的「需求2（记录到 permission.md）」依据「忽略以下所有需求描述」指令未执行。本文档沿用 `auth-permission.md`、`knowledge-figure.md` 的体例，记录本次执行结果，作为 `auth-permission.md`（需求1：认证 / 动态路由）之上「系统管理 CRUD + 权限分配」一层的补全。

## 一、需求描述

依据 `auth-role.doc`，在已完成的「认证 / 登录 / `permission-info` / 动态路由 / 刷新 / 登出」基础上，把 `views/system/{user,role,menu}` 三个占位页补全为与 `views/knowledge/figure` 同等完整的 CRUD + 权限分配管理页，所有数据走真实后端接口，按钮级权限用 `v-access:code`。

涉及的后端接口（前缀 `/api/v1/user-center`，`{{host}} = http://49.235.53.53:9001`）：

| # | 接口 | 方法 | 路径 | 权限码 |
| - | --- | --- | --- | --- |
| 1 | 用户分页列表 | GET | `/users` | `system:user:query` |
| 2 | 用户新建 | POST | `/users` | `system:user:create` |
| 3 | 用户详情 | GET | `/users/{id}` | `system:user:query` |
| 4 | 用户修改 | PUT | `/users/{id}` | `system:user:update` |
| 5 | 用户删除 | DELETE | `/users/{id}` | `system:user:delete` |
| 6 | 启用 / 禁用 / 封禁用户 | POST | `/users/{id}/{activate,deactivate,ban}` | `system:user:update` |
| 7 | 角色分页列表 | GET | `/roles` | `system:role:query` |
| 8 | 角色新建 / 修改 / 删除 | POST/PUT/DELETE | `/roles[/{id}]` | `system:role:create/update/delete` |
| 9 | 角色精简列表（下拉） | GET | `/roles/simple-list` | （仅认证即可） |
| 10 | 菜单列表（扁平） | GET | `/menus` | `system:menu:query` |
| 11 | 菜单新建 / 修改 / 删除 | POST/PUT/DELETE | `/menus[/{id}]` | `system:menu:create/update/delete` |
| 12 | 菜单精简列表（下拉） | GET | `/menus/simple-list` | （仅认证即可） |
| 13 | 查询角色已分配菜单 id | GET | `/permissions/role-menus?role_id=` | `system:permission:assign-role-menu` |
| 14 | 分配角色菜单 | POST | `/permissions/assign-role-menu` | `system:permission:assign-role-menu` |
| 15 | 分配角色数据权限 | POST | `/permissions/assign-role-data-scope` | `system:permission:assign-role-data-scope` |
| 16 | 查询用户已分配角色 id | GET | `/permissions/user-roles?user_id=` | `system:permission:assign-user-role` |
| 17 | 分配用户角色 | POST | `/permissions/assign-user-role` | `system:permission:assign-user-role` |

> 重置密码复用「用户修改」接口（`PUT /users/{id}` 仅提交 `password`），无独立端点。

## 二、接口契约（已 curl 实测）

响应统一为 `{success, code:0成功, data, message?}`；`requestClient` 拦截器配 `codeField:'code' / dataField:'data' / successCode:0 / responseReturn:'data'`，故 `requestClient.get<T>(url)` 直接返回 body 的 `data` 字段。

### 字段命名与分页结构差异（重要）

| 接口 | 返回结构 | 字段命名 |
| --- | --- | --- |
| `GET /users` | Laravel 分页器 `{data:[], total, per_page, current_page, last_page}` | **snake_case**（`created_at / email_verified_at / token_version`） |
| `GET /roles` | 响应体 `{success, code, data:[...], meta:{total,...}}`：`data`（当前页角色数组）与 `meta`（分页元信息）为**并列**字段（非 Laravel 分页器） | **camelCase**（`code / dataScope / dataScopeDeptIds / createdAt`） |
| `GET /menus` | 扁平数组 `data:[...]` | **camelCase**（`parentId / componentName / keepAlive / alwaysShow / createdAt`） |
| `GET /roles/simple-list` | `[{id, name, code}]` | — |
| `GET /menus/simple-list` | `[{id, name, parentId, type}]` | — |
| `POST/PUT /menus` 请求体 | — | **snake_case**（`parent_id / component_name / keep_alive / always_show`） |
| `GET /permissions/role-menus` | `number[]`（菜单 id）；查询参数 **camelCase** `roleId` | — |
| `GET /permissions/user-roles` | `number[]`（角色 id）；查询参数 **camelCase** `userId` | — |
| `POST /permissions/assign-*` 请求体 | — | **snake_case**（`role_id / menu_ids / user_id / role_ids / data_scope / data_scope_dept_ids`） |

> 登录接口 `POST /auth/login` 的账号字段为 **`login`**（接收账号 / 手机号 / 邮箱），非 `name`；`auth.ts` 的 `loginApi` 已在请求时把表单 `username` 映射为 `login`。

据此（关键：`requestClient` 默认 `responseReturn:'data'`，由 `defaultResponseInterceptor` 解构 body 的 `data` 字段后返回，故 body 顶层其它字段如 `meta` 会被丢弃）：
- `getUserList`：`/users` 的 body.data 即 Laravel 分页器（含 `data:[items]` 与 `total`），故 `requestClient.get` 返回分页器，直接取 `.data`/`.total` 转 `{items, total}`；
- `getRoleList`：`/roles` 的 body.data 是**角色数组本身**、`meta` 是其并列字段，默认 `responseReturn:'data'` 会丢 `meta`，故**显式用 `responseReturn:'body'`** 取完整 body 再拆 `{items: body.data, total: body.meta.total}`；
- `getMenuList`：`/menus` 的 body.data 即扁平数组，直接返回，由 `buildMenuTree` 组装为树；
- `getRoleMenuIds` / `getUserRoleIds`：查询参数用 camelCase `roleId` / `userId`（后端 FormRequest 校验字段名为 `roleId`/`userId`，snake_case 会被判 `The role id field is required.`）；
- 三个 `assign-*` POST 请求体用 snake_case；
- 菜单列表/详情用 camelCase `MenuItem`，提交体用 snake_case `MenuPayload`，表单在回填与提交时做双向转换。

### 枚举约定

| 字段 | 取值 |
| --- | --- |
| 菜单类型 `type` | 1=目录 / 2=菜单 / 3=按钮 |
| 菜单状态 `status` | 0=启用 / 1=禁用 |
| 角色类型 `type` | 1=系统内置（不可删除） / 2=自定义 |
| 角色状态 `status` | 0=启用 / 1=禁用 |
| 用户状态 `status` | `active` / `inactive` / `banned` |
| 数据范围 `data_scope` | 1=全部 / 2=自定义部门 / 3=本部门 / 4=本部门及以下 / 5=仅本人 |

> 用户列表 `roles[].name` 实为角色 code（Spatie `name` 列），`roles[].display_name` 为显示名；角色列表 `name`=显示名、`code`=code。故用户表单的角色多选取值用 **code**，用户角色分配弹窗取值用 **id**。

## 三、改动文件清单

### API 层（`apps/web-antd/src/api/core/`）

| 文件 | 类型 | 改动 |
| --- | --- | --- |
| `user.ts` | 扩展 | 保留 `getUserInfoApi` / `UserApi.UserProfile`；新增 `UserApi` 命名空间（`UserStatus / UserProfile / UserRoleRef / UserListItem / UserPayload / UserListParams / UserPageResult / ProfilePayload / ChangePasswordPayload`）与 13 个函数：`getUserList / getUserDetail / createUser / updateUser / deleteUser / activateUser / deactivateUser / banUser / resetUserPassword / getUserProfile / updateUserProfile / changeUserPassword` |
| `role.ts` | 新建 | `RoleApi` 命名空间（`RoleType / RoleStatus / RoleListItem / RolePayload / RoleListParams / RolePageResult / RoleSimpleItem`）与 6 个函数：`getRoleList`（用 `responseReturn:'body'` 取 `{data, meta}` 并列结构）/ `getRoleDetail / createRole / updateRole / deleteRole / getRoleSimpleList` |
| `menu.ts` | 替换占位 | `MenuApi` 命名空间（`MenuType / MenuStatus / MenuItem / MenuPayload / MenuListParams / MenuSimpleItem / MenuTreeNode`）与 6 个函数 + `buildMenuTree<T>(flat)` 树工具（无非空断言） |
| `permission.ts` | 扩展 | 保留现有菜单树→路由转换；新增 `PermissionAssignApi` 命名空间（`DataScope / AssignRoleMenuPayload / AssignDataScopePayload / AssignUserRolePayload`）、`dataScopeOptions` 常量与 5 个函数：`getRoleMenuIds / assignRoleMenus / assignRoleDataScope / getUserRoleIds / assignUserRoles` |
| `index.ts` | 修改 | 增加 `export * from './role';` |

### 视图层（`apps/web-antd/src/views/system/`）

| 文件 | 类型 | 改动 |
| --- | --- | --- |
| `user/data.ts` | 新建 | 状态选项、表单 schema（含角色 `ApiSelect` 取 `getRoleSimpleList`、`valueField:'code'`、`mode:'multiple'`）、搜索表单、列定义（状态 `CellTag`、角色 `CellTags` 经 `#roles` slot、操作 `CellOperation` 各项按 `hasAccessByCodes` 显隐） |
| `user/index.vue` | 重写 | `defineOptions({name:'SystemUser'})`；`useVbenVxeGrid` + 3 个 Modal（Form / Password / RoleAssign）；`onActionClick` 处理 edit/delete/password/role；工具栏「新增用户」`v-access:code=['system:user:create']` |
| `user/modules/form.vue` | 新建 | 新建/编辑用户；列表行→表单映射（`roles` 经 `r.name` 映射为 code 数组）；编辑时空密码不提交 |
| `user/modules/password-modal.vue` | 新建 | 重置密码（`resetUserPassword(id, password)`），校验 `password === password_confirmation` |
| `user/modules/role-assign-modal.vue` | 新建 | `getUserRoleIds(userId)` 回显 + `getRoleSimpleList()`（`valueField:'id'`、`mode:'multiple'`）→ `assignUserRoles({user_id, role_ids})` |
| `role/data.ts` | 新建 | 类型/状态选项、表单 schema（`name/code/sort/remark`）、搜索表单、列定义（类型/状态 `CellTag`）；删除 `show = row.type !== 1 && hasAccessByCodes(['system:role:delete'])` |
| `role/index.vue` | 重写 | `defineOptions({name:'SystemRole'})`；Grid + 3 个 Modal（Form / MenuAssign / DataScope）；`pageSize:10`；行操作 edit/menu/scope/delete |
| `role/modules/form.vue` | 新建 | 新建/编辑角色；提交体 `{code, name, remark, sort}` |
| `role/modules/menu-assign-modal.vue` | 新建 | `Promise.all([getMenuList(), getRoleMenuIds(roleId)])` → `buildMenuTree` → antd `Tree`（checkable, default-expand-all）；`computeCheckedLeaves` 仅设叶子（antd 级联父级）、`computeSaveIds` 取勾选叶子 + 全部祖先；`onCheck` 将 `Array<number\|string>` 强制 `.map(Number)` |
| `role/modules/data-scope-modal.vue` | 新建 | `assignRoleDataScope`；`RadioGroup` 数据范围；`data_scope===2` 时条件显示 `data_scope_dept_ids`（`mode:'tags'`）；回显 `dataScope` / `dataScopeDeptIds.map(String)` |
| `menu/data.ts` | 新建 | 类型/状态选项；表单 schema（`type` RadioGroup + `dependencies:{triggerFields:['type']}` 联动显隐：path/icon/component[1,2]、component_name[2]、permission[2,3]、visible/always_show[1,2]、keep_alive[2]）；`parent_id` `ApiTreeSelect` 经 `afterFetch` 包 `buildMenuTree` + 根目录节点（id:0）；列定义含 `#name` slot + 类型/状态 `CellTag` |
| `menu/index.vue` | 重写 | `defineOptions({name:'SystemMenu'})`；tree-grid `treeConfig:{parentField:'parentId', rowField:'id', transform:true}`，`pagerConfig.enabled:false`，proxy 返回 `{items, total}`；`#name` slot 渲染 `IconifyIcon` + name |
| `menu/modules/form.vue` | 新建 | 新建/编辑菜单；加载时 camelCase→表单（`always_show=data.alwaysShow` 等），提交时表单→snake_case `MenuPayload` |

> 三个 `index.vue` 的 `defineOptions({name})` 保持 `SystemUser / SystemRole / SystemMenu`，与后端动态路由 `componentName` 对应，是后端模式动态路由能正确加载这些视图的关键。

## 四、关键设计点

### 1. 动态路由复用

后端 `permission-info` 已返回「系统管理」目录及其下的用户/角色/菜单菜单项（`component` 形如 `system/user/index` 等）。需求1 已实现的 `transformBackendMenusToRoutes`（`api/core/permission.ts`）将其映射到 `views/system/{user,role,menu}/index.vue`。**本次只需创建/重写视图组件即可被动态路由加载**，无需新增前端静态路由模块（避免与后端菜单在 mixed 模式下按 name 合并冲突）。

### 2. vxe-grid 代理与分页适配

- 用户/角色页：`proxyConfig.ajax.query` 将 `{page:{currentPage,pageSize}, formValues}` 映射为 `{page, per_page, ...filters}`，返回 `{items, total}`；`pagerConfig` 默认每页 10（角色）/ 15（用户）。
- 菜单页：树表 `treeConfig:{parentField:'parentId', rowField:'id', transform:true}`，`pagerConfig.enabled:false`，proxy 仍返回 `{items, total}`。
- 搜索表单 `submitOnChange` 即时查询。

### 3. antd Tree 勾选语义（角色菜单分配）

antd Vue 的 `Tree` checkable 模式下，父节点勾选会级联覆盖子节点。为此：
- **回显**：`computeCheckedLeaves` 只把「已分配的叶子节点」设为 `checkedKeys`，由 antd 自动推导父级半选/全选，避免父级级联勾选全部子级。
- **提交**：`computeSaveIds` 取「所有被勾选的叶子 + 其全部祖先」，**不依赖 antd 的 `halfChecked`**，保证用户未交互直接保存也不丢失父级菜单。
- `onCheck` 入参兼容 `Array<number|string>` 与 `{checked, halfChecked}` 两种形态，统一 `.map(Number)`。

### 4. 菜单表单字段双向转换

菜单列表/详情为 camelCase，提交体为 snake_case。`menu/modules/form.vue` 在 `onOpenChange` 回填时做 `alwaysShow→always_show`、`componentName→component_name`、`keepAlive→keep_alive`、`parentId→parent_id` 等映射；提交时反向构造 `MenuPayload`。`type` 用 `RadioGroup` 联动，按钮类型（3）只保留 `name/permission/parent_id/sort/status`。

### 5. 按钮级权限

- 工具栏「新增」与操作列各按钮均用 `v-access:code="['...']"` 指令；`CellOperation` 的 `show: () => hasAccessByCodes([...])` 控制行操作显隐。
- superadmin（`permissions:["*"]`）经需求1 的 `hasAccessByCodes` 通配放行，全部可见。
- 实测 `test1/admin` 拥有 `system:user:*` 与 `system:permission:assign-user-role`，但缺 `system:role:query / system:menu:query`，故其角色/菜单列表请求会 403（由 `errorMessageResponseInterceptor` 提示），对应按钮按 `v-access` 隐藏——权限边界正确收敛。

## 五、验证结果

| 验证项 | 结果 |
| --- | --- |
| `vue-tsc --noEmit --skipLibCheck`（typecheck） | ✅ 通过，无类型错误 |
| `oxlint`（改动文件） | ✅ 无报错 |
| `eslint`（改动文件） | ✅ exit 0（仅 `.eslintignore` 弃用警告，与本改动无关） |
| `oxfmt --check`（改动文件） | ✅ 格式正确 |
| `stylelint`（改动 .vue） | ✅ 无报错（且改动均无 `<style>` 块，全用 Tailwind 工具类） |
| 后端契约 curl 实测（superadmin 登录 → users/roles/menus 列表与 simple-list、role-menus、user-roles） | ✅ 字段命名 / 分页结构 / 查询参数大小写均与「二、接口契约」一致 |
| `getRoleList` 运行时回归 | ✅ 实测发现并修复：`/roles` 的 `data`/`meta` 为并列字段，默认 `responseReturn:'data'` 会丢 `meta.total` 导致列表空、总数 0；已改用 `responseReturn:'body'`，修复后 typecheck/lint/oxfmt 均通过 |
| dev 启动 / 浏览器端到端点击流 | ⏳ 未执行（无浏览器环境） |

> curl 实测仅做 GET 只读校验；三个 `assign-*` POST 端点的请求体大小写依据 `auth-role.doc` 文档（snake_case：`role_id / menu_ids / user_id / role_ids / data_scope / data_scope_dept_ids`），未在共享后端做写操作联调。

> 说明：本项目 `pnpm lint` 实际运行 **oxfmt + oxlint + eslint + stylelint**（经 `vsh lint`），**不含 prettier**——`CLAUDE.md` 的「代码质量」段列出 Prettier 为误导信息，oxfmt 才是格式化真源（`internal/lint-configs/oxfmt-config/src/index.ts`：`printWidth:80, semi:true, singleQuote:true, trailingComma:'all'`）。

## 六、使用方式

1. 确保后端服务 `http://49.235.53.53:9001` 可达（dev 代理已配置）。
2. **清空浏览器 localStorage**（accessStore 持久化缓存了旧 accessMode/enableRefreshToken，不清缓存新配置不生效）。
3. `pnpm dev:antd` 启动前端。
4. 登录：
   - `superadmin / 123456`（Super Admin）：可见并操作用户/角色/菜单管理全部功能，含菜单分配、数据权限。
   - `test1 / 111111`（admin 角色）：可见系统管理菜单；用户管理页可列表/搜索/新增/编辑/删除/重置密码/分配角色；角色/菜单管理页因缺 `query` 权限，列表 403 且按钮按 `v-access` 隐藏。
5. 用户管理：顶部「新增用户」打开表单；操作列「编辑」回填、「重置密码」弹窗输入新密码、「分配角色」弹窗多选角色（回显已分配）、「删除」带二次确认。
6. 角色管理：「新增角色」；操作列「编辑」、「菜单分配」（树勾选，保存提交叶子+祖先 id 集合）、「数据权限」（选数据范围，=自定义部门时输入部门 id）、「删除」（系统内置角色不可删）。
7. 菜单管理：tree-grid 展示；「新增菜单」选类型（目录/菜单/按钮）联动显隐字段，父级用 TreeSelect（含「根目录」）；操作列「编辑」、「删除」。

## 七、未执行项

- **dev 启动 / 浏览器端到端点击流**未执行（当前环境无浏览器），静态校验（typecheck + 全套 lint + oxfmt）与后端契约 curl 实测均已通过。建议在浏览器中以 superadmin 与 test1 分别走一遍上述「六、使用方式」流程做最终确认。
- 「需求2（执行结果记录到 `.requirements/develop/permission.md`）」依据 task.txt「忽略以下所有需求描述」指令，未执行；本结果改为记录在 `auth-permission-2.md`。
- 未新增前端静态路由模块（`router/routes/modules/system.ts`），因后端 `permission-info` 已提供动态菜单，动态路由由后端菜单驱动即可。
- 未重构自服务 profile 页（`views/_core/profile`）；`user.ts` 中 `getUserProfile / updateUserProfile / changeUserPassword` 已导出备用，如需后续接入可在此基础上完成。
