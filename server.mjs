#!/usr/bin/env -S node --experimental-import-meta-resolve --use-largepages=silent --experimental-json-modules --no-warnings --unhandled-rejections=warn
import { constants as FSConstants } from "fs";
import { extname, join } from "path";
import { createServer } from "http";
import { createSecureServer } from "http2";
import { brotliCompress, constants, gzip } from "zlib";
import { open, readFile } from "fs/promises";
import { promisify } from "util";
import { pathToFileURL } from "url";
import { argv, cwd } from "process";

const compressBrotli = promisify(brotliCompress);
const compressGzip = promisify(gzip);
const currentDirectoryOverrride = argv.find(x => x.startsWith("--dir="))?.slice(6);
const __dirname = currentDirectoryOverrride || cwd();
const content_type_for_ext = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".mjs": "application/javascript",
    ".cjs": "application/javascript",
    ".css": "text/css",
    ".map": "application/json",
    ".json": "application/json",
    ".webmanifest": "application/json",
};
const uncompressable_files = {
    ".ico": "image/png",
    ".flac": "audio/flac",
    ".m3u": "audio/mpegurl",
    ".m3u8": "audio/mpegurl",
    ".m4a": "audio/mp4",
    ".m4b": "audio/mp4",
    ".mp3": "audio/mpeg",
    ".ogg": "audio/ogg",
    ".opus": "audio/ogg",
    ".pls": "audio/x-scpls",
    ".wav": "audio/wav",
    ".jpg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".avif": "image/avif"
};
const contentTypeFromExt = ext => (content_type_for_ext[ext] && (content_type_for_ext[ext] + ";charset=utf-8")) ?? uncompressable_files[ext] ?? "text/plain;charset=utf-8";
const port = argv.find(arg => /^--port=\d{2,}$/m.test(arg))?.match(/\d+$/gm)?.[0];
const $cache = {};
const $cache3 = {};
const { settings } = await import(pathToFileURL(`${__dirname}/.serverconfig.json`), { assert: { type: "json" } }).then(x => x.default).catch(() => ({}));
/**@type {import("http").RequestListener} */
const http1RequestProcessor = async (req, res) => {
    const path = join(__dirname, req.url === "/" ? "/index.html" : req.url);
    const ext = extname(path);
    if (!~req.headers["accept-encoding"].indexOf("gzip")) {
        res.setHeader("Content-Type", contentTypeFromExt(ext));
        res.writeHead(200, "OK");
        res.end(await readFile(path));
        return;
    }
    var handle;
    try {
        handle = await open(path);
        const { mtime, compressed } = $cache[path] || {};
        const stats = await handle.stat({ bigint: true });
        const ext = extname(path);
        const read = stats === mtime ? compressed : ($cache[path] = {
            compressed: ext in uncompressable_files ? await handle.readFile() : await compressGzip(await handle.readFile(), { level: constants.Z_BEST_COMPRESSION }),
            mtime: stats.mtimeNs
        }).compressed;
        res.setHeader("Content-Type", contentTypeFromExt(ext));
        if (!uncompressable_files[ext]) {
            res.setHeader("Content-Encoding", "gzip");
        }
        res.writeHead(200, "OK");
        res.end(read);
    } catch (error) {
        if (error.code !== "ENOENT") {
            console.error(error);
        }
        res.writeHead(404, "Not found");
        res.end();
    } finally {
        await handle?.close();
    }
};
createServer(http1RequestProcessor).listen(settings?.http1?.port || port || 80);

createSecureServer({
    cert: await readFile(new URL(await import.meta.resolve("./server.crt"))),
    key: await readFile(new URL(await import.meta.resolve("./server.key")))
}, (req, res) => {
    const { httpVersion } = req;
    if (httpVersion !== '2.0') {
        return http1RequestProcessor(req, res);
    }
}).on("stream", async (stream, headers) => {
    const url = headers[":path"] === "/" ? "/index.html" : headers[":path"];
    const path = join(__dirname, url);
    let handle;

    try {
        stream.on('error', console.error);
        handle = await open(path);
        const { read, headers } = await readSaved(handle, path);

        if (stream.destroyed) return;
        stream.respond(headers);
        for (const _url of settings?.http2?.["push-paths"]?.[url] ?? []) {
            if (_url === url) {
                console.warn(`Weird configuration setting found: Ignoring attempt of self-push (url: "${url}")`);
                continue;
            }
            try {
                /**
                 * @type {import("http2").ServerHttp2Stream}
                 */
                const _stream = await new Promise((resolve, reject) => stream.pushStream({
                    ":path": _url
                }, (error, stream, headers) => error ? reject(error) : resolve(stream)));
                _stream.on('error', console.error);
                let read, headers, handle;
                try {
                    const path = join(__dirname, _url);
                    handle = await open(path, FSConstants.O_RDONLY);
                    ({ read, headers } = await readSaved(handle, path));
                } catch (error) {
                    handleError(error, _stream);
                } finally {
                    await handle?.close();
                }
                _stream.destroyed || _stream.respond(headers);
                _stream.destroyed || _stream.end(read);
            } catch (error) {
                console.error(error);
                continue;
            }
        }
        stream.destroyed || stream.end(read);
    } catch (error) {
        handleError(error, stream);
        return;
    } finally {
        await handle?.close();
    }
}).listen(settings?.http2?.port ?? 443);
const CSPPolicy = `upgrade-insecure-requests; default-src 'self' https:; script-src 'self' https: 'unsafe-inline' 'unsafe-eval'; style-src 'self' https: 'unsafe-inline'`;
/**
 * @param {import("fs/promises").FileHandle} handle 
 * @param {string} path 
 * @returns {Promise<{ read: Buffer, headers: import("http2").OutgoingHttpHeaders }>}
 */
async function readSaved(handle, path) {
    const stats = await handle.stat({ bigint: true });
    const ext = extname(path);
    let read, headers;
    if (ext in uncompressable_files) {
        const { mtime, buffer } = $cache3[path] ?? {};
        if (mtime !== stats.mtimeNs) {
            $cache3[path] = {
                mtime: stats.mtimeNs,
                buffer: read = await handle.readFile()
            };
        } else {
            read = buffer;
        }
        headers = {
            ':status': 200,
            "access-control-allow-origin": "*",
            'content-type': uncompressable_files[ext],
            'content-length': `${stats.size}`,
            'content-security-policy': CSPPolicy
        };
    } else {
        const { mtime, buffer } = $cache3[path] ?? {};
        if (mtime !== stats.mtimeNs) {
            $cache3[path] = {
                mtime: stats.mtimeNs,
                buffer: read = await compressBrotli(await handle.readFile())
            };
        } else {
            read = buffer;
        }
        headers = {
            ':status': 200,
            "access-control-allow-origin": "*",
            'content-type': `${content_type_for_ext[ext] ?? 'text/plain'}; charset=utf-8`,
            'content-length': `${stats.size}`,
            'content-encoding': 'br',
            'content-security-policy': CSPPolicy
        };
    }
    return { read, headers };
}

function handleError(error, stream) {
    if (error.code !== "ENOENT") {
        console.error(error);
    }
    if (!stream.destroyed) {
        stream.respond({
            ":status": 404,
            "content-type": "text/plain; charset=utf-8"
        });
        stream.end("FILE NOT FOUND");
    }
}

setTimeout(function self() { setTimeout(self, 1e6) }, 1e6);
