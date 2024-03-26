import { confee, type PaginationOption } from '@sia-fl/convite-dev';
import Main from './Main.confee.vue';

confee.preTpl;

const indexViews: Record<string, string> = {};
const defaultIndexOptionId = (
  confee.paginationOptions.find(
    (option) => option.name === '搜索页面'
  ) as PaginationOption
).id;
confee.mainPages.forEach((mainPage) => {
  const mainCode = mainPage.code;
  confee.paginations.forEach((pagination) => {
    if (
      pagination.groupCode === mainCode &&
      pagination.projectPaginationOptionId === defaultIndexOptionId
    ) {
      indexViews[mainCode.replace('-', '')] = pagination.code.replace('-', '');
    }
  });
});

confee.preTplEnd;

confee.tpl(`
<% for (const indexView in indexViews) { %>
  import <%- indexView + indexViews[indexView] %> from '@sia-fl/route-<%- indexView + '-' + indexViews[indexView] %>.vue'
<% } %>
tplEnd`);

export const routes = [
  {
    path: '/',
    component: Main,
  },
  {
    path: '/main',
    component: Main,
    children: [
      confee.tpl(`
<% for (const indexView in indexViews) { %>
  { path: '/main/<%- indexView + '/' + indexViews[indexView] %>', component: <%- indexView + indexViews[indexView] %> },
<% } %>
tplEnd`),
    ],
  },
];
