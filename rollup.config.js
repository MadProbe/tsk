// rollup.config.js
import typescript from '@rollup/plugin-typescript';
import { getBabelOutputPlugin } from '@rollup/plugin-babel';
import { readFileSync } from "fs";


export default {
    onwarn(warning) {
        if (warning.code !== 'CIRCULAR_DEPENDENCY') {
            console.error(`(!) ${ warning.message }`);
        }
    },
    input: 'src/lib/compiler.ts',
    output: [
        {
            file: './build/bundle.mjs',
            format: 'esm',
            sourcemap: true,
        },
        {
            file: './build/bundle.cjs',
            exports: "named",
            format: 'cjs',
        },
        {
            name: "tskc",
            file: './build/bundle.js',
            exports: "named",
            format: 'iife',
            sourcemap: true,
        },
        ...(+process.env.__TSK_BUNDLE_NO_MIN !== 0 ? [
            {
                name: "tskc",
                file: './build/bundle.min.js',
                exports: "named",
                format: 'iife',
                sourcemap: true,
                plugins: [getBabelOutputPlugin({
                    allowAllFormats: true,
                    ...JSON.parse(readFileSync('./.babelrc', "utf-8"))
                })],
            }, {
                file: './build/bundle.min.mjs',
                format: 'esm',
                sourcemap: true,
                plugins: [getBabelOutputPlugin({
                    allowAllFormats: true,
                    ...JSON.parse(readFileSync('./.babelrc', "utf-8"))
                })],
            }, {
                file: './build/bundle.min.cjs',
                exports: "named",
                format: 'cjs',
                sourcemap: true,
                plugins: [getBabelOutputPlugin({
                    allowAllFormats: true,
                    ...JSON.parse(readFileSync('./.babelrc', "utf-8"))
                })],
            }
        ] : [])

    ],
    plugins: [
        typescript()
    ]
};