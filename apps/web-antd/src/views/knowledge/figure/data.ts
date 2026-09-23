import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { FigureApi } from '#/api';

/** 人物状态选项 */
export const figureStatusOptions = [
  { color: 'success', label: '启用', value: 'enabled' },
  { color: 'error', label: '禁用', value: 'disabled' },
];

/** 状态下拉选项（搜索表单使用） */
export const figureStatusSelectOptions = [
  { label: '启用', value: 'enabled' },
  { label: '禁用', value: 'disabled' },
];

/** 新建/编辑表单 schema */
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: { placeholder: '请输入人物唯一编码' },
      fieldName: 'code',
      label: '人物编码',
      rules: 'required',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '请输入姓名' },
      fieldName: 'name',
      label: '姓名',
      rules: 'required',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        mode: 'tags',
        open: false,
        placeholder: '回车添加，如：字太白',
        tokenSeparators: [',', '，'],
      },
      fieldName: 'aliases',
      label: '别名/字/号',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '请输入朝代' },
      fieldName: 'dynasty',
      label: '朝代',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '请输入职业/身份' },
      fieldName: 'occupation',
      label: '职业/身份',
    },
    {
      component: 'InputNumber',
      componentProps: { placeholder: '生年', style: { width: '100%' } },
      fieldName: 'birth_year',
      label: '生年',
    },
    {
      component: 'InputNumber',
      componentProps: { placeholder: '卒年', style: { width: '100%' } },
      fieldName: 'death_year',
      label: '卒年',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '请输入籍贯/出生地' },
      fieldName: 'birth_place',
      label: '籍贯',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        mode: 'tags',
        open: false,
        placeholder: '回车添加，如：诗人',
        tokenSeparators: [',', '，'],
      },
      fieldName: 'tags',
      label: '标签',
    },
    {
      component: 'Textarea',
      componentProps: {
        autoSize: { minRows: 3, maxRows: 6 },
        placeholder: '请输入 JSON 扩展字段，如：{"courtesy_name":"太白"}',
      },
      fieldName: 'attributes',
      label: '扩展属性',
    },
    {
      component: 'Textarea',
      componentProps: {
        autoSize: { minRows: 3, maxRows: 8 },
        placeholder: '请输入简介/传记',
      },
      fieldName: 'description',
      label: '简介',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: figureStatusSelectOptions,
        optionType: 'button',
      },
      defaultValue: 'enabled',
      fieldName: 'status',
      label: '状态',
    },
  ];
}

/** 表格顶部搜索表单 schema */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: { placeholder: '关键字（姓名/简介/编码）' },
      fieldName: 'keyword',
      label: '关键字',
    },
    {
      component: 'Input',
      fieldName: 'code',
      label: '编码',
    },
    {
      component: 'Input',
      fieldName: 'name',
      label: '姓名',
    },
    {
      component: 'Input',
      fieldName: 'dynasty',
      label: '朝代',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: figureStatusSelectOptions,
        placeholder: '请选择状态',
      },
      fieldName: 'status',
      label: '状态',
    },
  ];
}

/** 列定义 */
export function useColumns<T = FigureApi.Figure>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridColumns<T> {
  return [
    {
      field: 'code',
      title: '编码',
      width: 150,
    },
    {
      field: 'name',
      title: '姓名',
      width: 120,
    },
    {
      field: 'aliases',
      title: '别名',
      width: 160,
      formatter: ({ row }) => {
        const val = (row as FigureApi.Figure).aliases;
        return Array.isArray(val) && val.length > 0 ? val.join('、') : '-';
      },
    },
    {
      field: 'dynasty',
      title: '朝代',
      width: 100,
    },
    {
      field: 'occupation',
      title: '职业',
      width: 120,
    },
    {
      field: 'birth_year',
      title: '生卒年',
      width: 120,
      formatter: ({ row }) => {
        const r = row as FigureApi.Figure;
        const birth = r.birth_year ?? '';
        const death = r.death_year ?? '';
        if (!birth && !death) return '-';
        return `${birth} - ${death}`;
      },
    },
    {
      cellRender: { name: 'CellTags' },
      field: 'tags',
      title: '标签',
      minWidth: 160,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: figureStatusOptions,
      },
      field: 'status',
      title: '状态',
      width: 90,
    },
    {
      field: 'created_at',
      title: '创建时间',
      width: 170,
      formatter: ({ row }) => {
        const val = (row as FigureApi.Figure).created_at;
        if (!val) return '-';
        // 2026-09-16T05:27:53.000000Z -> 2026-09-16 05:27:53
        return String(val).replace('T', ' ').split('.')[0] ?? '-';
      },
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: '人物',
          onClick: onActionClick,
        },
        name: 'CellOperation',
      },
      field: 'operation',
      fixed: 'right',
      title: '操作',
      width: 130,
    },
  ];
}
