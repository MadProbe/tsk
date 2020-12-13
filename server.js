import { readFileSync, statSync } from "fs";
import { extname, join } from "path";
import { createServer } from "http";
import { gzipSync } from "zlib";

const __dirname = process.cwd();
const content_type_for_ext = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".map": "application/json",
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
    ".png": "image/png"
}
const port = process.argv.find(arg => /^--port=\d\d+$/m.test(arg))?.match(/\d+$/gm)[0];
const $cache = {};
createServer((req, res) => {
    const path = join(__dirname, req.url === "/" ? "/index.html" : req.url);
    try {
        const { mtime, resp } = $cache[path] || {};
        const stats = statSync(path).mtimeMs;
        const ext = extname(path);
        const read = stats === mtime ? resp : ($cache[path] = { 
            resp: uncompressable_files[ext] ? readFileSync(path) : gzipSync(readFileSync(path)), 
            mtime: stats 
        }).resp;
        res.setHeader("Content-Type", content_type_for_ext[ext] || uncompressable_files[ext] || "text/plain");
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
    }
}).listen(port || 80);