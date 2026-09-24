import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { RoleApi } from '#/api';

import { useAccess } from '@vben/access';

/** 角色类型选项（1=系统内置 2=自定义） */
export const roleTypeOptions = [
  { color: 'processing', label: '系统内置', value: 1 },
  { color: 'default', label: '自定义', value: 2 },
];

/** 角色状态选项（0=启用 1=禁用） */
export const roleStatusOptions = [
  { color: 'success', label: '启用', value: 0 },
  { color: 'error', label: '禁用', value: 1 },
];

/** 状态下拉选项（搜索用） */
export const roleStatusSelectOptions = [
  { label: '启用', value: 0 },
  { label: '禁用', value: 1 },
];

/** 新建/编辑角色表单 schema */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: { placeholder: '请输入角色显示名' },
      fieldName: 'name',
      label: '角色名称',
      rules: 'required',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '请输入角色 code（唯一）' },
      fieldName: 'code',
      label: '角色编码',
      rules: 'required',
    },
    {
      component: 'InputNumber',
      componentProps: { placeholder: '请输入排序', style: { width: '100%' } },
      defaultValue: 0,
      fieldName: 'sort',
      label: '排序',
      rules: 'required',
    },
    {
      component: 'Textarea',
      componentProps: {
        autoSize: { minRows: 2, maxRows: 4 },
        placeholder: '请输入备注',
      },
      fieldName: 'remark',
      label: '备注',
    },
  ];
}

/** 表格顶部搜索表单 schema */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: { placeholder: '角色名称' },
      fieldName: 'name',
      label: '名称',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '角色编码' },
      fieldName: 'code',
      label: '编码',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: roleStatusSelectOptions,
        placeholder: '请选择状态',
      },
      fieldName: 'status',
      label: '状态',
    },
  ];
}

/** 列定义 */
export function useColumns<T = RoleApi.RoleListItem>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridColumns<T> {
  const { hasAccessByCodes } = useAccess();
  return [
    { field: 'id', title: 'ID', width: 70 },
    { field: 'name', title: '角色名称', width: 140 },
    { field: 'code', title: '编码', width: 150 },
    {
      cellRender: { name: 'CellTag', options: roleTypeOptions },
      field: 'type',
      title: '类型',
      width: 100,
    },
    {
      cellRender: { name: 'CellTag', options: roleStatusOptions },
      field: 'status',
      title: '状态',
      width: 90,
    },
    {
      field: 'remark',
      title: '备注',
      minWidth: 160,
      formatter: ({ row }) => (row as RoleApi.RoleListItem).remark || '-',
    },
    {
      field: 'createdAt',
      title: '创建时间',
      width: 170,
      formatter: ({ row }) => {
        const val = (row as RoleApi.RoleListItem).createdAt;
        if (!val) return '-';
        return String(val).replace('T', ' ').split('+')[0] ?? '-';
      },
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: '角色',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'edit',
            show: () => hasAccessByCodes(['system:role:update']),
            text: '编辑',
          },
          {
            code: 'menu',
            show: () =>
              hasAccessByCodes(['system:permission:assign-role-menu']),
            text: '菜单分配',
          },
          {
            code: 'scope',
            show: () =>
              hasAccessByCodes(['system:permission:assign-role-data-scope']),
            text: '数据权限',
          },
          {
            code: 'delete',
            // 系统内置角色不可删除
            show: (row: RoleApi.RoleListItem) =>
              row.type !== 1 && hasAccessByCodes(['system:role:delete']),
          },
        ],
      },
      field: 'operation',
      fixed: 'right',
      title: '操作',
      width: 240,
    },
  ];
}
