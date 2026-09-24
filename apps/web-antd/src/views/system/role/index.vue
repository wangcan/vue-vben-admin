<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { RoleApi } from '#/api';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteRole, getRoleList } from '#/api';
import { $t } from '#/locales';

import { useColumns, useGridFormSchema } from './data';
import DataScopeModal from './modules/data-scope-modal.vue';
import Form from './modules/form.vue';
import MenuAssignModal from './modules/menu-assign-modal.vue';

defineOptions({ name: 'SystemRole' });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [MenuAssignFormModal, menuAssignModalApi] = useVbenModal({
  connectedComponent: MenuAssignModal,
  destroyOnClose: true,
});

const [DataScopeFormModal, dataScopeModalApi] = useVbenModal({
  connectedComponent: DataScopeModal,
  destroyOnClose: true,
});

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
    submitOnChange: true,
    submitOnEnter: true,
  },
  gridOptions: {
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    pagerConfig: {
      pageSize: 10,
      pageSizes: [10, 20, 30, 50],
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getRoleList({
            page: page.currentPage,
            per_page: page.pageSize,
            ...formValues,
          });
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
      search: true,
      zoom: true,
    },
  } as VxeTableGridOptions<RoleApi.RoleListItem>,
});

function onActionClick({
  code,
  row,
}: OnActionClickParams<RoleApi.RoleListItem>) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
    case 'menu': {
      onAssignMenu(row);
      break;
    }
    case 'scope': {
      onAssignDataScope(row);
      break;
    }
  }
}

function onEdit(row: RoleApi.RoleListItem) {
  formModalApi.setData(row).open();
}

function onCreate() {
  formModalApi.setData(null).open();
}

function onAssignMenu(row: RoleApi.RoleListItem) {
  menuAssignModalApi.setData(row).open();
}

function onAssignDataScope(row: RoleApi.RoleListItem) {
  dataScopeModalApi.setData(row).open();
}

function onDelete(row: RoleApi.RoleListItem) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
    key: 'action_process_msg',
  });
  deleteRole(row.id)
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
    <MenuAssignFormModal @success="onRefresh" />
    <DataScopeFormModal @success="onRefresh" />
    <Grid table-title="角色列表">
      <template #toolbar-tools>
        <Button
          v-access:code="['system:role:create']"
          type="primary"
          @click="onCreate"
        >
          <Plus class="size-5" />
          新增角色
        </Button>
      </template>
    </Grid>
  </Page>
</template>
