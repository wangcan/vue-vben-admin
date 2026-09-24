<script lang="ts" setup>
import type { MenuApi } from '#/api';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { createMenu, updateMenu } from '#/api';

import { useFormSchema } from '../data';

defineOptions({ name: 'MenuFormModal' });

const emit = defineEmits(['success']);

const formData = ref<MenuApi.MenuItem>();

const getTitle = computed(() => (formData.value?.id ? '编辑菜单' : '新增菜单'));

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

    const payload: MenuApi.MenuPayload = {
      always_show: values.always_show,
      component: values.component || undefined,
      component_name: values.component_name || undefined,
      icon: values.icon || undefined,
      keep_alive: values.keep_alive,
      name: values.name,
      parent_id: Number(values.parent_id) || 0,
      path: values.path || undefined,
      permission: values.permission || undefined,
      sort: Number(values.sort) || 0,
      status: Number(values.status),
      type: Number(values.type),
      visible: values.visible,
    };

    modalApi.lock();
    try {
      await (formData.value?.id
        ? updateMenu(formData.value.id, payload)
        : createMenu(payload));
      modalApi.close();
      emit('success');
      message.success(formData.value?.id ? '修改成功' : '新增成功');
    } catch {
      modalApi.lock(false);
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<MenuApi.MenuItem>();
      formApi.resetForm();
      if (data) {
        formData.value = data;
        // 列表/详情为 camelCase，表单字段为 snake_case，此处做映射
        formApi.setValues({
          always_show: data.alwaysShow,
          component: data.component ?? '',
          component_name: data.componentName ?? '',
          icon: data.icon ?? '',
          keep_alive: data.keepAlive,
          name: data.name,
          parent_id: data.parentId,
          path: data.path ?? '',
          permission: data.permission ?? '',
          sort: data.sort,
          status: data.status,
          type: data.type,
          visible: data.visible,
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
