<script lang="ts" setup>
import type { UserApi } from '#/api';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { assignUserRoles, getRoleSimpleList, getUserRoleIds } from '#/api';

defineOptions({ name: 'UserRoleAssignModal' });

const emit = defineEmits(['success']);

const formData = ref<UserApi.UserListItem>();

const getTitle = computed(() =>
  formData.value ? `分配角色 - ${formData.value.name}` : '分配角色',
);

const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  schema: [
    {
      component: 'ApiSelect',
      componentProps: {
        api: getRoleSimpleList,
        immediate: true,
        labelField: 'name',
        mode: 'multiple',
        placeholder: '请选择角色（全量同步）',
        valueField: 'id',
      },
      fieldName: 'role_ids',
      label: '角色',
    },
  ],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (!formData.value?.id) return;
    const values = await formApi.getValues();
    modalApi.lock();
    try {
      await assignUserRoles({
        role_ids: Array.isArray(values.role_ids) ? values.role_ids : [],
        user_id: formData.value.id,
      });
      modalApi.close();
      emit('success');
      message.success('角色分配成功');
    } catch {
      modalApi.lock(false);
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<UserApi.UserListItem>();
      formApi.resetForm();
      formData.value = data;
      if (data?.id) {
        getUserRoleIds(data.id)
          .then((ids) => {
            formApi.setValues({ role_ids: ids });
          })
          .catch(() => {});
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
