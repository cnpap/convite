// noinspection JSUnusedGlobalSymbols

import type { PluginOption } from 'vite';
import { fetchAndSaveConfig } from './fetch';
import {
  ConfeeData,
  MainPage,
  Pagination,
  PaginationDetail,
  Template,
} from './type';
import { tplCallbable, tplCodeRefining } from './util/tpl';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import * as signale from 'signale';
import * as fs from 'fs';

/**
 * 全局变量，用以开发的 websocket 服务是否启动
 */
global.__viteConfeeWsStarted = global.__viteConfeeWsStarted || false;
/**
 * 记录动态的 url
 */
global.__viteCurrentUrl = global.__viteCurrentUrl || '';
/**
 * 记录 url 对应所需更新的模块
 */
global.__viteHotModuleByRoute = global.__viteHotModuleByRoute || [];
/**
 * 记录初始启动时的配置
 */
global.__viteConfeeData = global.__viteConfeeData || null;
/**
 * 记录所有分页详情
 */
global.__vitePaginationDetails = global.__vitePaginationDetails || [];
/**
 * 记录所有模块
 */
global.__mods = global.__mods || [];

/**
 * 将主页与分页的关系进行默认处理
 *
 * @param mainPage
 * @param pagination
 */
async function defaultMake(mainPage: MainPage, pagination: Pagination) {
  return {
    url: `${mainPage.code.replace('-', '')}/${pagination.code?.replace(
      '-',
      ''
    )}`,
    mod: `${mainPage.code}-${pagination.code}`,
    codes: [mainPage.code, pagination.code],
  };
}

type MakeResult = ReturnType<typeof defaultMake>;

export interface ConfeePluginOptions {
  /**
   * 是否缓存文件
   */
  cache?: boolean;
  /**
   * Confee 请求路径，暂时为内网路径，以后可能用以区分内外网及不同服务区
   */
  url: string;
  /**
   * 当前项目
   */
  projectId: string;
  /**
   * 模块后缀，默认为 tsx，大多情况下无需理会
   * 举例：vue 如果文件尾椎不是 vue 则会影响前后 vue 插件解析不执行
   */
  modSuffix?: string;
  /**
   * 传递每一个模板文件分别对应哪个分页选项
   */
  templates: Template[];
  /**
   * 用以解析 mainPage、pagination 关系的函数
   */
  make?: (mainPage: MainPage, pagination: Pagination) => Promise<MakeResult>;
  /**
   * 很多模板页面，可能会用到一些通用的预计算
   * 这里可以传递一个函数，在插件执行的最开始调用这个函数，然后我们可以先与计算一些变量，然后在模板中使用
   *
   * 这里设置为必须添加，告诉使用者这个参数很重要，且确实基本所有项目都应该有使用需求
   *
   * 第一个参数是配置集合，第二个参数是所有的分页详情
   */
  computed: (confee: ConfeeData, paginationDetails: PaginationDetail[]) => void;
  /**
   * 开发服务器配置信息
   */
  devServer?: {
    open?: boolean;
    host?: string;
    port?: number;
  };
  /**
   * 我们要拦截哪些 id
   */
  idsResolve: Record<
    string,
    (id: string) => {
      paginationOptionName?: string;
    } | void
  >;
}

/**
 * 全局用到的配置文件对象
 */
let confeeData: ConfeeData = null as unknown as ConfeeData;
/**
 * 所有分页对应的 mods
 */
let mods: string[] = [];
/**
 * 所有需要解析的 id
 */
let resolveIds: string[] = [];
/**
 * 分页关系与所有有关数据的记录
 */
let paginationDetails: PaginationDetail[] = [];

const nullTemplate = (id: string) => {
  if (id.endsWith('.vue')) {
    return `\
<template>
    ${id}
</template>
<script lang="ts" setup></script>
<script lang="ts">
export default {
  name: '${id}'
};
</script>
`;
  } else if (id.endsWith('.tsx')) {
    return `\
export default function () {
    return <div>${id}</div>
}`;
  }
};

export const confeePlugin: (options: ConfeePluginOptions) => PluginOption[] = (
  options
) => [
  {
    name: 'convite',
    async config() {
      resolveIds = Object.keys(options.idsResolve);

      if (global.__viteConfeeData) {
        confeeData = global.__viteConfeeData;
        mods = global.__mods;
        paginationDetails = global.__vitePaginationDetails;

        return;
      }

      /**
       * 开始准备数据，对数据进行预处理，主要是确定分页和模板的关系以及为分页补充数据
       */
      confeeData = await fetchAndSaveConfig(options);
      confeeData.computed = {
        hotModuleByRoute: {},
      };

      /**
       * 将 <分页选项，模板文件> 通过名称对应起来
       */
      for (const template of options.templates) {
        const paginationOption = confeeData.paginationOptions.find(
          (p) => p.name === template.paginationOptionName
        );
        if (!paginationOption)
          throw new Error(
            `Cannot find pagination option with name ${template.paginationOptionName}`
          );

        /**
         * 获取所有 分页 和 模板文件 通过 《分页选项id》 关联
         *
         * 每一个分页都有一个分页选项 id
         * 而模板已经在上一步与分页选项对应起来了
         */
        const paginations = confeeData.paginations.filter(
          (p) => p.projectPaginationOptionId === paginationOption?.id
        );

        /**
         * 如果有模板文件，则预先读取出来
         */
        if (!template.content && template.pathname) {
          template.content = fs.readFileSync(template.pathname, 'utf-8');
        }

        /**
         * 将主页与分页进行关联，并记录一系列可用信息
         */
        for (const pagination of paginations) {
          const mainPage = confeeData.mainPages.find(
            (p) => p.code === pagination.groupCode
          );
          if (!mainPage) continue;
          // throw new Error(
          //   `Cannot find main page with id ${pagination.groupCode}`
          // );
          /**
           * 模块、路由 所用到的元信息
           */
          const makeResult = await (options.make || defaultMake)(
            mainPage,
            pagination
          );
          /**
           * mod 一般是 主页 code + 分页 code，比如：suppliers-index
           * 那么如果我通过路由将该文件作为模块引入，那么大概就是
           *
           * - suppliers-index.tsx
           * - suppliers-index.vue
           *
           * 这个时候我们不能将他变成完整的名称，比如 @sia-fl/suppliers-index.tsx，这里仅将其处理为元信息
           */
          const modName = `${makeResult.mod}.${options.modSuffix || 'tsx'}`;
          mods.push(modName);

          /**
           * 拉去这个分页的所有配置字段
           */
          const paginationFields = confeeData.paginationFields.filter(
            (p) =>
              p.projectTableCode === pagination.projectTableCode &&
              p.projectPaginationCode === pagination.code
          );

          /**
           * 尽可能的记录分页与其他数据的关系
           */
          paginationDetails.push({
            paginationOfMainPageCodes: makeResult.codes,
            modNameOfMainPage: makeResult.mod,
            template,
            mainPage,
            pagination,
            paginationFields,
            paginationOption: paginationOption,
          });
        }
      }

      options.computed(confeeData, Object.values(paginationDetails));

      global.__mods = mods;
      global.__viteConfeeData = confeeData;
      global.__vitePaginationDetails = paginationDetails;
    },
    configureServer(server) {
      /**
       * 不一定要开启 websocket 服务
       */
      if (options.devServer?.open) {
        /**
         * 开启 websocket 服务，实现开发阶段的动态预处理
         */
        if (!global.__viteConfeeWsStarted) {
          global.__viteConfeeWsStarted = true;
          const httpServer = createServer();
          const wss = new WebSocketServer({ server: httpServer });
          wss.on('connection', function connection(ws) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ws.on('message', function message(data: any) {
              const payload = JSON.parse(data);
              /**
               * 判断是否是路由变化，如果是路由变化，那么我们需要重新加载
               * 在加载前，应当计算出当前路由所相关联的所有分页并记录，便于后续明确所需解析的模块
               */
              if (payload.route && payload.route !== global.__viteCurrentUrl) {
                signale.debug('reload event by: ', payload.route);
                /**
                 * 记录活动的 url
                 */
                global.__viteCurrentUrl = payload.route;
                /**
                 * 记录所需热更新的模块
                 */
                global.__viteHotModuleByRoute =
                  confeeData.computed.hotModuleByRoute[payload.route] || [];
                server.restart(false);
              }
            });
          });

          let port = 3001;
          let host = 'localhost';
          if (options.devServer) {
            if (options.devServer.host) {
              host = options.devServer.host;
            }
            if (options.devServer.port) {
              port = options.devServer.port;
            }
          }

          httpServer.listen(port, host);
          console.log('\n');
          signale.success(`WebSocket server listening on ws://${host}:${port}`);
        }
      }
    },
    handleHotUpdate({ file, server }) {
      for (const template of options.templates) {
        file = file.replace(/\//g, '\\');
        if (file === template.pathname) {
          signale.debug('template hot update: ', file);
          server.restart(true);
        }
      }
    },
    resolveId(id) {
      for (const resolveId of resolveIds) {
        if (id.startsWith(resolveId)) return id;
      }
      // if (source.startsWith('@sia-fl/route')) return source;
      // if (source.startsWith('@sia-fl/convite')) return source;
      if (mods.includes(id)) return id;

      if (id.startsWith('@sia-fl/convite')) {
        return id;
      }

      return null;
    },
    load(id) {
      for (const resolveId in options.idsResolve) {
        if (id.startsWith(resolveId)) {
          const { paginationOptionName } =
            options.idsResolve[resolveId](id) || {};
          /**
           * 判断当前分页是否有使用到模板
           * 如果使用到了则返回模板内容
           */
          if (paginationOptionName) {
            /**
             * 首先通过 templateName 找到对应的模板内容
             */
            for (const template of options.templates) {
              if (template.paginationOptionName === paginationOptionName) {
                if (template.pathname) {
                  template.content = fs.readFileSync(
                    template.pathname,
                    'utf-8'
                  );
                }
                const ps = tplCodeRefining(template.content, id);
                return tplCallbable({
                  ...ps,
                  confeeData,
                  globalData: {
                    currentMod: id,
                    currentUrl: global.__viteCurrentUrl,
                    hotModuleByRoute: global.__viteHotModuleByRoute,
                  },
                });
              }
            }
          } else {
            /**
             * 没有使用则返回空
             */
            return nullTemplate(id);
          }
        }
      }
      if (id.startsWith('@sia-fl/convite') || id.includes('@sia-fl_convite')) {
        return `\
export const confee = {}`;
      }
      if (mods.includes(id)) {
        return nullTemplate(id);
      }
      return;
    },
    transform(code, id) {
      /**
       * 正则判断 id 以 .confee.* 结尾，比如 .confee.vue、.confee.tsx
       */
      const names = id.split('.');
      if (
        names[names.length - 2] &&
        names[names.length - 2].endsWith('confee')
      ) {
        /**
         * 判断 code 是否包含 import { confee } from '@sia-fl/convite'，则将 import 中的内容替换为 {}
         * 以避免在生产环境中引入无用代码
         * 使用正则匹配，避免误判
         */
        if (
          /import\s+{[^}]*confee[^}]*}\s+from\s+['"]@sia-fl\/convite['"]/.test(
            code
          )
        ) {
          code = code.replace(
            /import\s+{[^}]*confee[^}]*}\s+from\s+['"]@sia-fl\/convite['"]/,
            ``
          );
        }
        const ps = tplCodeRefining(code, id);
        return tplCallbable({
          ...ps,
          confeeData,
        });
      }
      return code;
    },
  },
];

export default confeePlugin;
