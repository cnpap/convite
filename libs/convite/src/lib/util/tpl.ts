import * as ts from 'typescript';
import { v4 } from 'uuid';
import * as ejs from 'ejs';
import { ConfeeData } from '../type';

type TplCodeRefiningResult = {
  replaced: string;
  prescripts: Record<string, string>;
  templates: Record<string, string>;
};

type TrimHelpCommentOptions = {
  /**
   * 原代码
   */
  code: string;
  /**
   * 提炼代码以后的记录
   */
  record: Record<string, string>;
  /**
   * 正则
   */
  reg: RegExp;
  /**
   * 需要替换头尾的代码
   */
  trims: RegExp[];
  /**
   * 是否转换到 js 代码
   */
  transToJs?: boolean;
};

/**
 * 将掐头去尾的功能独立出来
 */
const trimHelpComment = (options: TrimHelpCommentOptions) => {
  const matched = options.code.match(options.reg) || [];
  if (matched.length) {
    for (let match of matched) {
      const id = v4();
      options.code = options.code.replace(match, id);
      for (const tr of options.trims) {
        match = match.replace(tr, '');
      }
      if (options.transToJs) {
        match = tplToJsCode(match);
      }
      // 防止正则的 trim 不干净
      match = match.trim();
      options.record[id] = match;
    }
  }
  return options.code;
};

/**
 * 提炼代码
 *
 * ps1: 将代码中的 tpl 注释提炼出来，所有的 tpl 注释都可能存在多份，所以提炼的正则应该以 /g 结尾
 * ps2: 提炼时需要注意，代码可能以 ; , 结尾，需要去掉
 * ps3: 尽量去除前后换行符，虽然耗费性能，但是可以保证代码的干净，这部分性能其实也最终会从代码的可读性、toJsCode 的性能损耗中得到回报
 *
 * @param code
 * @param id
 */
export function tplCodeRefining(
  code: string,
  id: string
): TplCodeRefiningResult {
  const templates: Record<string, string> = {};
  const prescripts: Record<string, string> = {};

  code = trimHelpComment({
    code,
    record: prescripts,
    reg: /confee\.preTpl\(\)(;?)([\s\S]*?)confee\.preTplEnd\(\)(;?)/g,
    trims: [
      /[\n\s]*confee\.preTpl\(\)(;?)[\n\s]+/,
      /[\n\s]+confee\.preTplEnd\(\)(;?)[\n\s]*/,
    ],
    transToJs: true,
  });

  code = trimHelpComment({
    code,
    record: prescripts,
    reg: /confee\.preTpl(;?)([\s\S]*?)confee\.preTplEnd(;?)/g,
    trims: [
      /[\n\s]*confee\.preTpl(;?)[\n\s]+/,
      /[\n\s]*confee\.preTplEnd(;?)[\n\s]*/,
    ],
    transToJs: true,
  });

  /**
   * 也许可以直接从文件类型判断该怎么正则
   */

  const ext = id.split('.').pop();
  if (ext === 'vue') {
    /**
     * vue 就是判断以 endTpl 结尾
     *
     * <!--
     * ... any code
     * tpl-->
     *
     * 修复 /<!--([\s\S]+)endTpl-->/g 可能贪婪匹配的问题
     */
    code = trimHelpComment({
      code,
      record: templates,
      reg: /<!--([\s\S]*?)tpl-->/g,
      trims: [/[\n\s]*<!--[\n\s]+/, /[\n\s]*tpl-->[\n\s]*/],
    });
  }
  // {/*
  // ... any code
  // tpl*/}
  code = trimHelpComment({
    code,
    record: templates,
    reg: /{\/\*([\s\S]*?)tpl\*\/}/g,
    trims: [/[\n\s]*{\/\*[\n\s]+/, /[\n\s]*tpl\*\/}[\n\s]*/],
  });

  // 还有一种情况是直接在代码中写注释，这种情况下需要提取到 templates
  //
  // /**
  // ... any code
  // tpl*/
  //
  // 这个需要额外考虑一下，首先去除 /** 和 tpl*/
  // 然后还要去除每一行的 *
  code = trimHelpComment({
    code,
    record: templates,
    reg: /\/\*\*([\s\S]*?)tpl\*\//g,
    trims: [
      /[\n\s]*\/\*\*[\n\s]+/,
      /[\n\s]*tpl\*\/[\n\s]*/,
      /[\n\s]*\*[\n\s]+/g,
    ],
  });

  /**
   * 也允许以函数调用的形式告知
   *
   * confee.tpl(`
   * ... any code
   * tpl`)
   */
  code = trimHelpComment({
    code,
    record: templates,
    reg: /confee\.tpl\(`([\s\S]*?)tpl`\)/g,
    trims: [/[\n\s]*confee\.tpl\(`[\n\s]+/, /[\n\s]*tpl`\)[;,\n\s]*/],
  });

  return {
    replaced: code,
    prescripts,
    templates,
  };
}

/**
 * 使用 TypeScript 编译器 API 转换 TS 代码到 JS
 */
export function tplToJsCode(code: string) {
  return ts.transpileModule(code, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      noImplicitAny: true,
      target: ts.ScriptTarget.ES5,
    },
  }).outputText;
}

type TplCallbableOptions = TplCodeRefiningResult & {
  confee: ConfeeData;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  global?: Record<string, any>;
};

export function tplCallbable({
  replaced,
  templates,
  prescripts,
  ...rest
}: TplCallbableOptions) {
  for (const id in prescripts) {
    const code = prescripts[id];
    replaced = replaced.replace(
      id,
      `\
<%
${code}
%>`
    );
  }
  for (const id in templates) {
    const code = templates[id];
    replaced = replaced.replace(id, code);
  }
  return ejs.render(replaced, { ...rest });
}
