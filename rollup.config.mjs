import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';


const plugin_terser = terser({ format: { comments: false }, mangle: { toplevel: true, module: true }, compress: { passes: 4, unsafe_undefined: true } });
export default {
    onwarn(warning) {
        if (warning.code !== 'CIRCULAR_DEPENDENCY') {
            console.error(`(!) ${warning.message}`);
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
                plugins: [plugin_terser],
            }, {
                file: './build/bundle.min.mjs',
                format: 'esm',
                sourcemap: true,
                plugins: [plugin_terser]
            }, {
                file: './build/bundle.min.cjs',
                exports: "named",
                format: 'cjs',
                sourcemap: true,
                plugins: [plugin_terser],
            }
        ] : [])

    ],
    plugins: [
        typescript({ useTsconfigDeclarationDir: true })
    ]
};