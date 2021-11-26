#!/usr/bin/env -S node --use-largepages=silent --enable-source-maps
import { writeFileSync } from "fs";
import { createRequire } from "module";
import { dirname, extname, join, resolve } from "path";
import { argv } from "process";
import { pathToFileURL } from "url";
// @ts-expect-error
import compile from "./bundle.min.mjs";


process.on("unhandledRejection", console.error.bind(console, "Error: "));
function log_errors(errors: any[]) {
    if (errors && errors.length) {
        for (var index = 0; index < errors.length; index++) {
            console.error("TSK Error:", errors[index]);
        }
    }
}
if (typeof global.require !== "function") {
    global.require = createRequire(new URL(import.meta.url));
}
const outDir = /^--out=(.+)$/gm.exec(argv.find(arg => /^--out=.+$/gm.test(arg))!)![1];
const mains = argv.filter(arg => /^--main=.+$/gm.test(arg) || /^[^|*?\\<>$:"\r\n-]{2,}[^|*?\\<>$:"\r\n]*$/gm.test(arg) && arg !== ".").map(arg => resolve(/^--main=(.+)$/gm.exec(arg)?.[1] ?? arg));
const pretty = argv.includes("--pretty");
for (const main of mains) {
    const compiled = await compile(pathToFileURL(main), { pretty });
    log_errors(compiled.diagnostics);
    const ext = extname(main);
    const newName = join(outDir, main.slice(dirname(main).length + 1, ext ? -ext.length : Infinity) + ".js");
    // console.log(newName); // debug shit
    writeFileSync(newName, compiled.output);
}

