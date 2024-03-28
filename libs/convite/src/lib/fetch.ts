import * as fs from 'fs';
import * as path from 'path';
import got from 'got';
import type { ConfeeResponse } from './type';
import * as process from 'process';
import * as signale from 'signale';
import getNodeModulesPath from './util/module';
import { ConfeePluginOptions } from './plugin';

const node_modules = getNodeModulesPath();
export const confDir = path.join(node_modules, '.confee');
export const confPathname = path.join(confDir, 'config.json');

const CONFEE_ACCESS_TOKEN = (process.env.CONFEE_ACCESS_TOKEN = 'x');

export async function fetchAndSaveConfig({
  url,
  cache,
  projectId,
}: ConfeePluginOptions) {
  if (!CONFEE_ACCESS_TOKEN) {
    throw new Error('CONFEE_ACCESS_TOKEN environment variable is not set.');
  }
  try {
    /**
     * 判断缓存是否存在，如果存在，直接返回，否则请求数据并缓存
     */
    if (fs.existsSync(confPathname)) {
      // eslint-disable-next-line no-console
      signale.success('Configuration already exists.');
      const data = fs.readFileSync(confPathname, 'utf-8');
      return JSON.parse(data);
    }
    const { data, success } = await got
      .post(url, {
        json: {
          id: projectId,
        },
        headers: {
          Authorization: `Bearer ${CONFEE_ACCESS_TOKEN}`,
        },
      })
      .json<ConfeeResponse>();
    if (!success) {
      // noinspection ExceptionCaughtLocallyJS
      throw new Error('Failed to fetch configuration.');
    }

    if (cache) {
      /**
       * 如果文件夹不存在，则迭代创建
       */
      if (!fs.existsSync(confDir)) fs.mkdirSync(confDir, { recursive: true });

      fs.writeFileSync(confPathname, JSON.stringify(data));
      // 告知配置文件所在位置
      // eslint-disable-next-line no-console
      console.info('Success, config file path: ', confPathname);
    }

    return data;
  } catch (error) {
    console.error('Failed to fetch or save configuration: ', error);

    throw error;
  }
}
