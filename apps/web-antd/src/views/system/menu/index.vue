<script lang="ts" setup>
import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Alert, Button, Card, Space, Table } from 'ant-design-vue';

defineOptions({ name: 'SystemMenu' });

const dataSource = [
  { id: 1, name: '系统管理', path: '/system', type: '目录' },
  { id: 100, name: '用户管理', path: '/system/user', type: '菜单' },
  { id: 1001, name: '用户查询', path: '', type: '按钮' },
];

const columns = computed(() => [
  { title: 'ID', dataIndex: 'id', key: 'id' },
  { title: '菜单名称', dataIndex: 'name', key: 'name' },
  { title: '路由地址', dataIndex: 'path', key: 'path' },
  { title: '类型', dataIndex: 'type', key: 'type' },
]);
</script>

<template>
  <Page
    description="由后端权限菜单树动态生成的路由（/system/menu）"
    title="菜单管理"
  >
    <Alert
      class="mb-4"
      message="本页为动态路由占位页，演示「菜单渲染 + 动态路由 + 按钮级权限」联动。"
      type="info"
      show-icon
    />
    <Card title="操作">
      <Space>
        <Button v-access:code="['system:menu:create']" type="primary">
          新增菜单
        </Button>
        <Button v-access:code="['system:menu:update']">编辑</Button>
        <Button v-access:code="['system:menu:delete']" danger>删除</Button>
      </Space>
    </Card>
    <Card class="mt-4" title="菜单列表">
      <Table :columns="columns" :data-source="dataSource" row-key="id" />
    </Card>
  </Page>
</template>
