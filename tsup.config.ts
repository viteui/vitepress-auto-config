import { defineConfig } from 'tsup'


export default defineConfig({
    entry: {
        index: 'src/index.ts',
        bin: 'src/bin/index.ts'
    },
    splitting: false,
    sourcemap: false,
    clean: true,
    // 输出esm，cjs，iife
    format: ['esm', 'cjs'],
    // 生成d.ts文件
    dts: true,
})