import repl from "node:repl";
import { runInThisContext } from "node:vm";
import { unlulzcate } from "./unlulzcate.js";

export interface ReplOptions {
  prompt?: string;
  stdin?: NodeJS.ReadableStream;
  stdout?: NodeJS.WritableStream;
}

/**
 * Start an interactive LOLLang REPL. Each input line is transpiled to JS
 * with `unlulzcate` and evaluated in a shared VM context, so `lmao` and
 * `lol` bindings persist across statements.
 *
 * Resolves when the user exits (.exit or EOF).
 */
export function startRepl(opts: ReplOptions = {}): Promise<void> {
  return new Promise((resolveExit) => {
    const server = repl.start({
      prompt: opts.prompt ?? "lol> ",
      input: opts.stdin ?? process.stdin,
      output: opts.stdout ?? process.stdout,
      terminal: process.stdout.isTTY === true,
      useColors: process.stdout.isTTY === true,
      eval(input, _ctx, file, cb) {
        const trimmed = input.trim();
        if (trimmed === "") {
          cb(null, undefined);
          return;
        }
        try {
          const js = unlulzcate(trimmed);
          const result: unknown = runInThisContext(js, { filename: file });
          cb(null, result);
        } catch (err) {
          if (isRecoverable(err)) {
            cb(new repl.Recoverable(err as Error), undefined);
          } else {
            cb(err as Error, undefined);
          }
        }
      },
    });
    server.on("exit", () => resolveExit());
  });
}

/**
 * Detect parse errors that mean "the user is mid-expression"; the REPL
 * should accept another line of input rather than print the error.
 */
function isRecoverable(err: unknown): boolean {
  if (!(err instanceof SyntaxError)) return false;
  return /\b(Unexpected end of input|Unterminated)\b/.test(err.message);
}
