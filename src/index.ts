/**
 * LOLLang — a laughter-keyword language that transpiles to JavaScript.
 *
 * The public surface stays small on purpose:
 *
 *   import { unlulzcate, oblulzcate, run } from "lollang";
 *
 * Aliases (`transpile`, `obfuscate`) exist for those who don't speak laughter.
 */

export { unlulzcate, transpile } from "./unlulzcate.js";
export {
  oblulzcate,
  obfuscate,
  OblulzcateError,
  type OblulzcateOptions,
} from "./oblulzcate.js";
export { run, runFile, type RunOptions } from "./run.js";
export { startRepl, type ReplOptions } from "./repl.js";
export { KEYWORDS, REVERSE_KEYWORDS, type LolKeyword, type JsKeyword } from "./keywords.js";
