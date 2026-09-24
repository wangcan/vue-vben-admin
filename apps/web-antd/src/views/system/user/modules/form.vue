<script lang="ts" setup>
import type { UserApi } from '#/api';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { createUser, updateUser } from '#/api';

import { useFormSchema } from '../data';

defineOptions({ name: 'UserFormModal' });

const emit = defineEmits(['success']);

const formData = ref<UserApi.UserListItem>();

const getTitle = computed(() => (formData.value?.id ? '编辑用户' : '新增用户'));

const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  schema: useFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;

    const values = await formApi.getValues();

    // 新建时密码必填
    if (!formData.value?.id && !values.password) {
      message.error('请输入密码');
      return;
    }

    const payload: UserApi.UserPayload = {
      avatar: values.avatar || undefined,
      email: values.email || undefined,
      name: values.name,
      nickname: values.nickname || undefined,
      // 修改时密码留空表示不修改
      password: values.password || undefined,
      phone: values.phone,
      roles: Array.isArray(values.roles) ? values.roles : undefined,
      status: values.status,
    };

    modalApi.lock();
    try {
      await (formData.value?.id
        ? updateUser(formData.value.id, payload)
        : createUser(payload));
      modalApi.close();
      emit('success');
      message.success(formData.value?.id ? '修改成功' : '新增成功');
    } catch {
      modalApi.lock(false);
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<UserApi.UserListItem>();
      formApi.resetForm();
      if (data) {
        formData.value = data;
        formApi.setValues({
          avatar: data.avatar ?? '',
          email: data.email ?? '',
          name: data.name,
          nickname: data.nickname ?? '',
          phone: data.phone ?? '',
          roles: (data.roles ?? []).map((r) => r.name),
          status: data.status,
        });
      } else {
        formData.value = undefined;
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
