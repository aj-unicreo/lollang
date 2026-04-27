# lollang

> A laughter-keyword language that transpiles to JavaScript. Every keyword is a laugh.

[![CI](https://github.com/aj-unicreo/lollang/actions/workflows/ci.yml/badge.svg)](https://github.com/aj-unicreo/lollang/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/lollang.svg)](https://www.npmjs.com/package/lollang)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

```lol
haha factorial(n) {
    lmfao (n <= 1) { rofl 1; }
    rofl n * factorial(n - 1);
}

xd(factorial(6));   // 720
```

## What is it

LOLLang is a tiny language whose every keyword is a variant of laughter
(`haha`, `lol`, `rofl`, `kek`, `lmao`, …). It transpiles to JavaScript via a
direct token-substitution and is otherwise a strict subset of JS — the
operators, identifier rules, and expression grammar are all unchanged.

Two things make this package interesting:

- **`unlulzcate`** — translates `.lol` source to JavaScript. A single regex
  pass that preserves strings, template literals, and comments verbatim.
- **`oblulzcate`** — the inverse: JavaScript → LOL. AST-aware (via Acorn) so
  that `else if`, `console.log(…)`, and `undefined` references are handled
  correctly — things a naïve regex cannot do.

The full language spec is at [`docs/SPEC.md`](docs/SPEC.md).

## Install

```sh
npm install lollang
# or globally for the CLI
npm install -g lollang
```

Requires Node ≥ 18.

## CLI

```sh
lollang unlulzcate hello.lol -o hello.js     # LOL → JS
lollang oblulzcate hello.js  -o hello.lol    # JS  → LOL
lollang run        hello.lol                 # transpile + execute
lollang repl                                 # interactive lol> prompt
```

Stdin and stdout are first-class: pipe in, pipe out.

```sh
echo 'xd("hi");' | lollang unlulzcate
# → console.log("hi");

cat src/index.js | lollang oblulzcate > src/index.lol
```

Aliases: `transpile` ≡ `unlulzcate`, `obfuscate` ≡ `oblulzcate`.

## API

```ts
import { unlulzcate, oblulzcate, run, startRepl } from "lollang";

unlulzcate('xd("hi");');                      // 'console.log("hi");'
oblulzcate('console.log("hi");');             // 'xd("hi");'
await run("lol x = 41; x + 1;");              // 42
await startRepl();                            // interactive
```

`oblulzcate` accepts options for the asymmetric edges:

```ts
oblulzcate(source, {
  translateConsoleLog: false,   // keep console.log literal
  translateUndefined:  false,   // keep undefined literal
});
```

## Keyword map

| LOL         | JS            |     | LOL        | JS         |
| ----------- | ------------- | --- | ---------- | ---------- |
| `lol`       | `let`         |     | `lulz`     | `break`    |
| `lmao`      | `const`       |     | `jaja`     | `continue` |
| `haha`      | `function`    |     | `bahaha`   | `true`     |
| `rofl`      | `return`      |     | `mwahaha`  | `false`    |
| `lmfao`     | `if`          |     | `teehee`   | `null`     |
| `hehe`      | `else if`     |     | `imded`    | `undefined`|
| `kek`       | `else`        |     | `ahaha`    | `class`    |
| `hihi`      | `while`       |     | `omegalul` | `new`      |
| `heh`       | `for`         |     | `me`       | `this`     |
| `lolwut`    | `try`         |     | `kekw`     | `switch`   |
| `lolnope`   | `catch`       |     | `pepega`   | `case`     |
| `ded`       | `throw`       |     | `lulw`     | `default`  |
| `xd`        | `console.log` |     | `yoink`    | `import`   |
| `yeet`      | `export`      |     | `giggle`   | `async`    |
| `waitforit` | `await`       |     |            |            |

Identifiers that collide with keywords can be escaped with a `$` prefix:
`$haha` becomes the JS identifier `haha`.

## How it works

### `unlulzcate` (LOL → JS)

A single regex pass. The trick is the alternation order: string literals,
template literals, line comments, and block comments are matched **first**,
then the engine falls through to identifier-shaped tokens, then any
remaining single character. Only identifier tokens are looked up in the
keyword map, so `lol x = "haha";` cannot accidentally rewrite the word
inside the string.

```
"…" | '…' | `…` | // …  | /* … */  | $IDENT | \bIDENT\b | .
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^   ^^^^^^^   ^^^^^^^^^   ^
preserved verbatim                   escape    candidate   fallback
```

### `oblulzcate` (JS → LOL)

The inverse needs an AST because three rewrites are not local:

| Rewrite                             | Why an AST                                           |
| ----------------------------------- | ---------------------------------------------------- |
| `else if` → `hehe`                  | Two JS tokens with arbitrary whitespace between.     |
| `console.log(…)` → `xd(…)`          | Must rewrite the *callee* of a call, not every match.|
| `undefined` → `imded`               | Only value-position references; never property keys, member access, or binding names. |

Implementation: Acorn tokenizes the source for keyword-position edits, the
parser produces an AST for the three special cases, and edits are applied
right-to-left so offsets stay valid.

## Limitations

- **Reserved identifiers.** You can't name a binding after a laugh keyword
  in LOL source unless you escape it with `$` (e.g. `$haha`).
- **`console.log` only.** The reverse direction rewrites only the call form
  of `console.log`. Standalone references (`const f = console.log;`) stay
  literal — by design, because rewriting them as `xd` would change behavior
  if `console.log` were later reassigned.
- **No source maps.** v1 emits no source maps; line numbers may shift due
  to length-changing substitutions like `xd` ↔ `console.log`.
- **No type system.** Add `:type` annotations and strip them yourself if
  you want TypeScript-shaped hints.

## Development

```sh
npm install
npm run build       # tsup → dist/ (esm + cjs + .d.ts)
npm test            # vitest
npm run check       # lint + typecheck + test
npm run dev         # tsup --watch
```

Tests cover every spec example plus round-trip JS → LOL → JS for a corpus
of common shapes (classes, async, modules, switch, control flow).

## License

MIT © 2026 aj
