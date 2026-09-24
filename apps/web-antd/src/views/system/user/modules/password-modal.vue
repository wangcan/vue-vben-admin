<script lang="ts" setup>
import type { UserApi } from '#/api';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { resetUserPassword } from '#/api';

defineOptions({ name: 'UserPasswordModal' });

const emit = defineEmits(['success']);

const formData = ref<UserApi.UserListItem>();

const getTitle = computed(() =>
  formData.value ? `重置密码 - ${formData.value.name}` : '重置密码',
);

const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  schema: [
    {
      component: 'InputPassword',
      componentProps: {
        autocomplete: 'new-password',
        placeholder: '请输入新密码',
      },
      fieldName: 'password',
      label: '新密码',
      rules: 'required',
    },
    {
      component: 'InputPassword',
      componentProps: {
        autocomplete: 'new-password',
        placeholder: '请再次输入新密码',
      },
      fieldName: 'password_confirmation',
      label: '确认密码',
      rules: 'required',
    },
  ],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;

    const values = await formApi.getValues();
    if (values.password !== values.password_confirmation) {
      message.error('两次输入的密码不一致');
      return;
    }
    if (!formData.value?.id) return;

    modalApi.lock();
    try {
      await resetUserPassword(formData.value.id, values.password);
      modalApi.close();
      emit('success');
      message.success('密码重置成功');
    } catch {
      modalApi.lock(false);
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<UserApi.UserListItem>();
      formApi.resetForm();
      formData.value = data;
    }
  },
});
</script>

<template>
  <Modal :title="getTitle">
    <Form class="mx-4" />
  </Modal>
</template>
