<script lang="ts" setup>
import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Alert, Button, Card, Space, Table } from 'ant-design-vue';

defineOptions({ name: 'SystemUser' });

// 占位数据：真实业务由后端 /user-center/users 提供
const dataSource = [
  {
    id: 1,
    name: 'superadmin',
    email: 'superadmin@example.com',
    roles: 'super_admin',
  },
  { id: 2, name: 'admin', email: 'admin@example.com', roles: 'admin' },
];

const columns = computed(() => [
  { title: 'ID', dataIndex: 'id', key: 'id' },
  { title: '用户名', dataIndex: 'name', key: 'name' },
  { title: '邮箱', dataIndex: 'email', key: 'email' },
  { title: '角色', dataIndex: 'roles', key: 'roles' },
]);
</script>

<template>
  <Page
    description="由后端权限菜单树动态生成的路由（/system/user）"
    title="用户管理"
  >
    <Alert
      class="mb-4"
      message="本页为动态路由占位页，演示「菜单渲染 + 动态路由 + 按钮级权限」联动。"
      type="info"
      show-icon
    />
    <Card title="操作">
      <Space>
        <!-- v-access:code 按钮级权限：无对应权限码的按钮会被指令移除 -->
        <Button v-access:code="['system:user:create']" type="primary">
          新增用户
        </Button>
        <Button v-access:code="['system:user:update']">编辑</Button>
        <Button v-access:code="['system:user:delete']" danger>删除</Button>
        <Button v-access:code="['system:user:update-password']">
          重置密码
        </Button>
      </Space>
    </Card>
    <Card class="mt-4" title="用户列表">
      <Table :columns="columns" :data-source="dataSource" row-key="id" />
    </Card>
  </Page>
</template>
