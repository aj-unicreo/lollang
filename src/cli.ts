#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { oblulzcate } from "./oblulzcate.js";
import { startRepl } from "./repl.js";
import { runFile } from "./run.js";
import { unlulzcate } from "./unlulzcate.js";

declare const __LOLLANG_VERSION__: string;
const VERSION = typeof __LOLLANG_VERSION__ === "string" ? __LOLLANG_VERSION__ : "0.0.0-dev";

const HELP = `lollang ${VERSION} — a laughter-keyword language

Usage:
  lollang unlulzcate <file>    Transpile LOL → JS  (alias: transpile)
  lollang oblulzcate <file>    Translate JS  → LOL (alias: obfuscate)
  lollang run        <file>    Transpile and execute a .lol file
  lollang repl                 Interactive lol> prompt

Options:
  -o, --output <file>          Write output to <file> (default: stdout)
      --no-console-log         oblulzcate only: keep console.log literal
      --no-undefined           oblulzcate only: keep undefined literal
  -h, --help                   Show this help
  -v, --version                Show version

Examples:
  lollang unlulzcate hello.lol -o hello.js
  cat hello.js | lollang oblulzcate > hello.lol
  lollang run examples/fizzbuzz.lol
  lollang repl
`;

interface ParsedArgs {
  command: string;
  positional: string[];
  output: string | null;
  flags: {
    noConsoleLog: boolean;
    noUndefined: boolean;
  };
  help: boolean;
  version: boolean;
}

function parseArgs(argv: string[]): ParsedArgs {
  const out: ParsedArgs = {
    command: "",
    positional: [],
    output: null,
    flags: { noConsoleLog: false, noUndefined: false },
    help: false,
    version: false,
  };

  let i = 0;
  while (i < argv.length) {
    const a = argv[i] ?? "";
    if (a === "-h" || a === "--help") {
      out.help = true;
    } else if (a === "-v" || a === "--version") {
      out.version = true;
    } else if (a === "-o" || a === "--output") {
      const next = argv[i + 1];
      if (next === undefined) die(`option ${a} requires an argument`);
      out.output = next;
      i++;
    } else if (a === "--no-console-log") {
      out.flags.noConsoleLog = true;
    } else if (a === "--no-undefined") {
      out.flags.noUndefined = true;
    } else if (a.startsWith("-") && a !== "-") {
      die(`unknown option: ${a}`);
    } else if (out.command === "") {
      out.command = a;
    } else {
      out.positional.push(a);
    }
    i++;
  }
  return out;
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : (chunk as Buffer));
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function readSource(
  positional: readonly string[],
): Promise<{ src: string; path: string | null }> {
  const arg = positional[0];
  if (!arg || arg === "-") {
    if (process.stdin.isTTY) {
      die("expected a file path or piped stdin");
    }
    const src = await readStdin();
    return { src, path: null };
  }
  const path = resolve(arg);
  return { src: readFileSync(path, "utf8"), path };
}

function emit(content: string, output: string | null): void {
  if (output) {
    writeFileSync(resolve(output), content);
  } else {
    process.stdout.write(content);
    if (!content.endsWith("\n")) process.stdout.write("\n");
  }
}

function die(message: string, code = 2): never {
  process.stderr.write(`lollang: ${message}\n`);
  process.exit(code);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.help && args.command === "") {
    process.stdout.write(HELP);
    return;
  }
  if (args.version) {
    process.stdout.write(`${VERSION}\n`);
    return;
  }
  if (args.command === "") {
    process.stdout.write(HELP);
    return;
  }

  switch (args.command) {
    case "unlulzcate":
    case "transpile": {
      if (args.help) {
        process.stdout.write("Usage: lollang unlulzcate <file.lol> [-o out.js]\n");
        return;
      }
      const { src } = await readSource(args.positional);
      emit(unlulzcate(src), args.output);
      return;
    }

    case "oblulzcate":
    case "obfuscate": {
      if (args.help) {
        process.stdout.write(
          "Usage: lollang oblulzcate <file.js> [-o out.lol] [--no-console-log] [--no-undefined]\n",
        );
        return;
      }
      const { src } = await readSource(args.positional);
      emit(
        oblulzcate(src, {
          translateConsoleLog: !args.flags.noConsoleLog,
          translateUndefined: !args.flags.noUndefined,
        }),
        args.output,
      );
      return;
    }

    case "run": {
      const file = args.positional[0];
      if (!file) die("`run` requires a file path");
      await runFile(file);
      return;
    }

    case "repl": {
      await startRepl();
      return;
    }

    case "help":
      process.stdout.write(HELP);
      return;

    default:
      die(`unknown command: ${args.command}\n\n${HELP}`);
  }
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  process.stderr.write(`lollang: ${msg}\n`);
  process.exit(1);
});
