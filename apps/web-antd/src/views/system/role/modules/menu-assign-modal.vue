<script lang="ts" setup>
import type { MenuApi, RoleApi } from '#/api';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message, Spin, Tree } from 'ant-design-vue';

import {
  assignRoleMenus,
  buildMenuTree,
  getMenuList,
  getRoleMenuIds,
} from '#/api';

defineOptions({ name: 'RoleMenuAssignModal' });

const emit = defineEmits(['success']);

const formData = ref<RoleApi.RoleListItem>();
const menuTree = ref<MenuApi.MenuTreeNode[]>([]);
const treeData = ref<Array<{ children?: any[]; key: number; title: string }>>(
  [],
);
const checkedKeys = ref<number[]>([]);
const loading = ref(false);

const getTitle = computed(() =>
  formData.value ? `菜单分配 - ${formData.value.name}` : '菜单分配',
);

/** MenuTreeNode → antd Tree 节点 */
function toTreeNodes(
  nodes: MenuApi.MenuTreeNode[],
): Array<{ children?: any[]; key: number; title: string }> {
  return nodes.map((n) => ({
    children: n.children?.length ? toTreeNodes(n.children) : undefined,
    key: n.id,
    title: n.name,
  }));
}

/**
 * 从已分配 id 列表计算「应设为 checked 的叶子节点」。
 * 仅设叶子，由 antd Tree 级联推导父级半选 / 全选状态，避免父级级联覆盖子级。
 */
function computeCheckedLeaves(
  assignedIds: number[],
  tree: MenuApi.MenuTreeNode[],
): number[] {
  const set = new Set(assignedIds);
  const leaves: number[] = [];
  const walk = (node: MenuApi.MenuTreeNode) => {
    const children = node.children ?? [];
    if (children.length === 0) {
      if (set.has(node.id)) leaves.push(node.id);
    } else {
      for (const c of children) walk(c);
    }
  };
  for (const n of tree) walk(n);
  return leaves;
}

/**
 * 计算提交给后端的菜单 id 集合：所有被勾选的叶子 + 其全部祖先。
 * 不依赖 antd 的 halfChecked 状态，保证未交互直接保存也不丢失父级菜单。
 */
function computeSaveIds(
  checked: number[],
  tree: MenuApi.MenuTreeNode[],
): number[] {
  const leafSet = new Set(checked);
  const result = new Set<number>(checked);
  const walk = (node: MenuApi.MenuTreeNode): boolean => {
    const children = node.children ?? [];
    if (children.length === 0) return leafSet.has(node.id);
    let anyChecked = false;
    for (const c of children) {
      if (walk(c)) anyChecked = true;
    }
    if (anyChecked) result.add(node.id);
    return anyChecked;
  };
  for (const n of tree) walk(n);
  return [...result];
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (!formData.value?.id) return;
    const menu_ids = computeSaveIds(checkedKeys.value, menuTree.value);
    modalApi.lock();
    try {
      await assignRoleMenus({
        menu_ids,
        role_id: formData.value.id,
      });
      modalApi.close();
      emit('success');
      message.success('菜单分配成功');
    } catch {
      modalApi.lock(false);
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<RoleApi.RoleListItem>();
      formData.value = data;
      checkedKeys.value = [];
      if (data?.id) {
        loading.value = true;
        Promise.all([getMenuList(), getRoleMenuIds(data.id)])
          .then(([menus, ids]) => {
            menuTree.value = buildMenuTree(menus);
            treeData.value = toTreeNodes(menuTree.value);
            checkedKeys.value = computeCheckedLeaves(ids, menuTree.value);
          })
          .catch(() => {})
          .finally(() => {
            loading.value = false;
          });
      }
    }
  },
});

function onCheck(
  checked:
    | Array<number | string>
    | {
        checked: Array<number | string>;
        halfChecked: Array<number | string>;
      },
) {
  const keys = Array.isArray(checked) ? checked : checked.checked;
  checkedKeys.value = keys.map(Number);
}
</script>

<template>
  <Modal :title="getTitle">
    <Spin :spinning="loading" class="mx-4 min-h-[200px]">
      <Tree
        checkable
        :checked-keys="checkedKeys"
        :tree-data="treeData"
        default-expand-all
        @check="onCheck"
      />
    </Spin>
  </Modal>
</template>
