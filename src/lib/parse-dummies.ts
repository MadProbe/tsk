// These wrappers needed for babel to complete and not hang (23 minutes and it couldn't finish the job, i checked)
import { _parse as _parse_, __parse as __parse__ } from "./parser.js";

export const __parse = __parse__;
export const _parse = _parse_;
export { __used, diagnostics } from "./parser.js";
