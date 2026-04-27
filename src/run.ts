import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { runInThisContext } from "node:vm";
import { unlulzcate } from "./unlulzcate.js";

export interface RunOptions {
  /**
   * Treat the source as an ES module (supports `yoink` / `yeet` / top-level
   * `waitforit`). Default: auto-detected by sniffing for module syntax.
   */
  module?: boolean;
  /** Override the file path used for stack traces. */
  filename?: string;
}

/** Detect ES-module syntax via cheap textual heuristics. */
function looksLikeModule(lol: string): boolean {
  // After unlulzcate the source becomes JS, but checking the LOL form is
  // cheaper and correct enough — any of these tokens force module mode.
  return /\b(yoink|yeet|waitforit)\b/.test(lol);
}

/**
 * Transpile and execute LOLLang source. ES-module sources are written to a
 * sibling temp file so relative imports resolve against the input's
 * directory; script sources run in-process via vm.runInThisContext.
 */
export async function run(source: string, opts: RunOptions = {}): Promise<unknown> {
  const js = unlulzcate(source);
  const isModule = opts.module ?? looksLikeModule(source);
  const filename = opts.filename ?? "<lollang>";

  if (!isModule) {
    return runInThisContext(js, { filename });
  }

  // Module path: dynamic-import a temp .mjs file. Place it next to the input
  // when possible so relative imports from the LOL file still resolve.
  const baseDir = opts.filename
    ? dirname(resolve(opts.filename))
    : mkdtempSync(join(tmpdir(), "lollang-"));
  const tmpPath = join(baseDir, `.__lollang_${process.pid}_${Date.now()}__.mjs`);
  writeFileSync(tmpPath, js);
  try {
    return await import(pathToFileURL(tmpPath).href);
  } finally {
    try {
      rmSync(tmpPath, { force: true });
    } catch {
      // best-effort cleanup
    }
  }
}

/** Convenience: read a `.lol` file from disk and run it. */
export async function runFile(
  path: string,
  opts: Omit<RunOptions, "filename"> = {},
): Promise<unknown> {
  const abs = resolve(path);
  const src = readFileSync(abs, "utf8");
  return run(src, { ...opts, filename: abs });
}
