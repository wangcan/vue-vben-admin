<script lang="ts" setup>
import type { UploadProps } from 'ant-design-vue';

import type { FigureApi } from '#/api';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { Download, Inbox } from '@vben/icons';

import { Alert, message, Statistic, Upload } from 'ant-design-vue';

import { downloadFigureImportTemplate, importFigures } from '#/api';

defineOptions({ name: 'FigureImportModal' });

const emit = defineEmits(['success']);

const selectedFile = ref<File | undefined>();
const result = ref<FigureApi.ImportResult | undefined>();
const submitting = ref(false);

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (!selectedFile.value) {
      message.warning('请先选择要导入的 Excel 文件');
      return;
    }
    submitting.value = true;
    modalApi.lock();
    try {
      const res = await importFigures(selectedFile.value);
      result.value = res;
      const total = res.created + res.updated + res.skipped + res.failed;
      if (res.failed > 0) {
        message.warning(
          `导入完成：成功 ${total - res.failed} 条，失败 ${res.failed} 条`,
        );
      } else {
        message.success(`导入完成，共处理 ${total} 条`);
      }
      emit('success');
    } catch {
      modalApi.lock(false);
    } finally {
      submitting.value = false;
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      selectedFile.value = undefined;
      result.value = undefined;
    }
  },
});

/**
 * 选中文件时暂存，阻止 Upload 自动上传
 */
const handleBeforeUpload: UploadProps['beforeUpload'] = (file) => {
  // 仅允许 .xlsx / .xls / .csv
  const name = file.name.toLowerCase();
  const ok =
    name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv');
  if (!ok) {
    message.error('仅支持 .xlsx / .xls / .csv 文件');
    return false;
  }
  selectedFile.value = file;
  result.value = undefined;
  return false;
};

function handleRemove() {
  selectedFile.value = undefined;
  result.value = undefined;
  return true;
}

/**
 * 下载导入模板
 */
async function onDownloadTemplate() {
  const hide = message.loading({
    content: '正在下载模板...',
    duration: 0,
    key: 'figure_template_download',
  });
  try {
    const blob = await downloadFigureImportTemplate();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'figures_template.xlsx';
    document.body.append(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    hide();
    message.success({
      content: '模板下载成功',
      key: 'figure_template_download',
    });
  } catch {
    hide();
  }
}
</script>

<template>
  <Modal confirm-text="开始导入" title="Excel 批量导入人物">
    <div class="mx-4 flex flex-col gap-4">
      <Alert
        message="请按模板格式填写后上传，表头为：code, name, aliases, description, dynasty, birth_year, death_year, occupation, birth_place, tags（aliases/tags 为单元格内逗号分隔）"
        type="info"
        show-icon
      />

      <div>
        <a
          class="inline-flex items-center gap-1 text-primary"
          @click="onDownloadTemplate"
        >
          <Download class="size-4" />
          下载导入模板（.xlsx）
        </a>
      </div>

      <Upload.Dragger
        :before-upload="handleBeforeUpload"
        :file-list="[]"
        :max-count="1"
        accept=".xlsx,.xls,.csv"
        :on-remove="handleRemove"
      >
        <div class="flex flex-col items-center py-4">
          <Inbox class="size-10 text-primary" />
          <p class="mt-2 text-sm text-gray-500">点击或拖拽文件到此处上传</p>
          <p class="mt-1 text-xs text-gray-400">
            仅支持 .xlsx / .xls / .csv 文件
          </p>
        </div>
      </Upload.Dragger>

      <div v-if="selectedFile" class="text-sm">
        已选择文件：<span class="font-medium">{{ selectedFile.name }}</span>
      </div>

      <div v-if="result" class="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
        <div class="mb-2 font-medium">导入结果</div>
        <div class="grid grid-cols-4 gap-2 text-center">
          <Statistic title="新增" :value="result.created" />
          <Statistic title="更新" :value="result.updated" />
          <Statistic title="跳过" :value="result.skipped" />
          <Statistic
            title="失败"
            :value="result.failed"
            :value-style="{ color: result.failed > 0 ? '#cf1322' : undefined }"
          />
        </div>
        <div v-if="result.errors && result.errors.length > 0" class="mt-3">
          <div class="mb-1 text-sm text-red-500">失败详情：</div>
          <ul
            class="max-h-40 list-disc overflow-auto pl-5 text-xs text-red-500"
          >
            <li v-for="(err, idx) in result.errors" :key="idx">
              {{ typeof err === 'string' ? err : JSON.stringify(err) }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </Modal>
</template>
