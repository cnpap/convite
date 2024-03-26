<script setup lang="ts">
import { Message } from '@arco-design/web-vue';
import {
  IconCalendar,
  IconCaretLeft,
  IconCaretRight,
  IconHome,
} from '@arco-design/web-vue/es/icon';
import {
  confee,
  type MainPage,
  type PaginationOption,
} from '@sia-fl/convite-dev';
import { useRouter, useRoute } from 'vue-router';
import { onMounted } from 'vue';

const route = useRoute();
const router = useRouter();

confee.preTpl;

interface MenuType {
  title: string;
  key: string;
  index?: boolean;
}

interface SubMenuType {
  title: string;
  key: string;
  icon?: string;
  menus: MenuType[];
}

const defaultIndexOptionId = (
  confee.paginationOptions.find(
    (option) => option.name === '搜索页面'
  ) as PaginationOption
).id;
function getPathname(mainCode: string) {
  for (const pagination of confee.paginations) {
    if (
      pagination.groupCode === mainCode &&
      pagination.projectPaginationOptionId === defaultIndexOptionId
    ) {
      return mainCode.replace('-', '') + '/' + pagination.code.replace('-', '');
    }
  }
}

const mainPages = confee.mainPages;
const menus: Array<MenuType | SubMenuType> = [];
mainPages.forEach((page: MainPage) => {
  const pathname = getPathname(page.code);
  if (page.data.menu) {
    const menu = page.data.menu;
    if (menu.parentGroup) {
      let previous: SubMenuType = null as unknown as SubMenuType;
      menu.parentGroup.forEach((parent: any, index: number) => {
        if (index === 0) {
          previous = menus.find(
            (item) => item.key === parent.label
          ) as SubMenuType;
          if (!previous) {
            previous = {
              title: parent.label as string,
              key: parent.label as string,
              icon: parent.icon,
              menus: [],
            };
            menus.push(previous);
          }
        } else {
          const subMenu = previous as SubMenuType;
          let sub = subMenu.menus.find(
            (item) => item.key === parent.label
          ) as SubMenuType;
          if (!sub) {
            sub = {
              title: parent.label as string,
              key: (subMenu.key + '_' + parent.label) as string,
              icon: parent.icon,
              menus: [],
            };
            subMenu.menus.push(sub);
          }
          previous = sub;
        }
      });
      previous.menus.push({
        title: page.name,
        key: pathname || page.code,
        index: Boolean(pathname),
      });
    } else {
      menus.push({
        title: page.name,
        key: pathname || page.code,
        index: Boolean(pathname),
      });
    }
  } else {
    menus.push({
      title: page.name,
      key: pathname || page.code,
      index: Boolean(pathname),
    });
  }
});

const SubMenuDom = `
  <a-sub-menu key="%key%">
    <template #title>
      %icon%
      %title%
    </template>
    %children%
  </a-sub-menu>
`;
const MenuDom = `
  <a-menu-item :disabled="%disabled%" key="%key%">
    %title%
  </a-menu-item>
`;

/**
 * 预先迭代生成菜单代码
 */
function deepMenu(menu: MenuType | SubMenuType) {
  if ((menu as SubMenuType).menus) {
    const subMenu = menu as SubMenuType;
    let children = '';
    subMenu.menus.forEach((sub) => {
      children += deepMenu(sub);
    });
    return SubMenuDom.replace('%key%', subMenu.key)
      .replace('%icon%', subMenu.icon ? '<IconHome />' : '')
      .replace('%title%', subMenu.title)
      .replace('%children%', children);
  } else {
    return MenuDom.replace(
      '%disabled%',
      (menu as MenuType).index ? 'false' : 'true'
    )
      .replace('%key%', menu.key)
      .replace('%key%', menu.key)
      .replace('%title%', menu.title);
  }
}
const menusDom = menus.map((menu) => deepMenu(menu)).join('\n');
console.log(menusDom.substring(0, 0));

confee.preTplEnd;

function onClickMenuItem(key: string) {
  Message.info({ content: `You select ${key}`, showIcon: true });
  router.push(`/main/${key}`);
  ws.send(
    JSON.stringify({
      route: key.replace('/', '-'),
    })
  );
}

function setupWebSocket() {
  const ws = new WebSocket('ws://localhost:3001');

  ws.onopen = () => {
    console.log('WebSocket Client Connected');
    ws.send(
      JSON.stringify({
        route: route.fullPath.replace('/main/', ''),
      })
    );
  };

  ws.onmessage = (message) => {
    console.log('Received:', message.data);
    // 这里处理从服务器接收到的消息
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  ws.onclose = () => {
    console.log('WebSocket connection closed');
  };

  return ws; // 返回WebSocket实例，以便外部可以使用它发送消息或关闭连接
}

const ws = setupWebSocket();
</script>

<template>
  <a-layout class="layout-demo">
    <a-layout-sider collapsible :width="300" breakpoint="xl">
      <div class="logo" />
      <a-menu
        :default-selected-keys="[route.fullPath.replace('/main/', '') || '']"
        :style="{ width: '100%' }"
        @menu-item-click="onClickMenuItem"
      >
        <!--
          <%- menusDom %>
        endTpl-->
      </a-menu>
      <!-- trigger -->
      <template #trigger="{ collapsed }">
        <IconCaretRight v-if="collapsed" />
        <IconCaretLeft v-else />
      </template>
    </a-layout-sider>
    <a-layout>
      <a-layout-header style="padding-left: 20px"> Header </a-layout-header>
      <a-layout style="padding: 0">
        <!--        <a-breadcrumb :style="{ margin: '16px 0' }">-->
        <!--          <a-breadcrumb-item>Home</a-breadcrumb-item>-->
        <!--          <a-breadcrumb-item>List</a-breadcrumb-item>-->
        <!--          <a-breadcrumb-item>App</a-breadcrumb-item>-->
        <!--        </a-breadcrumb>-->
        <!--        <a-layout-content>Content</a-layout-content>-->
        <!--        <a-layout-footer>Footer</a-layout-footer>-->
        <router-view />
      </a-layout>
    </a-layout>
  </a-layout>
</template>

<style scoped>
.layout-demo {
  height: 100vh;
  background: var(--color-fill-2);
  border: 1px solid var(--color-border);
}
.layout-demo :deep(.arco-layout-sider) .logo {
  height: 32px;
  margin: 12px 8px;
  background: rgba(255, 255, 255, 0.2);
}
.layout-demo :deep(.arco-layout-sider-light) .logo {
  background: var(--color-fill-2);
}
.layout-demo :deep(.arco-layout-header) {
  height: 64px;
  line-height: 64px;
  background: var(--color-bg-3);
}
.layout-demo :deep(.arco-layout-footer) {
  height: 48px;
  color: var(--color-text-2);
  font-weight: 400;
  font-size: 14px;
  line-height: 48px;
}
.layout-demo :deep(.arco-layout-content) {
  color: var(--color-text-2);
  font-weight: 400;
  font-size: 14px;
  background: var(--color-bg-3);
}
.layout-demo :deep(.arco-layout-footer),
.layout-demo :deep(.arco-layout-content) {
  display: flex;
  flex-direction: column;
  justify-content: center;
  color: var(--color-white);
  font-size: 16px;
  font-stretch: condensed;
  text-align: center;
}
</style>
