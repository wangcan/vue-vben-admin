<script lang="ts" setup>
import { computed } from 'vue';

import { Page } from '@vben/common-ui';

import { Alert, Button, Card, Space, Table } from 'ant-design-vue';

defineOptions({ name: 'SystemRole' });

const dataSource = [
  { id: 1, name: '超级管理员', code: 'super_admin', remark: '拥有全部权限' },
  { id: 2, name: '管理员', code: 'admin', remark: '部分权限' },
];

const columns = computed(() => [
  { title: 'ID', dataIndex: 'id', key: 'id' },
  { title: '角色名称', dataIndex: 'name', key: 'name' },
  { title: '角色编码', dataIndex: 'code', key: 'code' },
  { title: '备注', dataIndex: 'remark', key: 'remark' },
]);
</script>

<template>
  <Page
    description="由后端权限菜单树动态生成的路由（/system/role）"
    title="角色管理"
  >
    <Alert
      class="mb-4"
      message="本页为动态路由占位页，演示「菜单渲染 + 动态路由 + 按钮级权限」联动。"
      type="info"
      show-icon
    />
    <Card title="操作">
      <Space>
        <Button v-access:code="['system:role:create']" type="primary">
          新增角色
        </Button>
        <Button v-access:code="['system:role:update']">编辑</Button>
        <Button v-access:code="['system:role:delete']" danger>删除</Button>
        <Button v-access:code="['system:permission:assign-role-menu']">
          菜单分配
        </Button>
        <Button v-access:code="['system:permission:assign-role-data-scope']">
          数据权限
        </Button>
      </Space>
    </Card>
    <Card class="mt-4" title="角色列表">
      <Table :columns="columns" :data-source="dataSource" row-key="id" />
    </Card>
  </Page>
</template>
