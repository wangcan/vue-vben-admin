<script lang="ts" setup>
import type { FigureApi } from '#/api';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { createFigure, updateFigure } from '#/api';

import { useFormSchema } from '../data';

defineOptions({ name: 'FigureFormModal' });

const emit = defineEmits(['success']);

const formData = ref<FigureApi.Figure>();

const getTitle = computed(() => {
  return formData.value?.id ? '编辑人物' : '新增人物';
});

const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  schema: useFormSchema(),
  showDefaultActions: false,
});

/**
 * 将扩展属性对象转换为可编辑的 JSON 字符串
 */
function stringifyAttributes(
  attributes: FigureApi.Figure['attributes'],
): string {
  if (!attributes || typeof attributes !== 'object') return '';
  try {
    return JSON.stringify(attributes, null, 2);
  } catch {
    return '';
  }
}

/**
 * 将表单中的扩展属性字符串解析为对象
 * 解析失败时抛出错误，由调用方捕获。
 */
function parseAttributes(raw: unknown): null | Record<string, any> {
  if (raw === undefined || raw === null || String(raw).trim() === '') {
    return null;
  }
  if (typeof raw === 'object') {
    return raw as Record<string, any>;
  }
  const text = String(raw).trim();
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed;
    }
    throw new Error('扩展属性必须为 JSON 对象');
  } catch (error) {
    throw error instanceof Error ? error : new Error('扩展属性 JSON 格式错误');
  }
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;

    const values = await formApi.getValues();

    // 校验生卒年：death_year 不得早于 birth_year
    const birthYear = Number(values.birth_year);
    const deathYear = Number(values.death_year);
    if (
      !Number.isNaN(birthYear) &&
      !Number.isNaN(deathYear) &&
      birthYear &&
      deathYear &&
      deathYear < birthYear
    ) {
      message.error('卒年不得早于生年');
      return;
    }

    // 解析扩展属性
    let attributes: null | Record<string, any>;
    try {
      attributes = parseAttributes(values.attributes);
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : '扩展属性 JSON 格式错误',
      );
      return;
    }

    const payload = {
      ...values,
      attributes,
      birth_year: values.birth_year ? Number(values.birth_year) : undefined,
      birth_place: values.birth_place || undefined,
      death_year: values.death_year ? Number(values.death_year) : undefined,
      description: values.description || undefined,
      dynasty: values.dynasty || undefined,
      occupation: values.occupation || undefined,
    } as FigureApi.FigurePayload;

    modalApi.lock();
    try {
      await (formData.value?.id
        ? updateFigure(formData.value.id, payload)
        : createFigure(payload));
      modalApi.close();
      emit('success');
      message.success(formData.value?.id ? '修改成功' : '新增成功');
    } catch {
      modalApi.lock(false);
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<FigureApi.Figure>();
      formApi.resetForm();
      if (data) {
        formData.value = data;
        formApi.setValues({
          ...data,
          attributes: stringifyAttributes(data.attributes),
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
