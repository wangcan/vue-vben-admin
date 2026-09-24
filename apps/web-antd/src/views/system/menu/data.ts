import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { MenuApi } from '#/api';

import { useAccess } from '@vben/access';

import { buildMenuTree, getMenuList } from '#/api';

/** 菜单类型选项（1=目录 2=菜单 3=按钮） */
export const menuTypeOptions = [
  { color: 'processing', label: '目录', value: 1 },
  { color: 'default', label: '菜单', value: 2 },
  { color: 'error', label: '按钮', value: 3 },
];

/** 菜单类型下拉 / Radio 选项 */
export const menuTypeSelectOptions = [
  { label: '目录', value: 1 },
  { label: '菜单', value: 2 },
  { label: '按钮', value: 3 },
];

/** 菜单状态选项（0=启用 1=禁用） */
export const menuStatusOptions = [
  { color: 'success', label: '启用', value: 0 },
  { color: 'error', label: '禁用', value: 1 },
];

/** 新建/编辑菜单表单 schema（字段名为 snake_case，与提交体一致） */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: menuTypeSelectOptions,
        optionType: 'button',
      },
      defaultValue: 2,
      fieldName: 'type',
      label: '类型',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '请输入菜单名称' },
      fieldName: 'name',
      label: '菜单名称',
      rules: 'required',
    },
    {
      component: 'ApiTreeSelect',
      componentProps: {
        allowClear: false,
        api: getMenuList,
        afterFetch: (data: MenuApi.MenuItem[]) => [
          {
            children: buildMenuTree(data),
            id: 0,
            name: '根目录',
            parentId: -1,
          },
        ],
        childrenField: 'children',
        class: 'w-full',
        immediate: true,
        labelField: 'name',
        placeholder: '请选择上级菜单',
        valueField: 'id',
      },
      defaultValue: 0,
      fieldName: 'parent_id',
      label: '上级菜单',
      rules: 'required',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '顶级用 /system，子级用相对路径如 user' },
      dependencies: {
        show: (values) => [1, 2].includes(Number(values.type)),
        triggerFields: ['type'],
      },
      fieldName: 'path',
      label: '路由地址',
    },
    {
      component: 'IconPicker',
      componentProps: { placeholder: '请选择图标' },
      dependencies: {
        show: (values) => [1, 2].includes(Number(values.type)),
        triggerFields: ['type'],
      },
      fieldName: 'icon',
      label: '图标',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '如 system/user/index' },
      dependencies: {
        show: (values) => [1, 2].includes(Number(values.type)),
        triggerFields: ['type'],
      },
      fieldName: 'component',
      label: '组件路径',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '如 SystemUser' },
      dependencies: {
        show: (values) => Number(values.type) === 2,
        triggerFields: ['type'],
      },
      fieldName: 'component_name',
      label: '组件名称',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '如 system:user:list' },
      dependencies: {
        show: (values) => [2, 3].includes(Number(values.type)),
        triggerFields: ['type'],
      },
      fieldName: 'permission',
      label: '权限标识',
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
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: [
          { label: '启用', value: 0 },
          { label: '禁用', value: 1 },
        ],
        optionType: 'button',
      },
      defaultValue: 0,
      fieldName: 'status',
      label: '状态',
    },
    {
      component: 'Switch',
      defaultValue: true,
      dependencies: {
        show: (values) => [1, 2].includes(Number(values.type)),
        triggerFields: ['type'],
      },
      fieldName: 'visible',
      label: '是否显示',
    },
    {
      component: 'Switch',
      defaultValue: true,
      dependencies: {
        show: (values) => Number(values.type) === 2,
        triggerFields: ['type'],
      },
      fieldName: 'keep_alive',
      label: '缓存路由',
    },
    {
      component: 'Switch',
      defaultValue: true,
      dependencies: {
        show: (values) => [1, 2].includes(Number(values.type)),
        triggerFields: ['type'],
      },
      fieldName: 'always_show',
      label: '始终显示',
    },
  ];
}

/** 列定义 */
export function useColumns<T = MenuApi.MenuItem>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridColumns<T> {
  const { hasAccessByCodes } = useAccess();
  return [
    {
      align: 'left',
      field: 'name',
      fixed: 'left',
      slots: { default: 'name' },
      title: '菜单名称',
      treeNode: true,
      width: 240,
    },
    {
      cellRender: { name: 'CellTag', options: menuTypeOptions },
      field: 'type',
      title: '类型',
      width: 90,
    },
    {
      field: 'permission',
      title: '权限标识',
      width: 200,
      formatter: ({ row }) => (row as MenuApi.MenuItem).permission || '-',
    },
    {
      field: 'path',
      title: '路由地址',
      width: 180,
      formatter: ({ row }) => (row as MenuApi.MenuItem).path || '-',
    },
    {
      field: 'component',
      title: '组件',
      width: 180,
      formatter: ({ row }) => (row as MenuApi.MenuItem).component || '-',
    },
    {
      cellRender: { name: 'CellTag', options: menuStatusOptions },
      field: 'status',
      title: '状态',
      width: 90,
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: '菜单',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'edit',
            show: () => hasAccessByCodes(['system:menu:update']),
            text: '编辑',
          },
          {
            code: 'delete',
            show: () => hasAccessByCodes(['system:menu:delete']),
          },
        ],
      },
      field: 'operation',
      fixed: 'right',
      title: '操作',
      width: 130,
    },
  ];
}
