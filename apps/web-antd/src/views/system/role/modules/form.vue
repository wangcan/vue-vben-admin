<script lang="ts" setup>
import type { RoleApi } from '#/api';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { createRole, updateRole } from '#/api';

import { useFormSchema } from '../data';

defineOptions({ name: 'RoleFormModal' });

const emit = defineEmits(['success']);

const formData = ref<RoleApi.RoleListItem>();

const getTitle = computed(() => (formData.value?.id ? '编辑角色' : '新增角色'));

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

    const payload: RoleApi.RolePayload = {
      code: values.code,
      name: values.name,
      remark: values.remark || undefined,
      sort: Number(values.sort) || 0,
    };

    modalApi.lock();
    try {
      await (formData.value?.id
        ? updateRole(formData.value.id, payload)
        : createRole(payload));
      modalApi.close();
      emit('success');
      message.success(formData.value?.id ? '修改成功' : '新增成功');
    } catch {
      modalApi.lock(false);
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<RoleApi.RoleListItem>();
      formApi.resetForm();
      if (data) {
        formData.value = data;
        formApi.setValues({
          code: data.code,
          name: data.name,
          remark: data.remark ?? '',
          sort: data.sort,
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
