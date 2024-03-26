import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'node:url';
import got from 'got';
import type { ConfeeResponse } from './type';
import * as process from 'process';
import signale = require('signale');

// 获取当前脚本的目录
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const confDir = path.join(__dirname, '..', 'node_modules', '.confee');
export const confPathname = path.join(confDir, 'config.json');

const CONFEE_ACCESS_TOKEN = (process.env.CONFEE_ACCESS_TOKEN = 'x');

export async function fetchAndSaveConfig(url: string, projectId: string) {
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

    /**
     * 如果文件夹不存在，则迭代创建
     */
    if (!fs.existsSync(confDir)) fs.mkdirSync(confDir, { recursive: true });

    fs.writeFileSync(confPathname, JSON.stringify(data));
    // 告知配置文件所在位置
    // eslint-disable-next-line no-console
    console.info('Success, config file path: ', confPathname);

    return data;
  } catch (error) {
    console.error('Failed to fetch or save configuration: ', error);

    throw error;
  }
}
