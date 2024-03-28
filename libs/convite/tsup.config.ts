import { defineConfig } from 'tsup';

// noinspection JSUnusedGlobalSymbols
export default defineConfig(async () => {
  return [
    {
      entry: ['./src/index.ts'],
      sourcemap: false,
      clean: true,
      bundle: true,
      treeshake: false,
      outDir: 'dist/libs/convite/src',
      dts: true,
      format: ['cjs'],
    },
  ];
});
