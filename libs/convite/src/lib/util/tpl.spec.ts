import { tplCallbable, tplCodeRefining } from './tpl';

const hello = `const hello: string = 'hello';`;

describe('tpl', () => {
  it('prescript should word', () => {
    const { prescripts } = tplCodeRefining(
      `\
一些无关紧要的样本
confee.preTpl
${hello}
confee.preTplEnd;
一些无关紧要的样本

一些无关紧要的样本
confee.preTpl();
${hello}
confee.preTplEnd()
一些无关紧要的样本
`,
      'xxx.vue'
    );
    const result = "var hello = 'hello';";
    expect(Object.values(prescripts)[0]).toBe(result);
    expect(Object.values(prescripts)[1]).toBe(result);
  });

  it('ts template should word', () => {
    const { templates } = tplCodeRefining(
      `\
一些无关紧要的样本
/**
 ${hello}
 endTpl*/
一些无关紧要的样本

一些无关紧要的样本
/**
 * ${hello}
 endTpl*/
一些无关紧要的样本
`,
      'xxx.vue'
    );
    expect(Object.values(templates)[0]).toBe(hello);
    expect(Object.values(templates)[1]).toBe(hello);
  });

  it('vue template should word', () => {
    const { templates } = tplCodeRefining(
      `\
一些无关紧要的样本
<!--
 ${hello}
  endTpl-->
一些无关紧要的样本


一些无关紧要的样本
<!--
 ${hello}
  endTpl-->
一些无关紧要的样本
`,
      'xxx.vue'
    );
    expect(Object.values(templates)[0]).toBe(hello);
    expect(Object.values(templates)[1]).toBe(hello);
  });

  it('callbable should word', () => {
    const result = tplCallbable({
      replaced: `\
prescript1

prescript2

ts template1

ts template2

vue template1

vue template2
`,
      prescripts: {
        prescript1: 'var hello = "hello";',
        prescript2: 'var word = "word";',
      },
      templates: {
        'ts template1': '<%= hello %>',
        'ts template2': '<%= word %>',
        'vue template1': '<%= hello %>',
        'vue template2': '<%= word %>',
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      confeeData: {} as any,
    });

    expect(result).toBe('\n\n\n\nhello\n\nword\n\nhello\n\nword\n');
  });
});
