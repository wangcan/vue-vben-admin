<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { MenuApi } from '#/api';

import { Page, useVbenModal } from '@vben/common-ui';
import { IconifyIcon, Plus } from '@vben/icons';

import { Button, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteMenu, getMenuList } from '#/api';
import { $t } from '#/locales';

import { useColumns } from './data';
import Form from './modules/form.vue';

defineOptions({ name: 'SystemMenu' });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    pagerConfig: {
      enabled: false,
    },
    proxyConfig: {
      ajax: {
        query: async () => {
          const menus = await getMenuList();
          return { items: menus, total: menus.length };
        },
      },
    },
    rowConfig: {
      keyField: 'id',
    },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      zoom: true,
    },
    treeConfig: {
      parentField: 'parentId',
      rowField: 'id',
      transform: true,
    },
  } as VxeTableGridOptions<MenuApi.MenuItem>,
});

function onActionClick({ code, row }: OnActionClickParams<MenuApi.MenuItem>) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
  }
}

function onEdit(row: MenuApi.MenuItem) {
  formModalApi.setData(row).open();
}

function onCreate() {
  formModalApi.setData(null).open();
}

function onDelete(row: MenuApi.MenuItem) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
    key: 'action_process_msg',
  });
  deleteMenu(row.id)
    .then(() => {
      message.success({
        content: $t('ui.actionMessage.deleteSuccess', [row.name]),
        key: 'action_process_msg',
      });
      onRefresh();
    })
    .catch(() => {
      hideLoading();
    });
}

function onRefresh() {
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onRefresh" />
    <Grid table-title="菜单列表">
      <template #toolbar-tools>
        <Button
          v-access:code="['system:menu:create']"
          type="primary"
          @click="onCreate"
        >
          <Plus class="size-5" />
          新增菜单
        </Button>
      </template>
      <template #name="{ row }">
        <div class="flex items-center gap-1">
          <IconifyIcon
            v-if="row.icon"
            :icon="row.icon"
            class="size-4 shrink-0"
          />
          <span>{{ row.name }}</span>
        </div>
      </template>
    </Grid>
  </Page>
</template>
