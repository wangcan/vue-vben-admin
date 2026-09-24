<script lang="ts" setup>
import type { RoleApi } from '#/api';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { assignRoleDataScope, dataScopeOptions } from '#/api';

defineOptions({ name: 'RoleDataScopeModal' });

const emit = defineEmits(['success']);

const formData = ref<RoleApi.RoleListItem>();

const getTitle = computed(() =>
  formData.value ? `数据权限 - ${formData.value.name}` : '数据权限',
);

const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  schema: [
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: dataScopeOptions,
        optionType: 'button',
      },
      defaultValue: 1,
      fieldName: 'data_scope',
      label: '数据范围',
    },
    {
      component: 'Select',
      componentProps: {
        mode: 'tags',
        open: false,
        placeholder: '回车添加部门 id（仅自定义部门时需要）',
        tokenSeparators: [',', '，'],
      },
      dependencies: {
        show: (values) => Number(values.data_scope) === 2,
        triggerFields: ['data_scope'],
      },
      fieldName: 'data_scope_dept_ids',
      label: '自定义部门',
    },
  ],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (!formData.value?.id) return;
    const values = await formApi.getValues();
    const dataScope = Number(values.data_scope);
    const deptIds =
      dataScope === 2
        ? (Array.isArray(values.data_scope_dept_ids)
            ? values.data_scope_dept_ids
            : []
          ).map(Number)
        : undefined;

    modalApi.lock();
    try {
      await assignRoleDataScope({
        data_scope: dataScope,
        data_scope_dept_ids: deptIds,
        role_id: formData.value.id,
      });
      modalApi.close();
      emit('success');
      message.success('数据权限设置成功');
    } catch {
      modalApi.lock(false);
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<RoleApi.RoleListItem>();
      formApi.resetForm();
      formData.value = data;
      if (data) {
        formApi.setValues({
          data_scope: data.dataScope ?? 1,
          data_scope_dept_ids: (data.dataScopeDeptIds ?? []).map(String),
        });
      }
    }
  },
});
</script>

<template>
  <Modal :title="getTitle">
    <Form class="mx-4" />
  </Modal>
</template>
