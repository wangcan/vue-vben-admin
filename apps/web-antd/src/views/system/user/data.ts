import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { UserApi } from '#/api';

import { useAccess } from '@vben/access';

import { getRoleSimpleList } from '#/api';

/** 用户状态选项（CellTag 用） */
export const userStatusOptions = [
  { color: 'success', label: '启用', value: 'active' },
  { color: 'warning', label: '禁用', value: 'inactive' },
  { color: 'error', label: '封禁', value: 'banned' },
];

/** 状态下拉选项（搜索 / 表单用） */
export const userStatusSelectOptions = [
  { label: '启用', value: 'active' },
  { label: '禁用', value: 'inactive' },
  { label: '封禁', value: 'banned' },
];

/** 新建/编辑用户表单 schema */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: { placeholder: '请输入用户名' },
      fieldName: 'name',
      label: '用户名',
      rules: 'required',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '请输入手机号' },
      fieldName: 'phone',
      label: '手机号',
      rules: 'required',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '请输入邮箱（唯一）' },
      fieldName: 'email',
      label: '邮箱',
    },
    {
      component: 'InputPassword',
      componentProps: {
        autocomplete: 'new-password',
        placeholder: '新建必填，修改留空表示不修改',
      },
      fieldName: 'password',
      label: '密码',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: userStatusSelectOptions,
        optionType: 'button',
      },
      defaultValue: 'active',
      fieldName: 'status',
      label: '状态',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '请输入昵称' },
      fieldName: 'nickname',
      label: '昵称',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '头像 URL' },
      fieldName: 'avatar',
      label: '头像',
    },
    {
      component: 'ApiSelect',
      componentProps: {
        api: getRoleSimpleList,
        immediate: true,
        labelField: 'name',
        mode: 'multiple',
        placeholder: '请选择角色（按角色 code 分配）',
        valueField: 'code',
      },
      fieldName: 'roles',
      label: '角色',
    },
  ];
}

/** 表格顶部搜索表单 schema */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: { placeholder: '用户名 / 邮箱 / 手机号' },
      fieldName: 'search',
      label: '关键字',
    },
    {
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getRoleSimpleList,
        immediate: true,
        labelField: 'name',
        placeholder: '请选择角色',
        valueField: 'code',
      },
      fieldName: 'role',
      label: '角色',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: userStatusSelectOptions,
        placeholder: '请选择状态',
      },
      fieldName: 'status',
      label: '状态',
    },
  ];
}

/** 列定义 */
export function useColumns<T = UserApi.UserListItem>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridColumns<T> {
  const { hasAccessByCodes } = useAccess();
  return [
    { field: 'id', title: 'ID', width: 70 },
    { field: 'name', title: '用户名', width: 120 },
    { field: 'nickname', title: '昵称', width: 120 },
    { field: 'phone', title: '手机号', width: 130 },
    { field: 'email', title: '邮箱', width: 180 },
    {
      field: 'roles',
      slots: { default: 'roles' },
      title: '角色',
      minWidth: 160,
    },
    {
      cellRender: { name: 'CellTag', options: userStatusOptions },
      field: 'status',
      title: '状态',
      width: 90,
    },
    {
      field: 'created_at',
      title: '创建时间',
      width: 170,
      formatter: ({ row }) => {
        const val = (row as UserApi.UserListItem).created_at;
        if (!val) return '-';
        return String(val).replace('T', ' ').split('.')[0] ?? '-';
      },
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: '用户',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'edit',
            show: () => hasAccessByCodes(['system:user:update']),
            text: '编辑',
          },
          {
            code: 'password',
            show: () => hasAccessByCodes(['system:user:update-password']),
            text: '重置密码',
          },
          {
            code: 'role',
            show: () =>
              hasAccessByCodes(['system:permission:assign-user-role']),
            text: '分配角色',
          },
          {
            code: 'delete',
            show: () => hasAccessByCodes(['system:user:delete']),
          },
        ],
      },
      field: 'operation',
      fixed: 'right',
      title: '操作',
      width: 220,
    },
  ];
}
