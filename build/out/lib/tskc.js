var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { writeFileSync } from "fs";
import { createRequire } from "module";
import { dirname, extname, join, resolve } from "path";
import { pathToFileURL } from "url";
import compile from "./compiler.js";
import { log_errors } from "./utils/util.js";
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var args, outDir, mains, pretty, _i, mains_1, main, compiled, ext, newName;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (typeof global.require !== "function") {
                    global.require = createRequire(import.meta.url);
                }
                args = process.argv;
                outDir = /^--out=(.+)$/gm.exec(args.find(function (arg) { return /^--out=.+$/gm.test(arg); }))[1];
                mains = args.filter(function (arg) { return /^--main=.+$/gm.test(arg); }).map(function (arg) { return resolve(/^--main=(.+)$/gm.exec(arg)[1]); });
                pretty = args.includes("--pretty");
                _i = 0, mains_1 = mains;
                _a.label = 1;
            case 1:
                if (!(_i < mains_1.length)) return [3 /*break*/, 4];
                main = mains_1[_i];
                return [4 /*yield*/, compile(pathToFileURL(main), { pretty: pretty })];
            case 2:
                compiled = _a.sent();
                log_errors(compiled.diagnostics);
                ext = extname(main);
                newName = join(outDir, main.slice(dirname(main).length + 1, ext ? -ext.length : Infinity) + ".js");
                console.log(newName);
                writeFileSync(newName, compiled.output);
                _a.label = 3;
            case 3:
                _i++;
                return [3 /*break*/, 1];
            case 4: return [2 /*return*/];
        }
    });
}); })();
