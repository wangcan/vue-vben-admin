<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { UserApi } from '#/api';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, message, Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteUser, getUserList } from '#/api';
import { $t } from '#/locales';

import { useColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';
import PasswordModal from './modules/password-modal.vue';
import RoleAssignModal from './modules/role-assign-modal.vue';

defineOptions({ name: 'SystemUser' });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [PasswordFormModal, passwordModalApi] = useVbenModal({
  connectedComponent: PasswordModal,
  destroyOnClose: true,
});

const [RoleAssignFormModal, roleAssignModalApi] = useVbenModal({
  connectedComponent: RoleAssignModal,
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
      pageSize: 15,
      pageSizes: [15, 30, 50, 100],
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getUserList({
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
  } as VxeTableGridOptions<UserApi.UserListItem>,
});

function onActionClick({
  code,
  row,
}: OnActionClickParams<UserApi.UserListItem>) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
    case 'password': {
      onResetPassword(row);
      break;
    }
    case 'role': {
      onAssignRole(row);
      break;
    }
  }
}

function onEdit(row: UserApi.UserListItem) {
  formModalApi.setData(row).open();
}

function onCreate() {
  formModalApi.setData(null).open();
}

function onResetPassword(row: UserApi.UserListItem) {
  passwordModalApi.setData(row).open();
}

function onAssignRole(row: UserApi.UserListItem) {
  roleAssignModalApi.setData(row).open();
}

function onDelete(row: UserApi.UserListItem) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
    key: 'action_process_msg',
  });
  deleteUser(row.id)
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
    <PasswordFormModal @success="onRefresh" />
    <RoleAssignFormModal @success="onRefresh" />
    <Grid table-title="用户列表">
      <template #toolbar-tools>
        <Button
          v-access:code="['system:user:create']"
          type="primary"
          @click="onCreate"
        >
          <Plus class="size-5" />
          新增用户
        </Button>
      </template>
      <template #roles="{ row }">
        <div class="flex flex-wrap justify-center gap-1">
          <Tag v-for="r in row.roles" :key="r.id" color="blue">
            {{ r.display_name || r.name }}
          </Tag>
          <span v-if="!row.roles || row.roles.length === 0">-</span>
        </div>
      </template>
    </Grid>
  </Page>
</template>
